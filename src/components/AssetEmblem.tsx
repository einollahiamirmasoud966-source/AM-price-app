import React from 'react';
import type { AssetDefinition, Language } from '../types/market';

interface AssetEmblemProps {
  asset: AssetDefinition;
  lang: Language;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-13 h-13 text-base',
};

export const AssetEmblem: React.FC<AssetEmblemProps> = ({ asset, lang, size = 'md' }) => {
  const box = SIZE_CLASSES[size];

  // 1. Fiat currencies -> crisp SVG country flag via flag-icons
  if (asset.emblem === 'flag' && asset.flagCode) {
    return (
      <div
        className={`${box} shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs`}
        aria-hidden="true"
      >
        <span
          className={`fi fi-${asset.flagCode} fis w-full h-full block bg-cover bg-center`}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  // 2. Quarter Coin -> 1/4 fraction emblem
  if (asset.emblem === 'fraction-1/4') {
    return (
      <div
        className={`${box} shrink-0 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 text-slate-950 font-extrabold flex items-center justify-center border-2 border-amber-200 dark:border-amber-400/60 shadow-sm`}
        aria-hidden="true"
      >
        <span className="tracking-tight leading-none font-mono">
          {lang === 'fa' ? '۱/۴' : '1/4'}
        </span>
      </div>
    );
  }

  // 3. Half Coin -> 1/2 fraction emblem
  if (asset.emblem === 'fraction-1/2') {
    return (
      <div
        className={`${box} shrink-0 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 text-slate-950 font-extrabold flex items-center justify-center border-2 border-amber-100 dark:border-amber-300/60 shadow-sm`}
        aria-hidden="true"
      >
        <span className="tracking-tight leading-none font-mono">
          {lang === 'fa' ? '۱/۲' : '1/2'}
        </span>
      </div>
    );
  }

  // 4. Bahar Azadi Coin -> Animated illustrated vector coin (NOT a realistic photo)
  if (asset.emblem === 'animated-coin') {
    return (
      <div
        className={`${box} shrink-0 relative rounded-full flex items-center justify-center overflow-hidden animate-coin-float`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <defs>
            <linearGradient id="baharGoldOuter" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="baharGoldInner" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="30" fill="url(#baharGoldOuter)" stroke="#78350F" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="24" fill="url(#baharGoldInner)" stroke="#FEF9C3" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* Stylized illustrated sun/star motif */}
          <path
            d="M32 14 L35.8 24.5 L47 24.5 L38 31.2 L41.5 42 L32 35.5 L22.5 42 L26 31.2 L17 24.5 L28.2 24.5 Z"
            fill="#FEF9C3"
            opacity="0.95"
          />
          <circle cx="32" cy="31" r="5" fill="#B45309" />
        </svg>
        <span className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent animate-coin-glint" />
      </div>
    );
  }

  // 5. 18K Gold Bar -> Number 18
  if (asset.emblem === 'number-18') {
    return (
      <div
        className={`${box} shrink-0 rounded-xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 text-slate-950 font-black flex flex-col items-center justify-center border border-amber-200 dark:border-amber-400/50 shadow-sm`}
        aria-hidden="true"
      >
        <span className="leading-none text-base font-extrabold">
          {lang === 'fa' ? '۱۸' : '18'}
        </span>
        <span className="text-[9px] font-bold opacity-80 leading-none mt-0.5">
          {lang === 'fa' ? 'عیار' : 'K'}
        </span>
      </div>
    );
  }

  // 6. 24K Gold Bar -> Number 24
  if (asset.emblem === 'number-24') {
    return (
      <div
        className={`${box} shrink-0 rounded-xl bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 text-slate-950 font-black flex flex-col items-center justify-center border border-yellow-100 dark:border-yellow-300/60 shadow-sm`}
        aria-hidden="true"
      >
        <span className="leading-none text-base font-extrabold">
          {lang === 'fa' ? '۲۴' : '24'}
        </span>
        <span className="text-[9px] font-bold opacity-80 leading-none mt-0.5">
          {lang === 'fa' ? 'عیار' : 'K'}
        </span>
      </div>
    );
  }

  // 7. Cryptocurrencies (exact 5 icons)
  if (asset.emblem === 'crypto-usdt') {
    return (
      <div
        className={`${box} shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
          <path d="M8 9h16v3.2h-6.2v3.6c3.8.2 6.6 1 6.6 2s-2.8 1.8-6.6 2v5.7h-3.6v-5.7c-3.8-.2-6.6-1-6.6-2s2.8-1.8 6.6-2v-3.6H8V9z" fill="currentColor" />
        </svg>
      </div>
    );
  }

  if (asset.emblem === 'crypto-btc') {
    return (
      <div
        className={`${box} shrink-0 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
          <path
            d="M18.6 15.2c1.4-.5 2.2-1.5 2.2-3 0-2-1.6-3.2-4.2-3.4V6.5h-2.1v2.2h-1.6V6.5h-2.1v2.2H8.5v2.2h1.4c.5 0 .8.3.8.8v8.6c0 .5-.3.8-.8.8H8.5v2.2h2.3v2.2h2.1v-2.2h1.6v2.2h2.1v-2.2c3-.2 4.9-1.5 4.9-3.9 0-1.9-1-3.3-2.9-4zm-4.9-4.3h2.1c1.3 0 2.1.6 2.1 1.6s-.8 1.6-2.1 1.6h-2.1v-3.2zm2.5 9.2h-2.5v-3.6h2.5c1.5 0 2.4.7 2.4 1.8s-.9 1.8-2.4 1.8z"
            fill="currentColor"
          />
        </svg>
      </div>
    );
  }

  if (asset.emblem === 'crypto-eth') {
    return (
      <div
        className={`${box} shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
          <path d="M16 5l-7 11.4 7 4.1 7-4.1L16 5z" fill="currentColor" fillOpacity="0.95" />
          <path d="M16 22l-7-4.1L16 27l7-9.1-7 4.1z" fill="currentColor" fillOpacity="0.75" />
        </svg>
      </div>
    );
  }

  if (asset.emblem === 'crypto-bnb') {
    return (
      <div
        className={`${box} shrink-0 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
          <path
            d="M16 6l3.2 3.2-6 6L10 12 16 6zm6 6l3.2 3.2-9.2 9.2L6.8 15.2 10 12l6 6 6-6zm-15.2 3.2L10 18.4l-3.2-3.2zm18.4 0L22 18.4l3.2-3.2zM16 12.8l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2z"
            fill="currentColor"
          />
        </svg>
      </div>
    );
  }

  // crypto-sol
  return (
    <div
      className={`${box} shrink-0 rounded-full bg-gradient-to-br from-teal-400 via-cyan-500 to-violet-600 text-white flex items-center justify-center shadow-sm`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
        <path d="M9 10h13l-2 2.5H7L9 10zm0 9.5h13l-2 2.5H7l2-2.5zm14-4.7H10l-2 2.5h13l2-2.5z" fill="currentColor" />
      </svg>
    </div>
  );
};
