import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const ALLOWED_SLUG_RE = /^[a-z0-9_-]{2,45}$/i;
const TGJU_AJAX_URL = 'https://call.tgju.org/ajax.json';

interface TgjuEntry {
  p?: string | number;
  h?: string | number;
  l?: string | number;
  d?: string | number;
  dp?: number | string;
  dt?: string;
  t?: string;
  t_en?: string;
  ts?: string;
}

interface MarketsCache {
  fetchedAt: number;
  current: Record<string, TgjuEntry>;
}

interface SummaryCacheEntry {
  fetchedAt: number;
  row: string[] | null;
}

interface HistoryCacheEntry {
  fetchedAt: number;
  data: unknown;
}

let marketsCache: MarketsCache | null = null;
const summaryCache = new Map<string, SummaryCacheEntry>();
const historyCache = new Map<string, HistoryCacheEntry>();

const MARKETS_TTL_MS = 15_000;
const SUMMARY_TTL_MS = 60_000;
const HISTORY_TTL_MS = 60_000;

function parseNum(value: string | number | undefined | null): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const cleaned = String(value).replace(/<[^>]*>/g, '').replace(/,/g, '').replace(/%/g, '').trim();
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDirection(str: string | undefined | null): 'up' | 'down' | 'neutral' {
  const s = String(str ?? '').toLowerCase();
  if (s.includes('high') || s.includes('up')) return 'up';
  if (s.includes('low') || s.includes('down')) return 'down';
  return 'neutral';
}

