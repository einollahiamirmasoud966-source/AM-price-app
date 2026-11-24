import React from 'react';
import { LayoutGrid, Moon, Rows3, Smartphone, Sun, X } from 'lucide-react';
import { TEXT } from '../data/i18n';
import type { AppSettings } from '../types/market';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const t = TEXT[settings.lang];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      data-testid="settings-modal"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <h2 id="settings-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
            {t.settingsTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Price Table Display Mode: Square vs Rectangular */}
          <div className="space-y-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.settingsLayoutTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.settingsLayoutDesc}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ layoutMode: 'square' })}
                aria-pressed={settings.layoutMode === 'square'}
                data-testid="settings-layout-square"
                className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-sm font-bold transition-colors cursor-pointer ${
                  settings.layoutMode === 'square'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>{t.squareMode}</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ layoutMode: 'rectangular' })}
                aria-pressed={settings.layoutMode === 'rectangular'}
                data-testid="settings-layout-rect"
                className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-sm font-bold transition-colors cursor-pointer ${
                  settings.layoutMode === 'rectangular'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Rows3 className="w-4 h-4" />
                <span>{t.rectangularMode}</span>
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.settingsLangTitle}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ lang: 'fa' })}
                aria-pressed={settings.lang === 'fa'}
                className={`min-h-[42px] rounded-xl border text-sm font-bold cursor-pointer ${
                  settings.lang === 'fa'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                فارسی (RTL)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ lang: 'en' })}
                aria-pressed={settings.lang === 'en'}
                className={`min-h-[42px] rounded-xl border text-sm font-bold cursor-pointer ${
                  settings.lang === 'en'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                English (LTR)
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.settingsThemeTitle}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                aria-pressed={settings.theme === 'light'}
                className={`min-h-[42px] rounded-xl border text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer ${
                  settings.theme === 'light'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>{t.settingsLight}</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                aria-pressed={settings.theme === 'dark'}
                className={`min-h-[42px] rounded-xl border text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>{t.settingsDark}</span>
              </button>
            </div>
          </div>

          {/* Refresh interval & Persian digits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="settings-refresh-select"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                {t.settingsRefreshTitle}
              </label>
              <select
                id="settings-refresh-select"
                value={settings.refreshSeconds}
                onChange={(e) => onUpdateSettings({ refreshSeconds: Number(e.target.value) })}
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={0}>{settings.lang === 'fa' ? 'دستی' : 'Manual'}</option>
              </select>
            </div>

            {settings.lang === 'fa' && (
              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.settingsDigitsTitle}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ persianDigits: !settings.persianDigits })}
                  className={`w-full min-h-[42px] px-3 rounded-xl border text-sm font-bold cursor-pointer ${
                    settings.persianDigits
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {settings.persianDigits ? '۱۲۳,۴۵۶ (فعال)' : '123,456 (لاتین)'}
                </button>
              </div>
            )}
          </div>

          {/* GitHub APK Build & Android Native Widget Info */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
              <Smartphone className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{t.settingsApkTitle}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.settingsApkDesc}
            </p>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-6 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-sm font-bold cursor-pointer"
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};
