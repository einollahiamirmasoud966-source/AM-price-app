export type Language = 'fa' | 'en';
export type ThemeMode = 'light' | 'dark';
export type LayoutMode = 'square' | 'rectangular';
export type AssetCategory = 'gold' | 'currency' | 'crypto';
export type CurrencyRegion =
  | 'popular'
  | 'middle-east'
  | 'europe'
  | 'asia'
  | 'americas'
  | 'africa-oceania';

export type EmblemKind =
  | 'flag'
  | 'fraction-1/4'
  | 'fraction-1/2'
  | 'animated-coin'
  | 'number-18'
  | 'number-24'
  | 'crypto-usdt'
  | 'crypto-btc'
  | 'crypto-eth'
  | 'crypto-bnb'
  | 'crypto-sol';

export interface AssetDefinition {
  slug: string;
  usdSlug?: string;
  code: string;
  category: AssetCategory;
  region?: CurrencyRegion;
  nameFa: string;
  nameEn: string;
  unitFa: string;
  unitEn: string;
  unitMultiplier: number; // e.g. 100 for JPY on TGJU, 1 for standard
  emblem: EmblemKind;
  flagCode?: string; // ISO 3166-1-alpha-2 lowercase for flag-icons
  popular?: boolean;
}

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface LiveQuote {
  slug: string;
  priceToman: number;
  highToman: number;
  lowToman: number;
  changeToman: number;
  changePercent: number;
  direction: TrendDirection;
  usdPrice?: number;
  updatedAtFa: string;
  updatedAtEn: string;
  timestamp: string;
}

export interface HistoryPoint {
  dateGregorian: string;
  dateJalali: string;
  openToman: number;
  lowToman: number;
  highToman: number;
  closeToman: number;
  changeToman: number;
  changePercent: number;
  direction: TrendDirection;
}

export type WidgetSize = '2x1' | '2x2' | '4x1';

export interface WidgetConfig {
  id: string;
  titleFa: string;
  titleEn: string;
  size: WidgetSize;
  assetSlugs: string[];
  refreshSeconds: number;
  theme: 'auto' | 'light' | 'dark';
  createdAt: string;
}

export interface AppSettings {
  lang: Language;
  theme: ThemeMode;
  layoutMode: LayoutMode;
  refreshSeconds: number;
  persianDigits: boolean;
}

export interface CalculatorBasketItem {
  id: string;
  slug: string;
  quantity: number;
}
