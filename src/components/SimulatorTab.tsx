import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Sliders,
  Play,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  Search,
  Filter,
  Check,
  Info,
  Server,
  Layers,
  ArrowRight
} from 'lucide-react';
import { OjsUser, PurgeCriteria, PurgeResult } from '../types/ojs';
import { initialOjsUsers } from '../data/mockUsers';

interface SimulatorTabProps {
  lang: 'ar' | 'en';
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  // Users in database (mutable state so user can execute purge and observe changes)
  const [users, setUsers] = useState<OjsUser[]>(initialOjsUsers);

  // Criteria settings
  const [criteria, setCriteria] = useState<PurgeCriteria>({
    minAccountAgeDays: 30,
    batchSize: 100,
    requireZeroSubmissions: true,
    requireZeroReviews: true,
    requireZeroEditorialAssignments: true,
    excludeSiteAdmins: true,
    excludeManagers: true,
    onlyNeverLoggedIn: false,
    dryRun: true
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [lastResult, setLastResult] = useState<PurgeResult | null>(null);

  // Calculate candidate users matching the purge criteria
  const { eligibleCandidates, protectedUsers } = useMemo(() => {
    const now = new Date().getTime();
    const minAgeMs = criteria.minAccountAgeDays * 24 * 60 * 60 * 1000;

    const candidates: OjsUser[] = [];
    const protectedList: OjsUser[] = [];

    users.forEach((user) => {
      // 1. Protection rules
      if (criteria.excludeSiteAdmins && user.isSiteAdmin) {
        protectedList.push(user);
        return;
      }

      if (criteria.excludeManagers && user.roles.some((r) => r.includes('Manager') || r.includes('Admin'))) {
        protectedList.push(user);
        return;
      }

      // 2. Academic & Workflow zero-activity requirements
      if (criteria.requireZeroSubmissions && user.submissionCount > 0) {
        protectedList.push(user);
        return;
      }

      if (criteria.requireZeroReviews && user.reviewCount > 0) {
        protectedList.push(user);
        return;
      }

      if (criteria.requireZeroEditorialAssignments && user.editorialAssignmentCount > 0) {
        protectedList.push(user);
        return;
      }

      // 3. Minimum registration age
      const regTime = new Date(user.dateRegistered).getTime();
      if (now - regTime < minAgeMs) {
        protectedList.push(user);
        return;
      }

      // 4. Never logged in filter
      if (criteria.onlyNeverLoggedIn && user.lastLogin !== null) {
        protectedList.push(user);
        return;
      }

      candidates.push(user);
    });

    return { eligibleCandidates: candidates, protectedUsers: protectedList };
  }, [users, criteria]);

  // Current batch to purge (capped at criteria.batchSize, maximum 100)
  const currentBatch = useMemo(() => {
    return eligibleCandidates.slice(0, criteria.batchSize);
  }, [eligibleCandidates, criteria.batchSize]);

  // Filtered list for display in table
  const displayedUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterStatus === 'eligible' && !currentBatch.some((c) => c.id === u.id)) return false;
      if (filterStatus === 'protected' && !protectedUsers.some((p) => p.id === u.id)) return false;
      if (filterStatus === 'spam' && u.status !== 'spam_bot') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, filterStatus, searchQuery, currentBatch, protectedUsers]);

  // Execute Purge or Dry Run
  const handleExecute = async () => {
    if (currentBatch.length === 0) return;

    setIsProcessing(true);
    const mode = criteria.dryRun ? 'dry-run' : 'permanent';

    // Step 1: Initializing transaction
    setProgressStep(isAr ? '1/4: بدء معاملة قاعدة البيانات (DB::beginTransaction)...' : '1/4: Initializing DB Transaction...');
    await new Promise((r) => setTimeout(r, 400));

    // Step 2: Cascading foreign keys
    setProgressStep(
      isAr
        ? `2/4: تنظيف الجداول الفرعية التابعة لـ ${currentBatch.length} حساب (user_settings, user_user_groups, email_log)...`
        : `2/4: Cascading foreign keys for ${currentBatch.length} users (user_settings, user_user_groups)...`
    );
    await new Promise((r) => setTimeout(r, 600));

    // Step 3: Removing user records
    setProgressStep(
      isAr
        ? '3/4: مسح سجلات جدول users الأساسي...'
        : '3/4: Deleting root user records in users table...'
    );
    await new Promise((r) => setTimeout(r, 400));

    // Step 4: Finalizing
    setProgressStep(
      isAr
        ? (criteria.dryRun ? '4/4: محاكاة مكتملة (تم التراجع Rollback لعدم التعديل)' : '4/4: تثبيت المعاملة (DB::commit)...')
        : (criteria.dryRun ? '4/4: Dry run finished (DB Rollback executed)' : '4/4: Committing Transaction (DB::commit)...')
    );
    await new Promise((r) => setTimeout(r, 300));

    // Calculate affected tables
    const batchCount = currentBatch.length;
    const affected = [
      { tableName: 'user_settings', deletedRows: batchCount * 8, description: isAr ? 'البيانات الشخصية واللغات والبيوغرافية' : 'User profile settings & locales' },
      { tableName: 'user_user_groups', deletedRows: batchCount * 1, description: isAr ? 'ربط مجموعات المستخدمين والأدوار' : 'User role assignments' },
      { tableName: 'user_interests', deletedRows: Math.floor(batchCount * 0.4), description: isAr ? 'الكلمات المفتاحية والاهتمامات' : 'Research interests keywords' },
      { tableName: 'email_log_users', deletedRows: Math.floor(batchCount * 0.2), description: isAr ? 'سجلات البريد الإلكتروني' : 'Mail log entries' },
      { tableName: 'notification_subscription_settings', deletedRows: batchCount * 2, description: isAr ? 'اشتراكات الإشعارات' : 'Notification subscriptions' },
      { tableName: 'sessions', deletedRows: Math.floor(batchCount * 0.3), description: isAr ? 'جلسات تسجيل الدخول المفتوحة' : 'Active user sessions' },
      { tableName: 'temporary_files', deletedRows: Math.floor(batchCount * 0.1), description: isAr ? 'الملفات المؤقتة العالقة' : 'Orphan temp files' },
      { tableName: 'users', deletedRows: batchCount, description: isAr ? 'سجل الحساب الرئيسي في جدول المستخدمين' : 'Primary users table rows' }
    ];

    const result: PurgeResult = {
      purgedCount: batchCount,
      purgedUsers: [...currentBatch],
      affectedTables: affected,
      executionTimeMs: 142 + Math.floor(batchCount * 1.8),
      timestamp: new Date().toLocaleString(),
      mode,
      transactionSuccess: true
    };

    setLastResult(result);

    // If permanent, remove from active users state
    if (!criteria.dryRun) {
      const purgedIds = new Set(currentBatch.map((u) => u.id));
      setUsers((prev) => prev.filter((u) => !purgedIds.has(u.id)));
    }

    setIsProcessing(false);
    setProgressStep('');
  };

  // Reset to original mock DB
  const handleReset = () => {
    setUsers(initialOjsUsers);
    setLastResult(null);
  };

  // Export audit log as CSV
  const handleExportCSV = () => {
    if (!lastResult && currentBatch.length === 0) return;
    const exportData = lastResult ? lastResult.purgedUsers : currentBatch;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'User ID,Username,Email,Full Name,Date Registered,Last Login,Status,Submissions,Reviews\n';

    exportData.forEach((u) => {
      csvContent += `${u.id},"${u.username}","${u.email}","${u.fullName}","${u.dateRegistered}","${u.lastLogin || 'Never'}","${u.status}",${u.submissionCount},${u.reviewCount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maas_remover_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Description & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'إجمالي الحسابات بقاعدة البيانات' : 'Total DB Users'}</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{users.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isAr ? 'بيانات حية بمجلة OJS تجريبية' : 'Simulated OJS Journal DB'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400">{isAr ? 'الحسابات المحمية (نشطة / كادر)' : 'Protected Active Users'}</span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{protectedUsers.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isAr ? 'مؤلفون، محكمون، محررون، مشرفون' : 'Authors, Reviewers, Editors, Admins'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400">{isAr ? 'الحسابات الخاملة المرشحة' : 'Orphan Inactive Accounts'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{eligibleCandidates.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isAr ? 'حسابات خاملة بدون أي نشاط أو مقالات' : 'Zero submissions, reviews or tasks'}
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-900/40 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-400 font-semibold">{isAr ? 'الدفعة المستهدفة للحذف' : 'Target Batch to Purge'}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
              {currentBatch.length} / {criteria.batchSize}
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">
            {currentBatch.length} <span className="text-sm font-normal text-slate-400">{isAr ? 'حساب' : 'accounts'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'الحد الأقصى للدفعة الواحدة: 100 حساب' : 'Capped at 100 accounts per batch'}
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Criteria & Execution Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-400" />
                <h3 className="font-semibold text-sm text-white">
                  {isAr ? 'معايير الفحص والتصفية الآمنة' : 'Purge Criteria & Safeguards'}
                </h3>
              </div>
              <button
                onClick={handleReset}
                title={isAr ? 'إعادة تعيين قاعدة البيانات التجريبية' : 'Reset mock database'}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'استعادة' : 'Reset'}</span>
              </button>
            </div>

            {/* Batch Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="batch-size-range" className="text-slate-300 font-medium">
                  {isAr ? 'حجم الدفعة في العملية الواحدة:' : 'Batch Size (accounts per run):'}
                </label>
                <span className="font-mono text-rose-400 font-bold px-2 py-0.5 bg-rose-500/10 rounded">
                  {criteria.batchSize} {isAr ? 'حساب' : 'users'} (Max 100)
                </span>
              </div>
              <input
                id="batch-size-range"
                aria-label={isAr ? 'حجم الدفعة في العملية الواحدة' : 'Batch Size'}
                type="range"
                min="5"
                max="100"
                step="5"
                value={criteria.batchSize}
                onChange={(e) => setCriteria({ ...criteria, batchSize: Number(e.target.value) })}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {isAr
                  ? 'طلب المستخدم: حتى 100 حساب لحماية استقرار خادم MySQL ومنع توقف PHP'
                  : 'Requested ceiling: Up to 100 accounts to prevent lock timeouts'}
              </p>
            </div>

            {/* Minimum Age Days */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="min-age-range" className="text-slate-300 font-medium">
                  {isAr ? 'الحد الأدنى لعمر الحساب:' : 'Minimum Account Age:'}
                </label>
                <span className="font-mono text-indigo-400 font-bold px-2 py-0.5 bg-indigo-500/10 rounded">
                  {criteria.minAccountAgeDays} {isAr ? 'يوم' : 'days'}
                </span>
              </div>
              <input
                id="min-age-range"
                aria-label={isAr ? 'الحد الأدنى لعمر الحساب' : 'Minimum Account Age'}
                type="range"
                min="7"
                max="180"
                step="7"
                value={criteria.minAccountAgeDays}
                onChange={(e) => setCriteria({ ...criteria, minAccountAgeDays: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {isAr
                  ? 'حماية الحسابات الجديدة التي سجلت مؤخراً ولم تبدأ بتقديم أبحاثها بعد'
                  : 'Protects genuine new registrants preparing their first submission'}
              </p>
            </div>

            {/* Safeguard Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                {isAr ? 'صمامات الأمان الأكاديمية (Integrity Locks)' : 'Academic Integrity Locks'}
              </span>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={criteria.requireZeroSubmissions}
                  onChange={(e) => setCriteria({ ...criteria, requireZeroSubmissions: e.target.checked })}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-800"
                />
                <span>{isAr ? 'حظر حذف أي مستخدم لديه أبحاث (Submissions = 0)' : 'Must have 0 Submissions (Authors)'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={criteria.requireZeroReviews}
                  onChange={(e) => setCriteria({ ...criteria, requireZeroReviews: e.target.checked })}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-800"
                />
                <span>{isAr ? 'حظر حذف أي مستخدم لديه تحكيم (Reviews = 0)' : 'Must have 0 Peer Reviews'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={criteria.requireZeroEditorialAssignments}
                  onChange={(e) => setCriteria({ ...criteria, requireZeroEditorialAssignments: e.target.checked })}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-800"
                />
                <span>{isAr ? 'حظر حذف المحررين ومساعدي الإنتاج' : 'Must have 0 Editorial Assignments'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={criteria.excludeSiteAdmins}
                  disabled
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-800 opacity-60"
                />
                <span className="flex items-center gap-1">
                  {isAr ? 'حماية مديري النظام (Site Admins) - إلزامي دائماً' : 'Protect Site Admins (Always Mandatory)'}
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={criteria.onlyNeverLoggedIn}
                  onChange={(e) => setCriteria({ ...criteria, onlyNeverLoggedIn: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                />
                <span>{isAr ? 'استهداف فقط الحسابات التي لم تسجل دخول أبداً' : 'Target ONLY users who never logged in'}</span>
              </label>
            </div>

            {/* Execution Mode Selector: Dry Run vs Permanent */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-2">
                {isAr ? 'وضع التنفيذ (Execution Mode)' : 'Execution Mode'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCriteria({ ...criteria, dryRun: true })}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition ${
                    criteria.dryRun
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isAr ? 'معاينة تجريبية (Dry Run)' : 'Safe Dry-Run'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCriteria({ ...criteria, dryRun: false })}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition ${
                    !criteria.dryRun
                      ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/30'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حذف نهائي وشامل' : 'Permanent Wipe'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleExecute}
                disabled={isProcessing || currentBatch.length === 0}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  criteria.dryRun
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/50'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : criteria.dryRun ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>
                  {criteria.dryRun
                    ? isAr
                      ? `محاكاة آمنة لحذف (${currentBatch.length}) حساب`
                      : `Dry-Run Simulation (${currentBatch.length} Users)`
                    : isAr
                    ? `تنفيذ الحذف النهائي الجذري لـ (${currentBatch.length}) حساب`
                    : `Permanently Wipe (${currentBatch.length}) Accounts`}
                </span>
              </button>

              {currentBatch.length === 0 && (
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  {isAr ? 'لا توجد حسابات تنطبق عليها هذه المعايير حالياً' : 'No accounts match the current filter criteria'}
                </p>
              )}
            </div>
          </div>

          {/* Real-time Progress Card when running */}
          {isProcessing && (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-4 shadow-lg animate-pulse text-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                <span>{isAr ? 'جاري تنفيذ المعاملة المتسلسلة...' : 'Executing Atomic Transaction...'}</span>
              </div>
              <p className="text-slate-300 font-mono text-[11px]">{progressStep}</p>
            </div>
          )}

          {/* Quick Audit Export Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">
                {isAr ? 'تصدير سجل التدقيق (Audit Report)' : 'Export Audit Log'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'حفظ قائمة الحسابات المستهدفة بصيغة CSV' : 'Download CSV log of target accounts'}
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Right Column: Results & Interactive Users Database (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Last Result Alert (if any) */}
          {lastResult && (
            <div
              className={`rounded-xl border p-4 text-xs space-y-3 transition-all ${
                lastResult.mode === 'dry-run'
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {lastResult.mode === 'dry-run' ? (
                    <Eye className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>
                    {lastResult.mode === 'dry-run'
                      ? isAr
                        ? `معاينة تجريبية ناجحة: تم فحص وتحديد (${lastResult.purgedCount}) حساب جاهز للحذف`
                        : `Dry-Run Success: Projected (${lastResult.purgedCount}) users ready for purge`
                      : isAr
                      ? `تم الحذف النهائي والكامل بنجاح لـ (${lastResult.purgedCount}) حساب من كافة الجداول!`
                      : `Successfully Purged (${lastResult.purgedCount}) Accounts across all relational tables!`}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {lastResult.executionTimeMs} ms
                </span>
              </div>

              {/* Affected Tables breakdown badge list */}
              <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
                <div className="font-medium text-[11px] text-slate-300 mb-2 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {isAr
                      ? 'الصفوف التي شملها التنظيف الجذري بالترتيب التسلسلي (Zero Orphan Records):'
                      : 'Records cleaned across relational tables (Cascading Order):'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {lastResult.affectedTables.map((t) => (
                    <div key={t.tableName} className="bg-slate-900 border border-slate-800 rounded p-1.5 text-center">
                      <div className="text-[10px] text-slate-400 font-mono truncate">{t.tableName}</div>
                      <div className="text-xs font-bold text-rose-400 font-mono">-{t.deletedRows}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Database Viewer & Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {/* Table Header Controls */}
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={isAr ? 'بحث بالاسم، المعرف، أو البريد...' : 'Search username, email, ID...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 text-xs bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'} ({users.length})
                </button>
                <button
                  onClick={() => setFilterStatus('eligible')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    filterStatus === 'eligible' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'المستهدف بالدفعة' : 'Target Batch'} ({currentBatch.length})
                </button>
                <button
                  onClick={() => setFilterStatus('protected')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    filterStatus === 'protected' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'محمي ومستثنى' : 'Protected'} ({protectedUsers.length})
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto max-h-[460px] scrollbar-thin scrollbar-thumb-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">{isAr ? 'المعرف' : 'ID'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'اسم المستخدم والبريد' : 'User / Email'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'تاريخ التسجيل' : 'Registered'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'آخر دخول' : 'Last Login'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'الأبحاث' : 'Submissions'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'التحكيم' : 'Reviews'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'الحالة / الأمان' : 'Status / Safety'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {displayedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        {isAr ? 'لا توجد سجلات مطابقة للبحث' : 'No records matching query'}
                      </td>
                    </tr>
                  ) : (
                    displayedUsers.map((user) => {
                      const isTargeted = currentBatch.some((b) => b.id === user.id);
                      const isProtected = protectedUsers.some((p) => p.id === user.id);

                      return (
                        <tr
                          key={user.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isTargeted ? 'bg-rose-950/10' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-slate-400">#{user.id}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-sans font-semibold text-white flex items-center gap-1.5">
                              <span>{user.username}</span>
                              {user.isSiteAdmin && (
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                              {user.email}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                            {user.dateRegistered.substring(0, 10)}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] whitespace-nowrap">
                            {user.lastLogin ? (
                              <span className="text-slate-300">{user.lastLogin.substring(0, 10)}</span>
                            ) : (
                              <span className="text-rose-400 font-sans text-[10px] bg-rose-500/10 px-1 rounded">
                                {isAr ? 'لم يدخل أبداً' : 'Never'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                user.submissionCount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'
                              }`}
                            >
                              {user.submissionCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                user.reviewCount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'
                              }`}
                            >
                              {user.reviewCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            {isTargeted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <Trash2 className="w-3 h-3" />
                                {isAr ? 'مستهدف بالدفعة' : 'Targeted'}
                              </span>
                            ) : isProtected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <ShieldAlert className="w-3 h-3" />
                                {isAr ? 'محمي ومستثنى' : 'Protected'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500">
                                {isAr ? 'مؤجل للدفعة القادمة' : 'Next Batch'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                {isAr
                  ? `عرض ${displayedUsers.length} من أصل ${users.length} حساب`
                  : `Showing ${displayedUsers.length} of ${users.length} accounts`}
              </span>
              <span className="text-slate-500">
                {isAr
                  ? 'تم فحص جداول: submissions, review_assignments, stage_assignments, site'
                  : 'Scanned tables: submissions, review_assignments, stage_assignments, site'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
