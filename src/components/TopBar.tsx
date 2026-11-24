import React, { useEffect, useRef, useState } from 'react';
import {
  Calculator,
  Download,
  LayoutGrid,
  Moon,
  MoreVertical,
  Plus,
  RefreshCw,
  Settings,
  Smartphone,
  Sun,
  TrendingUp,
} from 'lucide-react';
import type { Language, ThemeMode } from '../types/market';
import { TEXT } from '../data/i18n';

export type AppTab = 'board' | 'calculator' | 'widgets';

interface TopBarProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  lang: Language;
  theme: ThemeMode;
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onOpenPicker: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isInstallable: boolean;
  onInstallPWA: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onChangeTab,
  lang,
  theme,
  onToggleLang,
  onToggleTheme,
  onOpenPicker,
  onOpenSettings,
  onRefresh,
  isRefreshing,
  isInstallable,
  onInstallPWA,
}) => {
  const t = TEXT[lang];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 h-14 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onChangeTab('board')}
            className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg py-1"
          >
            <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span>{t.brand}</span>
          </button>

          {/* Zone 2: Clean single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => onChangeTab('board')}
              className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                activeTab === 'board'
                  ? 'border-amber-500 text-slate-950 dark:text-white font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {t.navBoard}
            </button>
            <button
              type="button"
              onClick={() => onChangeTab('calculator')}
              className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                activeTab === 'calculator'
                  ? 'border-amber-500 text-slate-950 dark:text-white font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {t.navCalculator}
            </button>
            <button
              type="button"
              onClick={() => onChangeTab('widgets')}
              className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                activeTab === 'widgets'
                  ? 'border-amber-500 text-slate-950 dark:text-white font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {t.navWidgets}
            </button>
          </nav>

          {/* Zone 3: Primary action + Three-dots menu (⋮) */}
          <div className="relative flex items-center gap-2 shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={t.threeDotsLabel}
              aria-expanded={menuOpen}
              data-testid="three-dots-button"
              className="min-h-[42px] min-w-[42px] px-3 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
              <span className="hidden sm:inline">{t.addAssetsBtn}</span>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className={`absolute top-12 ${
                  lang === 'fa' ? 'left-0' : 'right-0'
                } w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-2 z-50`}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenPicker();
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">{t.menuAddAsset}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onRefresh();
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-emerald-500 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="truncate">{t.menuRefresh}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="truncate">{t.menuSettings}</span>
                </button>

                <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggleTheme();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span>{theme === 'dark' ? t.settingsLight : t.settingsDark}</span>
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggleLang();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                >
                  <span>{t.settingsLangTitle}</span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    {lang === 'fa' ? 'EN' : 'فا'}
                  </span>
                </button>

                {isInstallable && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onInstallPWA();
                    }}
                    className="w-full px-4 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-3 transition-colors"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t.menuInstallPwa}</span>
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onChangeTab('widgets');
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">{t.navWidgets}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (56px height, keeping header+bottom <= 15% of mobile viewport) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md grid grid-cols-3 items-center"
      >
        <button
          type="button"
          onClick={() => onChangeTab('board')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            activeTab === 'board'
              ? 'text-amber-600 dark:text-amber-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="truncate">{t.navBoard}</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('calculator')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            activeTab === 'calculator'
              ? 'text-amber-600 dark:text-amber-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span className="truncate">{t.navCalculator}</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('widgets')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            activeTab === 'widgets'
              ? 'text-amber-600 dark:text-amber-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Smartphone className="w-5 h-5" />
          <span className="truncate">{t.navWidgets}</span>
        </button>
      </nav>
    </>
  );
};
