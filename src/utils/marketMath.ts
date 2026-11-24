import type {
  AssetDefinition,
  CalculatorBasketItem,
  HistoryPoint,
  LiveQuote,
  TrendDirection,
} from '../types/market';

export interface TgjuCurrentEntry {
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

export function parseTgjuNumber(value: string | number | undefined | null): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (!value) {
    return 0;
  }
  const cleaned = String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/,/g, '')
    .replace(/%/g, '')
    .trim();
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function rialToToman(rialValue: string | number | undefined | null): number {
  const num = parseTgjuNumber(rialValue);
  return num / 10;
}

export function parseDirectionFromHtml(htmlOrDt: string | undefined | null): TrendDirection {
  const str = String(htmlOrDt ?? '').toLowerCase();
  if (str.includes('high') || str.includes('up')) {
    return 'up';
  }
  if (str.includes('low') || str.includes('down')) {
    return 'down';
  }
  return 'neutral';
}

export function parseChangeSpan(
  amountHtml: string | undefined | null,
  percentHtml: string | undefined | null,
): { changeToman: number; changePercent: number; direction: TrendDirection } {
  const direction = parseDirectionFromHtml(amountHtml || percentHtml);
  const rawChangeToman = Math.abs(rialToToman(amountHtml));
  const rawPct = Math.abs(parseTgjuNumber(percentHtml));

  if (direction === 'down') {
    return {
      changeToman: rawChangeToman === 0 ? 0 : -rawChangeToman,
      changePercent: rawPct === 0 ? 0 : -rawPct,
      direction: 'down',
    };
  }
  if (direction === 'up') {
    return {
      changeToman: rawChangeToman,
      changePercent: rawPct,
      direction: 'up',
    };
  }
  return {
    changeToman: 0,
    changePercent: 0,
    direction: 'neutral',
  };
}

export function buildQuoteFromTgju(
  slug: string,
  entry: TgjuCurrentEntry,
  usdEntry?: TgjuCurrentEntry,
  dailySummaryRow?: string[],
): LiveQuote {
  const priceToman = rialToToman(entry.p);
  const highToman = rialToToman(entry.h) || priceToman;
  const lowToman = rialToToman(entry.l) || priceToman;

  let changeToman = 0;
  let changePercent = 0;
  let direction: TrendDirection = 'neutral';

  const ajaxChange = rialToToman(entry.d);
  const ajaxPct = parseTgjuNumber(entry.dp);
  const ajaxDir = parseDirectionFromHtml(entry.dt);

  if (ajaxChange !== 0 || ajaxPct !== 0) {
    direction = ajaxDir === 'neutral' ? (ajaxChange > 0 ? 'up' : ajaxChange < 0 ? 'down' : 'neutral') : ajaxDir;
    const sign = direction === 'down' ? -1 : 1;
    changeToman = Math.abs(ajaxChange) * sign;
    changePercent = Math.abs(ajaxPct) * sign;
  } else if (dailySummaryRow && dailySummaryRow.length >= 6) {
    // Fallback to TGJU summary-table-data row [open, low, high, close, changeSpan, pctSpan, gregDate, jalaliDate]
    const parsed = parseChangeSpan(dailySummaryRow[4], dailySummaryRow[5]);
    changeToman = parsed.changeToman;
    changePercent = parsed.changePercent;
    direction = parsed.direction;
  }

  return {
    slug,
    priceToman,
    highToman,
    lowToman,
    changeToman,
    changePercent,
    direction,
    usdPrice: usdEntry ? parseTgjuNumber(usdEntry.p) : undefined,
    updatedAtFa: entry.t || '',
    updatedAtEn: entry.t_en || '',
    timestamp: entry.ts || '',
  };
}

export function parseHistoryRows(rows: string[][]): HistoryPoint[] {
  const points: HistoryPoint[] = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 8) {
      continue;
    }
    const openToman = rialToToman(row[0]);
    const lowToman = rialToToman(row[1]);
    const highToman = rialToToman(row[2]);
    const closeToman = rialToToman(row[3]);
    const { changeToman, changePercent, direction } = parseChangeSpan(row[4], row[5]);
    if (closeToman <= 0) {
      continue;
    }
    points.push({
      dateGregorian: row[6],
      dateJalali: row[7],
      openToman,
      lowToman,
      highToman,
      closeToman,
      changeToman,
      changePercent,
      direction,
    });
  }
  // TGJU returns newest first; reverse for chronological chart left-to-right
  return points.reverse();
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

export function formatToman(
  amount: number,
  lang: 'fa' | 'en',
  usePersianDigits: boolean,
  maxFractionDigits?: number,
): string {
  if (!Number.isFinite(amount)) {
    return '0';
  }
  const abs = Math.abs(amount);
  const autoDecimals =
    maxFractionDigits !== undefined
      ? maxFractionDigits
      : abs > 0 && abs < 10
        ? 2
        : abs > 0 && abs < 1000
          ? 1
          : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: autoDecimals,
  }).format(amount);

  if (lang === 'fa' && usePersianDigits) {
    return toPersianDigits(formatted);
  }
  return formatted;
}

export function formatPercent(
  pct: number,
  lang: 'fa' | 'en',
  usePersianDigits: boolean,
): string {
  const absVal = Math.abs(pct).toFixed(2);
  const str = `${absVal}%`;
  return lang === 'fa' && usePersianDigits ? toPersianDigits(str) : str;
}

export function convertQuantityToToman(
  quantity: number,
  priceToman: number,
  unitMultiplier = 1,
): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(priceToman) || quantity <= 0 || priceToman <= 0) {
    return 0;
  }
  const safeMultiplier = unitMultiplier > 0 ? unitMultiplier : 1;
  return (quantity * priceToman) / safeMultiplier;
}

export function convertTomanToQuantity(
  toman: number,
  priceToman: number,
  unitMultiplier = 1,
): number {
  if (!Number.isFinite(toman) || !Number.isFinite(priceToman) || toman <= 0 || priceToman <= 0) {
    return 0;
  }
  const safeMultiplier = unitMultiplier > 0 ? unitMultiplier : 1;
  return (toman * safeMultiplier) / priceToman;
}

export function sumBasketToman(
  items: CalculatorBasketItem[],
  quotes: Record<string, LiveQuote>,
  assetMap: Record<string, AssetDefinition>,
): number {
  return items.reduce((sum, item) => {
    const quote = quotes[item.slug];
    const asset = assetMap[item.slug];
    if (!quote || !asset) {
      return sum;
    }
    return sum + convertQuantityToToman(item.quantity, quote.priceToman, asset.unitMultiplier);
  }, 0);
}
