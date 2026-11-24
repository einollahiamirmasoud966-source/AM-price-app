import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Calculator, Plus, Trash2 } from 'lucide-react';
import { ALL_ASSETS, ASSET_MAP } from '../data/catalog';
import { TEXT } from '../data/i18n';
import type { CalculatorBasketItem, Language, LiveQuote } from '../types/market';
import {
  convertQuantityToToman,
  convertTomanToQuantity,
  formatToman,
  sumBasketToman,
} from '../utils/marketMath';
import { AssetEmblem } from './AssetEmblem';

interface CalculatorViewProps {
  quotes: Record<string, LiveQuote>;
  lang: Language;
  persianDigits: boolean;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  quotes,
  lang,
  persianDigits,
}) => {
  const t = TEXT[lang];
  const [selectedSlug, setSelectedSlug] = useState<string>('price_dollar_rl');
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [tomanInput, setTomanInput] = useState<string>(() => {
    const q = quotes['price_dollar_rl'];
    return q ? String(Math.round(q.priceToman)) : '';
  });
  const [lastEdited, setLastEdited] = useState<'qty' | 'toman'>('qty');
  const [basket, setBasket] = useState<CalculatorBasketItem[]>([]);

  const selectedAsset = ASSET_MAP[selectedSlug] ?? ALL_ASSETS[0];
  const selectedQuote = quotes[selectedAsset.slug];
  const unitPrice = selectedQuote?.priceToman ?? 0;

  const computedToman = useMemo(() => {
    if (lastEdited === 'toman') {
      return Number.parseFloat(tomanInput) || 0;
    }
    const qty = Number.parseFloat(quantityInput) || 0;
    return convertQuantityToToman(qty, unitPrice, selectedAsset.unitMultiplier);
  }, [lastEdited, quantityInput, tomanInput, unitPrice, selectedAsset.unitMultiplier]);

  const computedQty = useMemo(() => {
    if (lastEdited === 'qty') {
      return Number.parseFloat(quantityInput) || 0;
    }
    const toman = Number.parseFloat(tomanInput) || 0;
    return convertTomanToQuantity(toman, unitPrice, selectedAsset.unitMultiplier);
  }, [lastEdited, quantityInput, tomanInput, unitPrice, selectedAsset.unitMultiplier]);

  const handleQtyChange = (val: string) => {
    setLastEdited('qty');
    setQuantityInput(val);
    const num = Number.parseFloat(val);
    if (Number.isFinite(num) && unitPrice > 0) {
      const tom = convertQuantityToToman(num, unitPrice, selectedAsset.unitMultiplier);
      setTomanInput(String(Math.round(tom)));
    } else if (!val) {
      setTomanInput('');
    }
  };

  const handleTomanChange = (val: string) => {
    setLastEdited('toman');
    setTomanInput(val);
    const num = Number.parseFloat(val);
    if (Number.isFinite(num) && unitPrice > 0) {
      const q = convertTomanToQuantity(num, unitPrice, selectedAsset.unitMultiplier);
      setQuantityInput(q > 0 ? Number(q.toFixed(6)).toString() : '');
    } else if (!val) {
      setQuantityInput('');
    }
  };

  const handleAddToBasket = () => {
    const qty = computedQty;
    if (qty <= 0) return;
    setBasket((prev) => [
      ...prev,
      {
        id: `${selectedAsset.slug}-${Date.now()}`,
        slug: selectedAsset.slug,
        quantity: qty,
      },
    ]);
  };

  const basketTotal = useMemo(
    () => sumBasketToman(basket, quotes, ASSET_MAP),
    [basket, quotes],
  );

  return (
    <section className="max-w-5xl mx-auto space-y-6" data-testid="calculator-view">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.calcTitle}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t.calcSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Two-Way Instant Converter */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="calc-asset-select"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              {t.calcAssetLabel}
            </label>
            <div className="flex items-center gap-3">
              <AssetEmblem asset={selectedAsset} lang={lang} size="md" />
              <select
                id="calc-asset-select"
                value={selectedAsset.slug}
                onChange={(e) => {
                  setSelectedSlug(e.target.value);
                  setLastEdited('qty');
                }}
                className="flex-1 min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {ALL_ASSETS.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {lang === 'fa' ? `${a.nameFa} (${a.code})` : `${a.nameEn} (${a.code})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Unit Price Readout */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t.calcUnitPrice}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums-data">
              {unitPrice > 0
                ? `${formatToman(unitPrice, lang, persianDigits)} ${t.toman} / ${
                    lang === 'fa' ? selectedAsset.unitFa : selectedAsset.unitEn
                  }`
                : '---'}
            </span>
          </div>

          {/* Two-way numeric fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <label
                htmlFor="calc-qty-input"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                {t.calcQuantityLabel} ({selectedAsset.code})
              </label>
              <input
                id="calc-qty-input"
                type="number"
                min="0"
                step="any"
                value={lastEdited === 'qty' ? quantityInput : Number(computedQty.toFixed(6)).toString()}
                onChange={(e) => handleQtyChange(e.target.value)}
                dir="ltr"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-lg font-bold text-slate-950 dark:text-white tabular-nums-data focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="calc-toman-input"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                {t.calcTomanLabel}
              </label>
              <input
                id="calc-toman-input"
                type="number"
                min="0"
                step="any"
                value={lastEdited === 'toman' ? tomanInput : Math.round(computedToman).toString()}
                onChange={(e) => handleTomanChange(e.target.value)}
                dir="ltr"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums-data focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{t.calcSwapHint}</span>
            </span>

            <button
              type="button"
              onClick={handleAddToBasket}
              data-testid="calc-add-basket-btn"
              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.calcAddToBasket}</span>
            </button>
          </div>
        </div>

        {/* Multi-Asset Total Basket */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t.calcBasketTitle}
            </h2>
          </div>

          {basket.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center leading-relaxed">
              {t.calcBasketEmpty}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {basket.map((item) => {
                const asset = ASSET_MAP[item.slug];
                const q = quotes[item.slug];
                if (!asset) return null;
                const rowTotal = q
                  ? convertQuantityToToman(item.quantity, q.priceToman, asset.unitMultiplier)
                  : 0;
                return (
                  <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AssetEmblem asset={asset} lang={lang} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {lang === 'fa' ? asset.nameFa : asset.nameEn}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums-data">
                          {item.quantity} {asset.code}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums-data">
                        {formatToman(rowTotal, lang, persianDigits)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBasket((prev) => prev.filter((b) => b.id !== item.id))}
                        aria-label={t.removeAsset}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {t.calcBasketTotal}
            </span>
            <span
              data-testid="calc-basket-total"
              className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums-data"
            >
              {formatToman(basketTotal, lang, persianDigits)}{' '}
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.toman}
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
