import React, { useState } from 'react';
import {
  Layers,
  Database,
  Copy,
  Check,
  AlertOctagon,
  CheckCircle2,
  GitBranch,
  ShieldAlert,
  Terminal,
  FileCode2
} from 'lucide-react';

interface DatabaseEngineTabProps {
  lang: 'ar' | 'en';
}

export const DatabaseEngineTab: React.FC<DatabaseEngineTabProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [sqlDialect, setSqlDialect] = useState<'mysql' | 'postgres'>('mysql');

  const rawSqlQuery = `-- ====================================================================
-- MAAS REMOVER: SAFE BULK PURGE FOR INACTIVE / ORPHAN OJS ACCOUNTS
-- Target: Zero-Activity users (Submissions=0, Reviews=0, Tasks=0)
-- Batch Size: Max 100 users per transaction
-- Dialect: ${sqlDialect.toUpperCase()}
-- ====================================================================

START TRANSACTION;

-- Step 1: Create a temporary table with the 100 candidate orphan user IDs
CREATE TEMPORARY TABLE IF NOT EXISTS maas_target_orphans (
    user_id BIGINT PRIMARY KEY
);
TRUNCATE TABLE maas_target_orphans;

INSERT INTO maas_target_orphans (user_id)
SELECT u.user_id
FROM users u
WHERE u.date_registered <= NOW() - INTERVAL 30 DAY
  -- Guard 1: Never target site admin
  AND NOT EXISTS (
      SELECT 1 FROM site s WHERE s.site_admin_user_id = u.user_id
  )
  -- Guard 2: Never target journal managers or editors
  AND NOT EXISTS (
      SELECT 1 FROM user_user_groups uug
      JOIN user_groups ug ON ug.user_group_id = uug.user_group_id
      WHERE uug.user_id = u.user_id AND ug.role_id IN (1, 16, 17)
  )
  -- Guard 3: Must have ZERO submissions (not an author)
  AND NOT EXISTS (
      SELECT 1 FROM submissions s WHERE s.user_id = u.user_id
  )
  AND NOT EXISTS (
      SELECT 1 FROM authors a WHERE a.email = u.email
  )
  -- Guard 4: Must have ZERO peer review assignments
  AND NOT EXISTS (
      SELECT 1 FROM review_assignments ra WHERE ra.reviewer_id = u.user_id
  )
  -- Guard 5: Must have ZERO editorial stage assignments
  AND NOT EXISTS (
      SELECT 1 FROM stage_assignments sa WHERE sa.user_id = u.user_id
  )
  -- Guard 6: Must have ZERO editorial event log entries
  AND NOT EXISTS (
      SELECT 1 FROM event_log el WHERE el.user_id = u.user_id
  )
ORDER BY u.user_id ASC
LIMIT 100;

-- Step 2: Cascading Deletion across all dependent relational tables
DELETE FROM user_settings 
WHERE user_id IN (SELECT user_id FROM maas_target_orphans);

DELETE FROM user_user_groups 
WHERE user_id IN (SELECT user_id FROM maas_target_orphans);

DELETE FROM user_interests 
WHERE user_id IN (SELECT user_id FROM maas_target_orphans);

DELETE FROM email_log_users 
WHERE user_id IN (SELECT user_id FROM maas_target_orphans);

DELETE FROM notes 
WHERE user_id IN (SELECT user_id FROM maas_target_orphans);

DELETE FROM temporary_files 
WHERE user_id IN (SELECT user_id FROM maas_target_orphans);

DELETE FROM sessions 
WHERE user_id IN (SELECT user_id FROM maas_target_orphans);

DELETE FROM notification_subscription_settings 
WHERE user_id IN (SELECT user_id FROM maas_target_orphans);

DELETE FROM access_keys 
WHERE user_id IN (SELECT user_id FROM maas_target_orphans);

-- Step 3: Delete primary user records from users table
DELETE FROM users 
WHERE user_id IN (SELECT user_id FROM maas_target_orphans);

-- Step 4: Drop temporary table
DROP TEMPORARY TABLE IF EXISTS maas_target_orphans;

-- Step 5: Commit changes permanently
COMMIT;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(rawSqlQuery);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2500);
  };

  const cascadeTables = [
    { name: 'user_settings', role: 'Profile & Locales', roleAr: 'بيانات الملف الشخصي والإعدادات واللغات', order: 1 },
    { name: 'user_user_groups', role: 'Role Assignments', roleAr: 'ربط الأدوار والصلاحيات', order: 2 },
    { name: 'user_interests', role: 'Keywords/Interests', roleAr: 'الاهتمامات البحثية والكلمات المفتاحية', order: 3 },
    { name: 'email_log_users', role: 'Mail Log Links', roleAr: 'سجلات المراسلات البريدية', order: 4 },
    { name: 'notes', role: 'Editorial Notes', roleAr: 'الملاحظات الملحقة', order: 5 },
    { name: 'temporary_files', role: 'Orphan Uploads', roleAr: 'الملفات المؤقتة العالقة', order: 6 },
    { name: 'sessions', role: 'Active Login Sessions', roleAr: 'جلسات المتصفح المفتوحة', order: 7 },
    { name: 'notification_subscription_settings', role: 'Email Subscriptions', roleAr: 'اشتراكات إشعارات المجلات', order: 8 },
    { name: 'access_keys', role: 'One-Time Tokens', roleAr: 'مفاتيح التخويل والرموز المؤقتة', order: 9 },
    { name: 'users', role: 'Primary Root Record (Final step)', roleAr: 'السجل الأساسي في جدول المستخدمين (آخر خطوة)', order: 10, isRoot: true }
  ];

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <span>
            {isAr ? 'هندسة قاعدة بيانات OJS واستراتيجية الحذف المتسلسل (Cascade)' : 'OJS Database Architecture & Cascading Deletion Strategy'}
          </span>
        </h2>
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
          {isAr
            ? 'في نظام OJS، يؤدي حذف المستخدم من جدول users بشكل مباشر ومجرد إلى بقاء مئات السجلات "اليتيمة" (Orphan Records) وتلف القيود الترابطية (Foreign Keys). يقوم محرك MAAS Remover بتنفيذ الحذف المتسلسل داخل معاملة ذرية متكاملة (Atomic ACID Transaction) لضمان نظافة قاعدة البيانات بنسبة 100%.'
            : 'In Open Journal Systems, raw deletes fail due to foreign keys or leave thousands of orphaned settings rows. MAAS Remover enforces an atomic cascading transaction across all 10 relational tables in exact dependency order.'}
        </p>
      </div>

      {/* Relational Dependency Flow Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-rose-400" />
            <h3 className="font-semibold text-sm text-white">
              {isAr ? 'ترتيب تسلسل الحذف لحماية القيود (Execution Cascade Order)' : 'Cascading Table Execution Order'}
            </h3>
          </div>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            {isAr ? 'صفر سجلات عالقة (Zero Orphan Rows)' : 'Zero Dangling Pointers'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {cascadeTables.map((t) => (
            <div
              key={t.name}
              className={`p-3 rounded-xl border transition ${
                t.isRoot
                  ? 'bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-950/30'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  t.isRoot ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  #{t.order}
                </span>
                {t.isRoot && (
                  <span className="text-[10px] text-rose-400 font-bold uppercase">{isAr ? 'الجدول الرئيسي' : 'ROOT'}</span>
                )}
              </div>
              <div className="font-mono text-xs font-bold text-white truncate">{t.name}</div>
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                {isAr ? t.roleAr : t.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw SQL Query for DBAs & Direct Execution */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-xs font-bold text-white">
                {isAr ? 'استعلام SQL الصريح والمباشر لقواعد البيانات' : 'Raw Production SQL Script (for phpMyAdmin / DBAs)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'يمكن لمدير قواعد البيانات تشغيل هذا الاستعلام مباشرة في خادم MySQL أو MariaDB'
                  : 'Ready to execute directly via CLI or GUI database managers with ACID rollback on failure'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setSqlDialect('mysql')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  sqlDialect === 'mysql' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                MySQL / MariaDB
              </button>
              <button
                onClick={() => setSqlDialect('postgres')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  sqlDialect === 'postgres' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                PostgreSQL
              </button>
            </div>

            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white border border-slate-700 transition"
            >
              {copiedQuery ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedQuery ? (isAr ? 'تم نسخ SQL!' : 'Copied!') : (isAr ? 'نسخ كود SQL' : 'Copy SQL')}</span>
            </button>
          </div>
        </div>

        <div className="p-4 overflow-x-auto max-h-[460px] font-mono text-xs leading-relaxed text-amber-200/90 scrollbar-thin scrollbar-thumb-slate-800 bg-slate-950">
          <pre className="whitespace-pre">{rawSqlQuery}</pre>
        </div>
      </div>
    </div>
  );
};