async function fetchTgjuAjax(forceRefresh = false): Promise<MarketsCache> {
  const now = Date.now();
  if (!forceRefresh && marketsCache && now - marketsCache.fetchedAt < MARKETS_TTL_MS) {
    return marketsCache;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(TGJU_AJAX_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GheimatAlan/1.0)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`TGJU ajax returned ${res.status}`);
    }
    const json = (await res.json()) as { current?: Record<string, TgjuEntry> };
    if (!json || typeof json.current !== 'object') {
      throw new Error('Invalid TGJU ajax payload');
    }
    marketsCache = { fetchedAt: Date.now(), current: json.current };
    return marketsCache;
  } catch (err) {
    if (marketsCache) {
      return marketsCache;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLatestSummaryRow(slug: string): Promise<string[] | null> {
  if (!ALLOWED_SLUG_RE.test(slug)) return null;
  const now = Date.now();
  const cached = summaryCache.get(slug);
  if (cached && now - cached.fetchedAt < SUMMARY_TTL_MS) {
    return cached.row;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const url = `https://api.tgju.org/v1/market/indicator/summary-table-data/${encodeURIComponent(slug)}?lang=fa&order_dir=desc&length=2&start=0`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      summaryCache.set(slug, { fetchedAt: now, row: cached?.row ?? null });
      return cached?.row ?? null;
    }
    const json = (await res.json()) as { data?: string[][] };
    const row = Array.isArray(json.data) && json.data.length > 0 ? json.data[0] : null;
    summaryCache.set(slug, { fetchedAt: now, row });
    return row;
  } catch {
    return cached?.row ?? null;
  } finally {
    clearTimeout(timer);
  }
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json());

  // Allow Capacitor / mobile WebView origins cleanly
  app.use('/api', (_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/markets', async (req, res) => {
    try {
      const force = req.query.refresh === '1';
      const rawSlugs = typeof req.query.slugs === 'string' ? req.query.slugs : '';
      const requestedSlugs = rawSlugs
        .split(',')
        .map((s) => s.trim())
        .filter((s) => ALLOWED_SLUG_RE.test(s))
        .slice(0, 90);

      const cache = await fetchTgjuAjax(force);
      const current = cache.current;

      // Determine which slugs to return and enrich with yesterday's real change when ajax d==0
      const targetSlugs =
        requestedSlugs.length > 0
          ? requestedSlugs
          : [
              'rob',
              'nim',
              'sekeb',
              'geram18',
              'geram24',
              'crypto-tether-irr',
              'crypto-bitcoin-irr',
              'crypto-ethereum-irr',
              'crypto-binance-coin-irr',
              'crypto-solana-irr',
              'price_dollar_rl',
              'price_eur',
              'price_gbp',
              'price_aed',
              'price_try',
              'price_cad',
              'price_aud',
              'price_chf',
              'price_cny',
              'price_jpy',
            ];

      const slugsNeedingSummary = targetSlugs.filter((slug) => {
        const entry = current[slug];
        if (!entry) return false;
        return parseNum(entry.d) === 0 && parseNum(entry.dp) === 0;
      });

      // Enrich up to 25 items in parallel to keep response fast (<500ms)
      const enrichSlugs = slugsNeedingSummary.slice(0, 25);
      const summaryEntries = await Promise.all(
        enrichSlugs.map(async (slug) => [slug, await fetchLatestSummaryRow(slug)] as const),
      );
      const summaryMap = Object.fromEntries(summaryEntries);

      // Build response dictionary for all requested slugs + USD crypto equivalents
      const quotes: Record<string, unknown> = {};
      const usdKeys = [
        'crypto-tether',
        'crypto-bitcoin',
        'crypto-ethereum',
        'crypto-binance-coin',
        'crypto-solana',
      ];

      const allToEmit = new Set([...targetSlugs, ...usdKeys]);
      for (const key of Object.keys(current)) {
        if (
          key.startsWith('price_') ||
          ['rob', 'nim', 'sekeb', 'geram18', 'geram24'].includes(key) ||
          key.startsWith('crypto-')
        ) {
          allToEmit.add(key);
        }
      }

      for (const slug of allToEmit) {
        const entry = current[slug];
        if (!entry) continue;

        const isUsdOnly = usdKeys.includes(slug);
        if (isUsdOnly) {
          quotes[slug] = {
            p: entry.p,
            dp: entry.dp,
            dt: entry.dt,
          };
          continue;
        }

        const priceToman = parseNum(entry.p) / 10;
        const highToman = parseNum(entry.h) / 10 || priceToman;
        const lowToman = parseNum(entry.l) / 10 || priceToman;

        let changeToman = 0;
        let changePercent = 0;
        let direction: 'up' | 'down' | 'neutral' = 'neutral';

        const ajaxD = parseNum(entry.d) / 10;
        const ajaxDp = parseNum(entry.dp);
        const ajaxDt = parseDirection(entry.dt);

        if (ajaxD !== 0 || ajaxDp !== 0) {
          direction = ajaxDt === 'neutral' ? (ajaxD > 0 ? 'up' : ajaxD < 0 ? 'down' : 'neutral') : ajaxDt;
          const sign = direction === 'down' ? -1 : 1;
          changeToman = Math.abs(ajaxD) * sign;
          changePercent = Math.abs(ajaxDp) * sign;
        } else {
          const row = summaryMap[slug];
          if (row && row.length >= 6) {
            const dir = parseDirection(row[4] || row[5]);
            const amt = Math.abs(parseNum(row[4]) / 10);
            const pct = Math.abs(parseNum(row[5]));
            direction = dir;
            const sign = dir === 'down' ? -1 : 1;
            changeToman = amt === 0 ? 0 : amt * sign;
            changePercent = pct === 0 ? 0 : pct * sign;
          }
        }

        quotes[slug] = {
          slug,
          priceToman,
          highToman,
          lowToman,
          changeToman,
          changePercent,
          direction,
          updatedAtFa: entry.t || '',
          updatedAtEn: entry.t_en || '',
          timestamp: entry.ts || '',
        };
      }

      res.json({
        source: 'tgju.org',
        fetchedAt: new Date(cache.fetchedAt).toISOString(),
        quotes,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch live TGJU prices';
      res.status(502).json({ error: message });
    }
  });

  app.get('/api/history/:slug', async (req, res) => {
    const { slug } = req.params;
    if (!ALLOWED_SLUG_RE.test(slug)) {
      res.status(400).json({ error: 'Invalid asset slug' });
      return;
    }
    const daysRaw = Number(req.query.days) || 30;
    const days = Math.max(7, Math.min(365, Math.floor(daysRaw)));
    const cacheKey = `${slug}:${days}`;
    const now = Date.now();
    const cached = historyCache.get(cacheKey);
    if (cached && now - cached.fetchedAt < HISTORY_TTL_MS) {
      res.json(cached.data);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const url = `https://api.tgju.org/v1/market/indicator/summary-table-data/${encodeURIComponent(slug)}?lang=fa&order_dir=desc&length=${days}&start=0`;
      const upstream = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!upstream.ok) {
        res.status(502).json({ error: `TGJU history returned ${upstream.status}` });
        return;
      }
      const json = (await upstream.json()) as { data?: string[][] };
      const rows = Array.isArray(json.data) ? json.data : [];
      const points = rows
        .filter((r) => Array.isArray(r) && r.length >= 8)
        .map((r) => {
          const dir = parseDirection(r[4] || r[5]);
          const sign = dir === 'down' ? -1 : 1;
          const amt = Math.abs(parseNum(r[4]) / 10);
          const pct = Math.abs(parseNum(r[5]));
          return {
            openToman: parseNum(r[0]) / 10,
            lowToman: parseNum(r[1]) / 10,
            highToman: parseNum(r[2]) / 10,
            closeToman: parseNum(r[3]) / 10,
            changeToman: amt === 0 ? 0 : amt * sign,
            changePercent: pct === 0 ? 0 : pct * sign,
            direction: dir,
            dateGregorian: r[6],
            dateJalali: r[7],
          };
        })
        .filter((p) => p.closeToman > 0)
        .reverse();

      const payload = { slug, days, points, fetchedAt: new Date().toISOString() };
      historyCache.set(cacheKey, { fetchedAt: now, data: payload });
      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch history';
      res.status(502).json({ error: message });
    } finally {
      clearTimeout(timer);
    }
  });

  if (IS_PROD) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for SPA navigation in dev mode
    app.use('*', async (req, res, next) => {
      try {
        const htmlPath = path.resolve(__dirname, 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Gheimat Alan server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
