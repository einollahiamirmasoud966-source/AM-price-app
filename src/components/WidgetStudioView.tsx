import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  ExternalLink,
  Minus,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { ALL_ASSETS, ASSET_MAP } from '../data/catalog';
import { TEXT } from '../data/i18n';
import type { Language, LiveQuote, ThemeMode, WidgetConfig, WidgetSize } from '../types/market';
import { formatPercent, formatToman, toPersianDigits } from '../utils/marketMath';
import { AssetEmblem } from './AssetEmblem';

interface WidgetStudioViewProps {
  widgets: WidgetConfig[];
  onSaveWidget: (widget: WidgetConfig) => void;
  onDeleteWidget: (id: string) => void;
  onLaunchStandalone: (id: string) => void;
  quotes: Record<string, LiveQuote>;
  lang: Language;
  appTheme: ThemeMode;
  persianDigits: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  onInstallPWA: () => void;
}

export const WidgetStudioView: React.FC<WidgetStudioViewProps> = ({
  widgets,
  onSaveWidget,
  onDeleteWidget,
  onLaunchStandalone,
  quotes,
  lang,
  appTheme,
  persianDigits,
  isInstallable,
  isIOS,
  onInstallPWA,
}) => {
  const t = TEXT[lang];
  const [title, setTitle] = useState(lang === 'fa' ? 'ویجت طلا و ارز من' : 'My Gold & FX Widget');
  const [size, setSize] = useState<WidgetSize>('2x2');
  const [theme, setTheme] = useState<'auto' | 'light' | 'dark'>('auto');
  const [refreshSeconds, setRefreshSeconds] = useState<number>(30);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([
    'price_dollar_rl',
    'geram18',
    'sekeb',
    'crypto-tether-irr',
  ]);
  const [countdown, setCountdown] = useState<number>(30);
  const [showHomeGuide, setShowHomeGuide] = useState(false);

  const maxItems = size === '2x1' ? 2 : 4;

  useEffect(() => {
    setCountdown(refreshSeconds);
    const id = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? refreshSeconds : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [refreshSeconds]);

  const toggleAsset = (slug: string) => {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= maxItems) {
        return [...prev.slice(1), slug];
      }
      return [...prev, slug];
    });
  };

  const handleSave = () => {
    if (selectedSlugs.length === 0) return;
    const newWidget: WidgetConfig = {
      id: `w-${Date.now()}`,
      titleFa: title || 'ویجت قیمت زنده',
      titleEn: title || 'Live Price Widget',
      size,
      assetSlugs: selectedSlugs.slice(0, maxItems),
      refreshSeconds,
      theme,
      createdAt: new Date().toISOString(),
    };
    onSaveWidget(newWidget);
  };

  const previewWidget: WidgetConfig = {
    id: 'preview',
    titleFa: title || 'ویجت قیمت زنده',
    titleEn: title || 'Live Price Widget',
    size,
    assetSlugs: selectedSlugs.slice(0, maxItems),
    refreshSeconds,
    theme,
    createdAt: '',
  };

  return (
    <section className="max-w-6xl mx-auto space-y-6" data-testid="widget-studio-view">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.widgetTitle}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.widgetSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isInstallable) {
              onInstallPWA();
            } else {
              setShowHomeGuide((prev) => !prev);
            }
          }}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold inline-flex items-center gap-2 self-start cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{t.widgetPinHome}</span>
        </button>
      </div>

      {showHomeGuide && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-500/10 p-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-1.5">
          <p className="font-bold">
            {lang === 'fa'
              ? 'راهنمای افزودن ویجت به صفحه اصلی موبایل و اندروید:'
              : 'How to add this live widget to your device home screen:'}
          </p>
          <p>
            {isIOS
              ? lang === 'fa'
                ? 'در سافاری آیفون دکمه Share را بزنید و گزینه Add to Home Screen را انتخاب کنید.'
                : 'In iOS Safari, tap Share and choose Add to Home Screen.'
              : lang === 'fa'
                ? '۱) از منوی مرورگر گزینه Install / Add to Home Screen را بزنید. ۲) در خروجی APK اندروید، ویجت بومی «قیمت الان» مستقیماً در بخش Widgets لانچر اندروید قابل افزودن به صفحه اصلی است.'
                : '1) Use Browser Menu -> Install / Add to Home Screen. 2) In the compiled Android APK (built via GitHub Actions), the native Gheimat Alan AppWidget appears directly in your Android Home Screen Widgets drawer.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Builder Controls */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="widget-title-input"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                {t.widgetNameLabel}
              </label>
              <input
                id="widget-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="widget-refresh-select"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                {t.widgetRefreshLabel}
              </label>
              <select
                id="widget-refresh-select"
                value={refreshSeconds}
                onChange={(e) => setRefreshSeconds(Number(e.target.value))}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value={15}>15 {t.widgetSeconds}</option>
                <option value={30}>30 {t.widgetSeconds}</option>
                <option value={60}>60 {t.widgetSeconds}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t.widgetSizeLabel}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['2x1', t.widgetSize2x1],
                    ['2x2', t.widgetSize2x2],
                    ['4x1', t.widgetSize4x1],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSize(key)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      size === key
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t.widgetThemeLabel}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['auto', t.widgetThemeAuto],
                    ['light', t.widgetThemeLight],
                    ['dark', t.widgetThemeDark],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      theme === key
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {t.widgetPickAssets}
              </span>
              <span className="text-slate-500 dark:text-slate-400 tabular-nums-data">
                {selectedSlugs.length} / {maxItems}
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
              {ALL_ASSETS.slice(0, 26).map((asset) => {
                const active = selectedSlugs.includes(asset.slug);
                return (
                  <button
                    key={asset.slug}
                    type="button"
                    onClick={() => toggleAsset(asset.slug)}
                    className={`p-2.5 rounded-xl border text-start flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                      active
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AssetEmblem asset={asset} lang={lang} size="sm" />
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {lang === 'fa' ? asset.nameFa : asset.nameEn}
                      </span>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-amber-500 text-slate-950'
                          : 'border border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 tabular-nums-data">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
              {t.widgetNextRefresh}: {lang === 'fa' && persianDigits ? toPersianDigits(countdown) : countdown} {t.widgetSeconds}
            </span>
            <button
              type="button"
              onClick={handleSave}
              data-testid="save-widget-btn"
              className="min-h-[42px] px-5 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold hover:bg-slate-800 dark:hover:bg-amber-400 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.widgetSave}</span>
            </button>
          </div>
        </div>

        {/* Live Widget Preview & Saved Widgets */}
        <div className="lg:col-span-5 space-y-5">
          {/* Mock Smartphone Home Canvas Preview */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <Smartphone className="w-3.5 h-3.5" />
                {lang === 'fa' ? 'پیش‌نمایش زنده روی صفحه اصلی' : 'Live Home Screen Preview'}
              </span>
              <span className="tabular-nums-data">{size}</span>
            </div>

            <WidgetPreviewCard
              widget={previewWidget}
              quotes={quotes}
              lang={lang}
              appTheme={appTheme}
              persianDigits={persianDigits}
            />
          </div>

          {/* Saved Widgets List */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {t.widgetSavedList} ({widgets.length})
            </h2>

            {widgets.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                {lang === 'fa'
                  ? 'هنوز ویجتی ذخیره نکرده‌اید. از فرم بالا اولین ویجت خود را بسازید.'
                  : 'No saved widgets yet. Configure and save your first widget.'}
              </p>
            ) : (
              <div className="space-y-3">
                {widgets.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {lang === 'fa' ? w.titleFa : w.titleEn}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {w.size} · {w.assetSlugs.length} {lang === 'fa' ? 'مورد' : 'items'} · {w.refreshSeconds}s
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onLaunchStandalone(w.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{t.widgetLaunchStandalone}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteWidget(w.id)}
                          aria-label={t.removeAsset}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const WidgetPreviewCard: React.FC<{
  widget: WidgetConfig;
  quotes: Record<string, LiveQuote>;
  lang: Language;
  appTheme: ThemeMode;
  persianDigits: boolean;
}> = ({ widget, quotes, lang, appTheme, persianDigits }) => {
  const t = TEXT[lang];
  const resolvedDark = widget.theme === 'dark' || (widget.theme === 'auto' && appTheme === 'dark');

  return (
    <div
      className={`rounded-3xl border p-4 shadow-md transition-colors ${
        resolvedDark
          ? 'bg-slate-950 border-slate-800 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-current/10">
        <span className="text-xs font-extrabold truncate">
          {lang === 'fa' ? widget.titleFa : widget.titleEn}
        </span>
        <span className="text-[10px] opacity-60 tabular-nums-data">
          tgju.org · {widget.refreshSeconds}s
        </span>
      </div>

      <div
        className={`grid gap-2.5 ${
          widget.size === '4x1'
            ? 'grid-cols-2 sm:grid-cols-4'
            : widget.size === '2x1'
              ? 'grid-cols-2'
              : 'grid-cols-2'
        }`}
      >
        {widget.assetSlugs.map((slug) => {
          const asset = ASSET_MAP[slug];
          const quote = quotes[slug];
          if (!asset) return null;
          const isUp = quote?.direction === 'up';
          const isDown = quote?.direction === 'down';

          return (
            <div
              key={slug}
              className={`rounded-2xl p-2.5 ${
                resolvedDark ? 'bg-slate-900/90' : 'bg-slate-50'
              } space-y-1.5`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <AssetEmblem asset={asset} lang={lang} size="sm" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold truncate">
                    {lang === 'fa' ? asset.nameFa : asset.code}
                  </div>
                  <div className="text-[10px] opacity-60">{asset.code}</div>
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-1 pt-0.5">
                <span className="text-xs font-extrabold tabular-nums-data truncate">
                  {quote ? formatToman(quote.priceToman, lang, persianDigits) : '---'}
                </span>
                {quote && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums-data shrink-0 ${
                      isUp
                        ? 'text-emerald-500'
                        : isDown
                          ? 'text-rose-500'
                          : 'opacity-60'
                    }`}
                  >
                    {isUp ? (
                      <ArrowUp className="w-2.5 h-2.5" />
                    ) : isDown ? (
                      <ArrowDown className="w-2.5 h-2.5" />
                    ) : (
                      <Minus className="w-2.5 h-2.5" />
                    )}
                    {formatPercent(quote.changePercent, lang, persianDigits)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[10px] opacity-55 text-end">
        {t.toman}
      </div>
    </div>
  );
};
