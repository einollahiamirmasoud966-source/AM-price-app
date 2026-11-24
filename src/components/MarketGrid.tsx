import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart2,
  LayoutGrid,
  Minus,
  MoreVertical,
  Plus,
  RefreshCw,
  Rows3,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { ASSET_MAP } from '../data/catalog';
import { TEXT } from '../data/i18n';
import type {
  AssetCategory,
  AssetDefinition,
  Language,
  LayoutMode,
  LiveQuote,
} from '../types/market';
import { formatPercent, formatToman, toPersianDigits } from '../utils/marketMath';
import { AssetEmblem } from './AssetEmblem';

interface MarketGridProps {
  watchlistSlugs: string[];
  quotes: Record<string, LiveQuote>;
  layoutMode: LayoutMode;
  lang: Language;
  persianDigits: boolean;
  lastFetchedAt: string | null;
  isRefreshing: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenPicker: () => void;
  onOpenSettings: () => void;
  onChangeLayoutMode: (mode: LayoutMode) => void;
  onSelectAsset: (slug: string) => void;
  onRemoveAsset: (slug: string) => void;
}

export const MarketGrid: React.FC<MarketGridProps> = ({
  watchlistSlugs,
  quotes,
  layoutMode,
  lang,
  persianDigits,
  lastFetchedAt,
  isRefreshing,
  error,
  onRefresh,
  onOpenPicker,
  onOpenSettings,
  onChangeLayoutMode,
  onSelectAsset,
  onRemoveAsset,
}) => {
  const t = TEXT[lang];
  const [categoryFilter, setCategoryFilter] = useState<'all' | AssetCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const watchlistAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return watchlistSlugs
      .map((slug) => ASSET_MAP[slug])
      .filter((asset): asset is AssetDefinition => {
        if (!asset) return false;
        if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;
        if (!q) return true;
        return (
          asset.nameFa.toLowerCase().includes(q) ||
          asset.nameEn.toLowerCase().includes(q) ||
          asset.code.toLowerCase().includes(q)
        );
      });
  }, [watchlistSlugs, categoryFilter, searchQuery]);

  const formattedTime = useMemo(() => {
    if (!lastFetchedAt) return '';
    const date = new Date(lastFetchedAt);
    const timeStr = date.toLocaleTimeString(lang === 'fa' ? 'fa-IR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return lang === 'fa' && persianDigits ? toPersianDigits(timeStr) : timeStr;
  }, [lastFetchedAt, lang, persianDigits]);

  // Empty initial state as explicitly requested
  if (watchlistSlugs.length === 0) {
    return (
      <section
        data-testid="empty-watchlist"
        className="max-w-3xl mx-auto my-8 sm:my-14 px-4"
      >
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6">
            <MoreVertical className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
            {t.emptyTitle}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            {t.emptySubtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenPicker}
              className="min-h-[46px] px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-semibold text-sm hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.emptyAction}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="min-h-[46px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>{t.menuSettings}</span>
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            {t.emptyHint}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {/* Workspace Toolbar: Category filters, search, layout switch (Square / Rectangular), live sync */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Category filter"
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
          >
            {(
              [
                ['all', t.filterAll],
                ['gold', t.filterGold],
                ['currency', t.filterCurrency],
                ['crypto', t.filterCrypto],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={categoryFilter === key}
                onClick={() => setCategoryFilter(key)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  categoryFilter === key
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Quick Square / Rectangular Switcher (synced with Settings) */}
          <div
            role="group"
            aria-label={t.layoutLabel}
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
          >
            <button
              type="button"
              onClick={() => onChangeLayoutMode('square')}
              aria-pressed={layoutMode === 'square'}
              data-testid="layout-square-btn"
              className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                layoutMode === 'square'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t.squareMode}</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeLayoutMode('rectangular')}
              aria-pressed={layoutMode === 'rectangular'}
              data-testid="layout-rect-btn"
              className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                layoutMode === 'rectangular'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Rows3 className="w-3.5 h-3.5" />
              <span>{t.rectangularMode}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full min-h-[40px] ps-9 pe-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            aria-label={t.menuRefresh}
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>
              {isRefreshing ? t.updating : formattedTime ? `${t.lastUpdated}: ${formattedTime}` : t.menuRefresh}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 flex items-center justify-between gap-4 text-sm text-rose-800 dark:text-rose-200">
          <span>{t.errorLoadMarkets}: {error}</span>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shrink-0 cursor-pointer"
          >
            {t.retry}
          </button>
        </div>
      )}

      {/* Quiet metadata line */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{t.liveSource} · {t.tapForChart}</span>
        <span className="tabular-nums-data">
          {lang === 'fa' && persianDigits ? toPersianDigits(watchlistAssets.length) : watchlistAssets.length}{' '}
          {lang === 'fa' ? 'مورد' : 'items'}
        </span>
      </div>

      {/* Price Grid: Square Mode vs Rectangular Mode */}
      {layoutMode === 'square' ? (
        <div
          data-testid="market-grid-square"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {watchlistAssets.map((asset) => {
            const quote = quotes[asset.slug];
            return (
              <SquareAssetCard
                key={asset.slug}
                asset={asset}
                quote={quote}
                lang={lang}
                persianDigits={persianDigits}
                onSelect={() => onSelectAsset(asset.slug)}
                onRemove={() => onRemoveAsset(asset.slug)}
              />
            );
          })}
        </div>
      ) : (
        <div
          data-testid="market-grid-rectangular"
          className="grid grid-cols-1 lg:grid-cols-2 gap-3"
        >
          {watchlistAssets.map((asset) => {
            const quote = quotes[asset.slug];
            return (
              <RectangularAssetCard
                key={asset.slug}
                asset={asset}
                quote={quote}
                lang={lang}
                persianDigits={persianDigits}
                onSelect={() => onSelectAsset(asset.slug)}
                onRemove={() => onRemoveAsset(asset.slug)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

interface CardProps {
  asset: AssetDefinition;
  quote?: LiveQuote;
  lang: Language;
  persianDigits: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

const ChangeBadge: React.FC<{
  quote?: LiveQuote;
  lang: Language;
  persianDigits: boolean;
  compact?: boolean;
}> = ({ quote, lang, persianDigits, compact }) => {
  const t = TEXT[lang];
  if (!quote) {
    return <span className="text-xs text-slate-400">...</span>;
  }

  const isUp = quote.direction === 'up';
  const isDown = quote.direction === 'down';
  const colorClass = isUp
    ? 'text-emerald-600 dark:text-emerald-400'
    : isDown
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-500 dark:text-slate-400';

  const absChange = Math.abs(quote.changeToman);
  const formattedAmt = formatToman(absChange, lang, persianDigits);
  const formattedPct = formatPercent(quote.changePercent, lang, persianDigits);

  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold tabular-nums-data ${colorClass}`}>
      {isUp ? (
        <ArrowUp className="w-3.5 h-3.5 shrink-0" />
      ) : isDown ? (
        <ArrowDown className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <Minus className="w-3.5 h-3.5 shrink-0" />
      )}
      {quote.direction === 'neutral' && absChange === 0 ? (
        <span>{t.noChange}</span>
      ) : (
        <span dir="ltr" className="truncate inline-flex items-center gap-1">
          <span>
            {isUp ? '+' : isDown ? '-' : ''}
            {formattedAmt}
          </span>
          {!compact && <span className="opacity-75">({formattedPct})</span>}
          {compact && <span className="opacity-85">· {formattedPct}</span>}
        </span>
      )}
    </div>
  );
};

const SquareAssetCard: React.FC<CardProps> = ({
  asset,
  quote,
  lang,
  persianDigits,
  onSelect,
  onRemove,
}) => {
  const t = TEXT[lang];
  const title = lang === 'fa' ? asset.nameFa : asset.nameEn;

  return (
    <article
      data-testid={`asset-card-${asset.slug}`}
      className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between min-h-[196px] sm:min-h-[212px] hover:border-amber-400 dark:hover:border-amber-500/60 transition-colors"
    >
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${t.removeAsset}: ${title}`}
        className="absolute top-3 end-3 w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity z-10 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={onSelect}
        className="text-start w-full h-full flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2 pe-6">
          <AssetEmblem asset={asset} lang={lang} size="md" />
          <span className="text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500 pt-1">
            {asset.code}
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
            {title}
          </h3>
          {quote?.usdPrice ? (
            <p dir="ltr" className="text-xs text-slate-500 dark:text-slate-400 tabular-nums-data text-start">
              ${formatToman(quote.usdPrice, 'en', false, quote.usdPrice < 10 ? 3 : 2)}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'fa' ? asset.unitFa : asset.unitEn}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-lg sm:text-xl font-extrabold text-slate-950 dark:text-white tabular-nums-data tracking-tight">
              {quote ? formatToman(quote.priceToman, lang, persianDigits) : '---'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
              {t.toman}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <ChangeBadge quote={quote} lang={lang} persianDigits={persianDigits} compact />
            <BarChart2 className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 transition-colors shrink-0" />
          </div>
        </div>
      </button>
    </article>
  );
};

const RectangularAssetCard: React.FC<CardProps> = ({
  asset,
  quote,
  lang,
  persianDigits,
  onSelect,
  onRemove,
}) => {
  const t = TEXT[lang];
  const title = lang === 'fa' ? asset.nameFa : asset.nameEn;

  return (
    <article
      data-testid={`asset-card-${asset.slug}`}
      className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center justify-between gap-3 hover:border-amber-400 dark:hover:border-amber-500/60 transition-colors"
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 min-w-0 flex items-center justify-between gap-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl cursor-pointer"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <AssetEmblem asset={asset} lang={lang} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {title}
              </h3>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 shrink-0">
                {asset.code}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
              <span className="shrink-0">{lang === 'fa' ? asset.unitFa : asset.unitEn}</span>
              {quote?.usdPrice ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span dir="ltr" className="tabular-nums-data truncate">
                    ${formatToman(quote.usdPrice, 'en', false, quote.usdPrice < 10 ? 3 : 2)}
                  </span>
                </>
              ) : quote ? (
                <>
                  <span aria-hidden="true" className="hidden xl:inline">·</span>
                  <span className="hidden xl:inline truncate tabular-nums-data">
                    {formatToman(quote.lowToman, lang, persianDigits)} –{' '}
                    {formatToman(quote.highToman, lang, persianDigits)}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="text-end shrink-0 space-y-1">
          <div className="flex items-baseline justify-end gap-1.5">
            <span className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white tabular-nums-data">
              {quote ? formatToman(quote.priceToman, lang, persianDigits) : '---'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {t.toman}
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <ChangeBadge quote={quote} lang={lang} persianDigits={persianDigits} />
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`${t.removeAsset}: ${title}`}
        className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </article>
  );
};
