import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Code2,
  FolderTree,
  Terminal,
  Layers,
  Info
} from 'lucide-react';
import { OjsVersion } from '../types/ojs';
import { getPluginFiles } from '../data/pluginCodeTemplates';

interface CodeInspectorTabProps {
  lang: 'ar' | 'en';
  version: OjsVersion;
}

export const CodeInspectorTab: React.FC<CodeInspectorTabProps> = ({ lang, version }) => {
  const isAr = lang === 'ar';
  const files = getPluginFiles(version);
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[2].path); // MaasRemoverPlugin.php by default
  const [copied, setCopied] = useState(false);

  const selectedFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const lines = selectedFile.code.split('\n');

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-rose-400" />
            <span>{isAr ? 'مستعرض الأكواد المصدرية الكاملة لإضافة MAAS Remover' : 'MAAS Remover Source Code Inspector'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr
              ? 'يمكنك معاينة ونسخ أي ملف برمجياً أو تنزيل الحزمة الكاملة من تبويب التحميل'
              : 'Inspect, read and copy individual plugin scripts and template files'}
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ هذا الملف' : 'Copy File Content')}</span>
        </button>
      </div>

      {/* Main Code View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: File Selector Sidebar (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
            <span>plugins/generic/maasRemover/</span>
          </div>

          <div className="space-y-1">
            {files.map((file) => {
              const isSelected = file.path === selectedFilePath;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left rtl:text-right px-3 py-2 rounded-lg text-xs font-mono transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-rose-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.filename}</span>
                  </div>
                  <span className="text-[10px] uppercase font-sans px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 shrink-0">
                    {file.language}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 mt-2 text-[11px] text-slate-400 px-2 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'شرح الملف المحدد:' : 'Selected File Overview:'}</span>
            </div>
            <p className="leading-relaxed">
              {isAr ? selectedFile.descriptionAr : selectedFile.description}
            </p>
          </div>
        </div>

        {/* Right: Code Viewer (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col">
          {/* File bar */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs text-rose-300 font-semibold">
              <FileCode className="w-4 h-4 text-rose-400" />
              <span>{selectedFile.path}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {lines.length} {isAr ? 'سطر' : 'lines'}
            </span>
          </div>

          {/* Syntax Highlighted Code Box */}
          <div className="overflow-x-auto p-4 max-h-[550px] font-mono text-xs leading-relaxed text-slate-300 scrollbar-thin scrollbar-thumb-slate-800">
            <pre className="table w-full">
              {lines.map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/60 transition-colors">
                  <span className="table-cell select-none text-slate-600 text-right pr-4 pl-1 w-10 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
