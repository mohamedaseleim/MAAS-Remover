import React, { useState } from 'react';
import {
  Download,
  FolderArchive,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Settings,
  Sparkles,
  Info,
  ExternalLink
} from 'lucide-react';
import { OjsVersion } from '../types/ojs';
import { generateOjsPluginZip, downloadBlob } from '../utils/zipGenerator';
import { getPluginFiles } from '../data/pluginCodeTemplates';

interface PluginDownloaderTabProps {
  lang: 'ar' | 'en';
  version: OjsVersion;
  setVersion: (v: OjsVersion) => void;
}

export const PluginDownloaderTab: React.FC<PluginDownloaderTabProps> = ({
  lang,
  version,
  setVersion
}) => {
  const isAr = lang === 'ar';
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const files = getPluginFiles(version);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      setDownloadSuccess(false);
      const zipBlob = await generateOjsPluginZip(version);
      downloadBlob(zipBlob, `maasRemover-v1.2.0-ojs-${version}.zip`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 6000);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Packaging Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'حزمة جاهزة للتثبيت الفوري في OJS' : 'Ready-to-Install OJS Generic Plugin'}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {isAr ? 'تحميل إضافة MAAS Remover الرسمية' : 'Download Official MAAS Remover Plugin'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'حزمة برمجية متكاملة تتوافق بدقة مع معايير PKP OJS (الإصدارات 3.3 LTS و 3.4 و 3.5). تدعم واجهة التحكم الرسومية (GUI)، وأداة سطر الأوامر (CLI Tool)، وتدعم الحذف الجذري لـ 100 حساب في كل دفعة.'
                : 'Fully packaged according to PKP OJS generic plugin architecture (OJS 3.3 LTS, 3.4 & 3.5). Features admin web UI, CLI background tools, and 100-account atomic batch deletion.'}
            </p>

            {/* Version pills */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">{isAr ? 'الإصدار الموجه:' : 'Target Build:'}</span>
              {(['universal', '3.4+', '3.3-lts'] as OjsVersion[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVersion(v)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    version === v
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-900/30 font-bold'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {v === 'universal'
                    ? isAr
                      ? 'النسخة الشاملة (Universal 3.3/3.4/3.5)'
                      : 'Universal (All 3.x)'
                    : v === '3.4+'
                    ? 'OJS 3.4+ / 3.5 (PSR-4 Namespaces)'
                    : 'OJS 3.3.x (LTS DAOs)'}
                </button>
              ))}
            </div>
          </div>

          {/* Download CTA Box */}
          <div className="w-full md:w-auto flex flex-col items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full md:w-auto px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-xl shadow-rose-950/40 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Download className={`w-5 h-5 ${isGenerating ? 'animate-bounce' : ''}`} />
              <div className="text-left rtl:text-right">
                <div className="leading-tight">
                  {isGenerating
                    ? isAr
                      ? 'جارِ تجهيز ملف الأرشيف...'
                      : 'Building ZIP Archive...'
                    : isAr
                    ? 'تحميل حزمة maasRemover.zip'
                    : 'Download maasRemover.zip'}
                </div>
                <div className="text-[11px] font-normal text-rose-200">
                  {isAr ? 'مضغوطة بصيغة ZIP صالحة للتثبيت المباشر' : 'Format: ZIP • PKP Generic Plugin'}
                </div>
              </div>
            </button>

            {downloadSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تم بدء تحميل الحزمة بنجاح!' : 'Package downloaded successfully!'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Package Contents Tree & Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Included Files Explorer (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-sm text-white">
                {isAr ? 'هيكل الملفات المضمنة داخل الحزمة' : 'Package Files Manifest'}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{files.length} {isAr ? 'ملفات' : 'files'}</span>
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.path}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-850 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-2.5">
                  <FileCode className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-mono text-xs text-slate-200 font-semibold">{file.path}</div>
                    <div className="text-[11px] text-slate-400">
                      {isAr ? file.descriptionAr : file.description}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {file.language}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Technical Specs & Installation Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 text-white font-semibold text-sm border-b border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'المواصفات الفنية للـ Plugin' : 'Technical Specifications'}</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">{isAr ? 'اسم الإضافة (Name):' : 'Plugin Name:'}</span>
                <span className="font-mono text-white font-bold">MAAS Remover</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">{isAr ? 'تصنيف الإضافة:' : 'Plugin Category:'}</span>
                <span className="font-mono text-indigo-400">plugins/generic/</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">{isAr ? 'الحد الأقصى للدفعة:' : 'Max Batch Limit:'}</span>
                <span className="font-mono text-rose-400 font-bold">100 {isAr ? 'حساب/دفعة' : 'users/batch'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">{isAr ? 'معيار الحذف:' : 'Delete Strategy:'}</span>
                <span className="text-emerald-400 font-medium">{isAr ? 'حذف جذري متسلسل (Cascade)' : 'Full Relational Cascade'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">{isAr ? 'حماية النزاهة:' : 'Zero-Activity Guard:'}</span>
                <span className="text-slate-200">{isAr ? '6 مستويات أمان ضد الخطأ' : '6-level fail-safe protection'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">{isAr ? 'معاملات قاعدة البيانات:' : 'DB Transactions:'}</span>
                <span className="font-mono text-amber-400">Atomic ACID (DB::beginTransaction)</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">{isAr ? 'اللغات المدعومة:' : 'Supported Locales:'}</span>
                <span className="text-slate-200">العربية (ar_IQ) & English (en_US)</span>
              </div>
            </div>
          </div>

          {/* Quick CLI snippet */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'تشغيل فوري عبر سطر الأوامر (CLI)' : 'Run via Terminal / SSH'}</span>
            </div>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'إذا كانت لديك عشرات الآلاف من حسابات السبام، شغّل الأمر التالي مباشرة من مسار OJS:'
                : 'For massive spam cleanups with tens of thousands of accounts, execute via CLI:'}
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto">
              php plugins/generic/maasRemover/tools/maas_remover_cli.php --batch=100 --force
            </div>
          </div>

          {/* GitHub Clone Quick Card */}
          <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <span>{isAr ? 'التثبيت مباشرة من GitHub' : 'Install via GitHub (Git Clone)'}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                git clone
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'قم بتنفيذ هذا الأمر داخل مجلد OJS الأساسي لاستنساخ الإضافة في مسارها الصحيح:'
                : 'Run this command inside your root OJS directory to clone into canonical plugin path:'}
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              git clone https://github.com/maas-remover/maasRemover.git plugins/generic/maasRemover
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
