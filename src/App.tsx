/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SimulatorTab } from './components/SimulatorTab';
import { PluginDownloaderTab } from './components/PluginDownloaderTab';
import { CodeInspectorTab } from './components/CodeInspectorTab';
import { DatabaseEngineTab } from './components/DatabaseEngineTab';
import { GuideTab } from './components/GuideTab';
import { OjsVersion } from './types/ojs';
import { generateOjsPluginZip, downloadBlob } from './utils/zipGenerator';
import { ShieldCheck, Heart, Github } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [version, setVersion] = useState<OjsVersion>('universal');
  const [activeTab, setActiveTab] = useState<string>('simulator');
  const [isDownloading, setIsDownloading] = useState(false);

  // Set document dir and lang attribute for perfect typography & layout
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (lang === 'ar') {
      document.body.style.fontFamily = "'Cairo', sans-serif";
    } else {
      document.body.style.fontFamily = "'Inter', sans-serif";
    }
  }, [lang]);

  const handleQuickDownload = async () => {
    try {
      setIsDownloading(true);
      const zipBlob = await generateOjsPluginZip(version);
      downloadBlob(zipBlob, `maasRemover-v1.2.0-ojs-${version}.zip`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <Header
        lang={lang}
        setLang={setLang}
        version={version}
        setVersion={setVersion}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickDownload={handleQuickDownload}
        isDownloading={isDownloading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'simulator' && <SimulatorTab lang={lang} />}
        {activeTab === 'downloader' && (
          <PluginDownloaderTab
            lang={lang}
            version={version}
            setVersion={setVersion}
          />
        )}
        {activeTab === 'code' && <CodeInspectorTab lang={lang} version={version} />}
        {activeTab === 'database' && <DatabaseEngineTab lang={lang} />}
        {activeTab === 'guide' && (
          <GuideTab
            lang={lang}
            onGoToDownloader={() => setActiveTab('downloader')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-500" />
            <span className="font-semibold text-slate-400">MAAS Remover</span>
            <span>—</span>
            <span>
              {lang === 'ar'
                ? 'إضافة متوافقة مع معايير Public Knowledge Project (PKP) OJS'
                : 'Compatible with Public Knowledge Project (PKP) Open Journal Systems'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>v1.2.0 (Dual OJS 3.3 LTS & 3.4/3.5)</span>
            <span>•</span>
            <span>ACID DB Transactions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
