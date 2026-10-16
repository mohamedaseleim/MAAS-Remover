import React from 'react';
import { Database, Download, ShieldCheck, Code, BookOpen, Layers, Terminal, Sparkles } from 'lucide-react';
import { OjsVersion } from '../types/ojs';

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  version: OjsVersion;
  setVersion: (ver: OjsVersion) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickDownload: () => void;
  isDownloading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  version,
  setVersion,
  activeTab,
  setActiveTab,
  onQuickDownload,
  isDownloading
}) => {
  const isAr = lang === 'ar';

  const tabs = [
    {
      id: 'simulator',
      labelAr: 'المحاكي الحي والتنظيف',
      labelEn: 'Live Sandbox & Purge',
      icon: Database
    },
    {
      id: 'downloader',
      labelAr: 'حزمة الإضافة والتحميل',
      labelEn: 'Plugin Package & Download',
      icon: Download
    },
    {
      id: 'code',
      labelAr: 'مستعرض الأكواد البرمجية',
      labelEn: 'Source Code Inspector',
      icon: Code
    },
    {
      id: 'database',
      labelAr: 'استعلامات SQL والجداول',
      labelEn: 'SQL Queries & Schema',
      icon: Layers
    },
    {
      id: 'guide',
      labelAr: 'دليل التثبيت والتحسينات',
      labelEn: 'Guide & Enhancements',
      icon: BookOpen
    }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 text-white">
      {/* Top Banner with Branding & Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-600 to-indigo-600 p-0.5 shadow-lg shadow-rose-900/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-rose-400 via-amber-300 to-indigo-300 bg-clip-text text-transparent">
                  MAAS Remover
                </h1>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  OJS Generic Plugin
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> v1.2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'حذف الحسابات الخاملة والسبام في Open Journal Systems نهائياً بأمان تام (حتى 100 حساب/دفعة)'
                  : 'Safe, complete bulk purge of inactive & spam orphan accounts in Open Journal Systems'}
              </p>
            </div>
          </div>

          {/* Configuration Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* OJS Version Selector */}
            <div className="flex items-center text-xs bg-slate-800/80 rounded-lg p-1 border border-slate-700">
              <span className="px-2 text-slate-400 hidden sm:inline">
                {isAr ? 'إصدار OJS:' : 'OJS Version:'}
              </span>
              {(['universal', '3.4+', '3.3-lts'] as OjsVersion[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVersion(v)}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    version === v
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  {v === 'universal' ? (isAr ? 'شامل (3.3 / 3.4 / 3.5)' : 'Universal') : v === '3.4+' ? 'OJS 3.4 / 3.5' : 'OJS 3.3 LTS'}
                </button>
              ))}
            </div>

            {/* Language Switcher */}
            <div className="flex items-center text-xs bg-slate-800/80 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setLang('ar')}
                className={`px-2.5 py-1 rounded-md transition font-semibold ${
                  lang === 'ar' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md transition font-semibold ${
                  lang === 'en' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            {/* Quick Download Button */}
            <button
              onClick={onQuickDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/30 transition-all active:scale-95 disabled:opacity-50"
              title={isAr ? 'تحميل حزمة الإضافة مباشرة' : 'Download ready-to-install ZIP package'}
            >
              <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? (isAr ? 'جارِ التحزيم...' : 'Packaging...') : (isAr ? 'تحميل الإضافة .ZIP' : 'Download .ZIP')}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 mt-3.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/60 pt-2.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
