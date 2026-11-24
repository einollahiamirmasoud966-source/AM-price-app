import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { ASSET_MAP } from './data/catalog';
import { TEXT } from './data/i18n';
import type { AppSettings, LiveQuote, WidgetConfig } from './types/market';
import { buildQuoteFromTgju, type TgjuCurrentEntry } from './utils/marketMath';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import { TopBar, type AppTab } from './components/TopBar';
import { MarketGrid } from './components/MarketGrid';
import { AssetPickerModal } from './components/AssetPickerModal';
import { PriceChartModal } from './components/PriceChartModal';
import { CalculatorView } from './components/CalculatorView';
import { WidgetPreviewCard, WidgetStudioView } from './components/WidgetStudioView';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_WATCHLIST = 'gheimat_alan_watchlist_v1';
const STORAGE_SETTINGS = 'gheimat_alan_settings_v1';
const STORAGE_WIDGETS = 'gheimat_alan_widgets_v1';
const STORAGE_QUOTES_CACHE = 'gheimat_alan_quotes_cache_v1';

const DEFAULT_SETTINGS: AppSettings = {
  lang: 'fa',
  theme: 'light',
  layoutMode: 'square',
  refreshSeconds: 30,
  persianDigits: true,
};

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [watchlistSlugs, setWatchlistSlugs] = useState<string[]>(() =>
    readJsonStorage<string[]>(STORAGE_WATCHLIST, []),
  );
  const [settings, setSettings] = useState<AppSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...readJsonStorage<Partial<AppSettings>>(STORAGE_SETTINGS, {}),
  }));
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() =>
    readJsonStorage<WidgetConfig[]>(STORAGE_WIDGETS, []),
  );
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>(() =>
    readJsonStorage<Record<string, LiveQuote>>(STORAGE_QUOTES_CACHE, {}),
  );

  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'calculator' || tab === 'widgets') return tab;
    return 'board';
  });

  const [standaloneWidgetId, setStandaloneWidgetId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('widget');
  });

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chartSlug, setChartSlug] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [marketError, setMarketError] = useState<string | null>(null);

  const isOnline = useOnlineStatus();
  const { isInstallable, isIOS, install } = usePWAInstall();
  const t = TEXT[settings.lang];

  // Sync theme, lang, and RTL/LTR direction to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.lang = settings.lang;
    root.dir = settings.lang === 'fa' ? 'rtl' : 'ltr';
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_WATCHLIST, JSON.stringify(watchlistSlugs));
  }, [watchlistSlugs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_WIDGETS, JSON.stringify(widgets));
  }, [widgets]);

  const activeWidgetSlugs = useMemo(
    () => widgets.flatMap((w) => w.assetSlugs),
    [widgets],
  );

  const fetchMarkets = useCallback(
    async (force = false) => {
      setIsRefreshing(true);
      setMarketError(null);
      try {
        const slugsParam = Array.from(
          new Set([
            ...watchlistSlugs,
            ...activeWidgetSlugs,
            'price_dollar_rl',
            'price_eur',
            'price_aed',
            'geram18',
            'geram24',
            'sekeb',
            'nim',
            'rob',
            'crypto-tether-irr',
            'crypto-bitcoin-irr',
            'crypto-ethereum-irr',
            'crypto-binance-coin-irr',
            'crypto-solana-irr',
          ]),
        ).join(',');

        const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
        const url = `${apiBase}/api/markets?slugs=${encodeURIComponent(slugsParam)}${force ? '&refresh=1' : ''}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as {
          fetchedAt: string;
          quotes: Record<string, LiveQuote & { p?: string }>;
        };

        const normalized: Record<string, LiveQuote> = {};
        for (const [slug, q] of Object.entries(json.quotes)) {
          if (typeof q.priceToman === 'number') {
            const def = ASSET_MAP[slug];
            let usdPrice = q.usdPrice;
            if (def?.usdSlug && json.quotes[def.usdSlug]) {
              const rawUsd = json.quotes[def.usdSlug] as unknown as TgjuCurrentEntry;
              const num = Number.parseFloat(String(rawUsd.p ?? '').replace(/,/g, ''));
              if (Number.isFinite(num)) usdPrice = num;
            }
            normalized[slug] = { ...q, usdPrice };
          }
        }

        setQuotes(normalized);
        setLastFetchedAt(json.fetchedAt || new Date().toISOString());
        localStorage.setItem(STORAGE_QUOTES_CACHE, JSON.stringify(normalized));
      } catch (err) {
        // Direct TGJU fallback for standalone Capacitor APK WebView
        try {
          const direct = await fetch('https://call.tgju.org/ajax.json');
          if (!direct.ok) throw new Error('TGJU unreachable');
          const data = (await direct.json()) as { current?: Record<string, TgjuCurrentEntry> };
          const cur = data.current || {};
          const normalized: Record<string, LiveQuote> = {};
          for (const slug of Object.keys(ASSET_MAP)) {
            const entry = cur[slug];
            if (!entry) continue;
            const def = ASSET_MAP[slug];
            const usdEntry = def.usdSlug ? cur[def.usdSlug] : undefined;
            normalized[slug] = buildQuoteFromTgju(slug, entry, usdEntry);
          }
          setQuotes(normalized);
          setLastFetchedAt(new Date().toISOString());
          localStorage.setItem(STORAGE_QUOTES_CACHE, JSON.stringify(normalized));
        } catch {
          setMarketError(err instanceof Error ? err.message : t.errorLoadMarkets);
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [watchlistSlugs, activeWidgetSlugs, t.errorLoadMarkets],
  );

  // Fetch immediately on app open & whenever watchlist grows
  useEffect(() => {
    void fetchMarkets(true);
  }, [fetchMarkets]);

  // Auto-refresh interval
  useEffect(() => {
    if (settings.refreshSeconds <= 0) return;
    const timer = setInterval(() => {
      void fetchMarkets(false);
    }, settings.refreshSeconds * 1000);
    return () => clearInterval(timer);
  }, [settings.refreshSeconds, fetchMarkets]);

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const toggleWatchlistSlug = (slug: string) => {
    setWatchlistSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const standaloneWidget = useMemo(
    () => (standaloneWidgetId ? widgets.find((w) => w.id === standaloneWidgetId) ?? null : null),
    [standaloneWidgetId, widgets],
  );

  // Standalone Home-Screen Widget Mode
  if (standaloneWidget) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 gap-4">
        <div className="w-full max-w-md">
          <WidgetPreviewCard
            widget={standaloneWidget}
            quotes={quotes}
            lang={settings.lang}
            appTheme={settings.theme}
            persianDigits={settings.persianDigits}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setStandaloneWidgetId(null);
            window.history.replaceState({}, '', '/');
          }}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.widgetExitStandalone}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 md:pb-10 transition-colors">
      <TopBar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        lang={settings.lang}
        theme={settings.theme}
        onToggleLang={() => updateSettings({ lang: settings.lang === 'fa' ? 'en' : 'fa' })}
        onToggleTheme={() =>
          updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
        }
        onOpenPicker={() => setIsPickerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={() => void fetchMarkets(true)}
        isRefreshing={isRefreshing}
        isInstallable={isInstallable}
        onInstallPWA={() => void install()}
      />

      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{t.offlineBanner}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'board' && (
          <MarketGrid
            watchlistSlugs={watchlistSlugs}
            quotes={quotes}
            layoutMode={settings.layoutMode}
            lang={settings.lang}
            persianDigits={settings.persianDigits}
            lastFetchedAt={lastFetchedAt}
            isRefreshing={isRefreshing}
            error={marketError}
            onRefresh={() => void fetchMarkets(true)}
            onOpenPicker={() => setIsPickerOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onChangeLayoutMode={(layoutMode) => updateSettings({ layoutMode })}
            onSelectAsset={(slug) => setChartSlug(slug)}
            onRemoveAsset={(slug) =>
              setWatchlistSlugs((prev) => prev.filter((item) => item !== slug))
            }
          />
        )}

        {activeTab === 'calculator' && (
          <CalculatorView
            quotes={quotes}
            lang={settings.lang}
            persianDigits={settings.persianDigits}
          />
        )}

        {activeTab === 'widgets' && (
          <WidgetStudioView
            widgets={widgets}
            onSaveWidget={(w) => setWidgets((prev) => [w, ...prev])}
            onDeleteWidget={(id) => setWidgets((prev) => prev.filter((w) => w.id !== id))}
            onLaunchStandalone={(id) => {
              setStandaloneWidgetId(id);
              window.history.replaceState({}, '', `/?widget=${encodeURIComponent(id)}`);
            }}
            quotes={quotes}
            lang={settings.lang}
            appTheme={settings.theme}
            persianDigits={settings.persianDigits}
            isInstallable={isInstallable}
            isIOS={isIOS}
            onInstallPWA={() => void install()}
          />
        )}
      </main>

      <AssetPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedSlugs={watchlistSlugs}
        onToggleSlug={toggleWatchlistSlug}
        onSetSlugs={setWatchlistSlugs}
        quotes={quotes}
        lang={settings.lang}
        persianDigits={settings.persianDigits}
      />

      <PriceChartModal
        slug={chartSlug}
        quote={chartSlug ? quotes[chartSlug] : undefined}
        lang={settings.lang}
        persianDigits={settings.persianDigits}
        onClose={() => setChartSlug(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}
