import React, { useMemo, useState } from 'react';
import { Check, Search, Sparkles, Trash2, X } from 'lucide-react';
import { ALL_ASSETS } from '../data/catalog';
import { TEXT } from '../data/i18n';
import type {
  AssetCategory,
  CurrencyRegion,
  Language,
  LiveQuote,
} from '../types/market';
import { formatToman } from '../utils/marketMath';
import { AssetEmblem } from './AssetEmblem';

interface AssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlugs: string[];
  onToggleSlug: (slug: string) => void;
  onSetSlugs: (slugs: string[]) => void;
  quotes: Record<string, LiveQuote>;
  lang: Language;
  persianDigits: boolean;
}

const STARTER_PACK_SLUGS = [
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
];

export const AssetPickerModal: React.FC<AssetPickerModalProps> = ({
  isOpen,
  onClose,
  selectedSlugs,
  onToggleSlug,
  onSetSlugs,
  quotes,
  lang,
  persianDigits,
}) => {
  const t = TEXT[lang];
  const [category, setCategory] = useState<'all' | AssetCategory>('all');
  const [region, setRegion] = useState<'all' | CurrencyRegion>('all');
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => new Set(selectedSlugs), [selectedSlugs]);

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_ASSETS.filter((asset) => {
      if (category !== 'all' && asset.category !== category) return false;
      if (category === 'currency' && region !== 'all' && asset.region !== region) return false;
      if (!q) return true;
      return (
        asset.nameFa.toLowerCase().includes(q) ||
        asset.nameEn.toLowerCase().includes(q) ||
        asset.code.toLowerCase().includes(q)
      );
    });
  }, [category, region, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-picker-title"
    >
      <div className="w-full sm:max-w-3xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 id="asset-picker-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
              {t.pickerTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.pickerSubtitle} · {selectedSlugs.length} {t.selectedCount}
            </p>
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

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full min-h-[42px] ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const merged = Array.from(new Set([...selectedSlugs, ...STARTER_PACK_SLUGS]));
                  onSetSlugs(merged);
                }}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.addPopular}</span>
              </button>

              {selectedSlugs.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSetSlugs([])}
                  className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearAll}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
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
                onClick={() => setCategory(key)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  category === key
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {category === 'currency' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {(
                [
                  ['all', t.regionAll],
                  ['middle-east', t.regionMiddleEast],
                  ['europe', t.regionEurope],
                  ['asia', t.regionAsia],
                  ['americas', t.regionAmericas],
                  ['africa-oceania', t.regionAfricaOceania],
                ] as const
              ).map(([rKey, rLabel]) => (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => setRegion(rKey)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                    region === rKey
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  {rLabel}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Asset List */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredAssets.map((asset) => {
            const isSelected = selectedSet.has(asset.slug);
            const quote = quotes[asset.slug];
            const label = lang === 'fa' ? asset.nameFa : asset.nameEn;

            return (
              <button
                key={asset.slug}
                type="button"
                onClick={() => onToggleSlug(asset.slug)}
                data-testid={`picker-item-${asset.slug}`}
                aria-pressed={isSelected}
                className={`w-full p-3 rounded-2xl border text-start flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AssetEmblem asset={asset} lang={lang} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 tabular-nums-data">
                      <span>{asset.code}</span>
                      {quote && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{formatToman(quote.priceToman, lang, persianDigits)} {t.toman}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-slate-950'
                      : 'border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-6 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-semibold text-sm hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors cursor-pointer"
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};
