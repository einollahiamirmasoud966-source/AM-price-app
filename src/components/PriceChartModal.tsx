import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, RefreshCw, X } from 'lucide-react';
import { ASSET_MAP } from '../data/catalog';
import { TEXT } from '../data/i18n';
import type { HistoryPoint, Language, LiveQuote } from '../types/market';
import { formatPercent, formatToman, parseHistoryRows, toPersianDigits } from '../utils/marketMath';
import { AssetEmblem } from './AssetEmblem';

interface PriceChartModalProps {
  slug: string | null;
  quote?: LiveQuote;
  lang: Language;
  persianDigits: boolean;
  onClose: () => void;
}

export const PriceChartModal: React.FC<PriceChartModalProps> = ({
  slug,
  quote,
  lang,
  persianDigits,
  onClose,
}) => {
  const t = TEXT[lang];
  const [days, setDays] = useState<7 | 30 | 90 | 365>(30);
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const asset = slug ? ASSET_MAP[slug] : null;

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setError(null);
    setHoverIdx(null);

    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/history/${encodeURIComponent(slug)}?days=${days}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { points?: HistoryPoint[] };
        if (active && Array.isArray(json.points)) {
          setPoints(json.points);
          setLoading(false);
          return;
        }
        throw new Error('Invalid history payload');
      } catch (err) {
        // Fallback for standalone APK WebView if relative /api/ is unavailable
        try {
          const directRes = await fetch(
            `https://api.tgju.org/v1/market/indicator/summary-table-data/${encodeURIComponent(slug)}?lang=fa&order_dir=desc&length=${days}&start=0`,
          );
          if (!directRes.ok) throw new Error('Upstream error');
          const directJson = (await directRes.json()) as { data?: string[][] };
          const parsed = parseHistoryRows(directJson.data || []);
          if (active) {
            setPoints(parsed);
            setLoading(false);
          }
        } catch {
          if (active) {
            setError(err instanceof Error ? err.message : t.chartError);
            setLoading(false);
          }
        }
      }
    };

    void loadHistory();
    return () => {
      active = false;
    };
  }, [slug, days, reloadNonce, t.chartError]);

  const chartStats = useMemo(() => {
    if (points.length === 0) return null;
    const closes = points.map((p) => p.closeToman);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const first = closes[0];
    const last = closes[closes.length - 1];
    const diff = last - first;
    const pct = first > 0 ? (diff / first) * 100 : 0;
    return { min, max, first, last, diff, pct };
  }, [points]);

  if (!slug || !asset) return null;

  const activePoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : points[points.length - 1];
  const title = lang === 'fa' ? asset.nameFa : asset.nameEn;

  // Build SVG path
  const W = 640;
  const H = 240;
  const PAD_X = 12;
  const PAD_Y = 20;

  let linePath = '';
  let areaPath = '';
  const coords: Array<{ x: number; y: number }> = [];

  if (points.length > 1 && chartStats) {
    const span = chartStats.max - chartStats.min || 1;
    points.forEach((pt, idx) => {
      const x = PAD_X + (idx / (points.length - 1)) * (W - PAD_X * 2);
      const y = H - PAD_Y - ((pt.closeToman - chartStats.min) / span) * (H - PAD_Y * 2);
      coords.push({ x, y });
    });
    linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${H} L ${coords[0].x.toFixed(1)} ${H} Z`;
  } else if (points.length === 1) {
    coords.push({ x: W / 2, y: H / 2 });
    linePath = `M ${PAD_X} ${H / 2} L ${W - PAD_X} ${H / 2}`;
    areaPath = `${linePath} L ${W - PAD_X} ${H} L ${PAD_X} ${H} Z`;
  }

  const isPeriodUp = (chartStats?.diff ?? 0) >= 0;
  const strokeColor = isPeriodUp ? '#10b981' : '#f43f5e';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chart-modal-title"
      data-testid="price-chart-modal"
    >
      <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <AssetEmblem asset={asset} lang={lang} size="md" />
            <div className="min-w-0">
              <h2 id="chart-modal-title" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                {title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.chartTitle} · tgju.org
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Active price & Period buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums-data">
                  {activePoint
                    ? formatToman(activePoint.closeToman, lang, persianDigits)
                    : quote
                      ? formatToman(quote.priceToman, lang, persianDigits)
                      : '---'}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.toman}
                </span>
              </div>
              {activePoint && (
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums-data">
                  <span>
                    {lang === 'fa' ? toPersianDigits(activePoint.dateJalali) : activePoint.dateGregorian}
                  </span>
                  {chartStats && (
                    <span
                      className={`inline-flex items-center gap-0.5 font-semibold ${
                        isPeriodUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isPeriodUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {formatPercent(chartStats.pct, lang, persianDigits)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 self-start">
              {(
                [
                  [7, t.chartPeriod7],
                  [30, t.chartPeriod30],
                  [90, t.chartPeriod90],
                  [365, t.chartPeriod365],
                ] as const
              ).map(([d, label]) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    days === d
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-3 min-h-[240px] flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                <span>{t.chartLoading}</span>
              </div>
            ) : error ? (
              <div className="text-center space-y-2">
                <p className="text-sm text-rose-600 dark:text-rose-400">{t.chartError}</p>
                <button
                  type="button"
                  onClick={() => setReloadNonce((n) => n + 1)}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold cursor-pointer"
                >
                  {t.retry}
                </button>
              </div>
            ) : points.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.chartError}</p>
            ) : (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-56 overflow-visible select-none"
                onMouseLeave={() => setHoverIdx(null)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relX = (e.clientX - rect.left) / rect.width;
                  const idx = Math.max(
                    0,
                    Math.min(points.length - 1, Math.round(relX * (points.length - 1))),
                  );
                  setHoverIdx(idx);
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  if (!touch) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relX = (touch.clientX - rect.left) / rect.width;
                  const idx = Math.max(
                    0,
                    Math.min(points.length - 1, Math.round(relX * (points.length - 1))),
                  );
                  setHoverIdx(idx);
                }}
              >
                <defs>
                  <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal subtle grid lines */}
                {[0.25, 0.5, 0.75].map((ratio) => (
                  <line
                    key={ratio}
                    x1={PAD_X}
                    x2={W - PAD_X}
                    y1={H * ratio}
                    y2={H * ratio}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                <path d={areaPath} fill="url(#chartAreaGrad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {hoverIdx !== null && coords[hoverIdx] && (
                  <>
                    <line
                      x1={coords[hoverIdx].x}
                      x2={coords[hoverIdx].x}
                      y1={0}
                      y2={H}
                      stroke={strokeColor}
                      strokeDasharray="3 3"
                      strokeWidth="1.2"
                    />
                    <circle
                      cx={coords[hoverIdx].x}
                      cy={coords[hoverIdx].y}
                      r="5"
                      fill={strokeColor}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  </>
                )}
              </svg>
            )}
            {!loading && !error && chartStats && (
              <>
                <span className="pointer-events-none absolute top-2 start-3 text-[10px] font-mono text-slate-400 dark:text-slate-500 tabular-nums-data">
                  {formatToman(chartStats.max, lang, persianDigits)}
                </span>
                <span className="pointer-events-none absolute bottom-2 start-3 text-[10px] font-mono text-slate-400 dark:text-slate-500 tabular-nums-data">
                  {formatToman(chartStats.min, lang, persianDigits)}
                </span>
              </>
            )}
          </div>

          {/* OHLC Summary Row */}
          {activePoint && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              {(
                [
                  [t.chartOpen, activePoint.openToman],
                  [t.chartHigh, activePoint.highToman],
                  [t.chartLow, activePoint.lowToman],
                  [t.chartClose, activePoint.closeToman],
                ] as const
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5"
                >
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
                  <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white tabular-nums-data">
                    {formatToman(val, lang, persianDigits)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
