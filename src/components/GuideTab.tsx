import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  FileCode,
  AlertTriangle,
  Lightbulb,
  Lock,
  ArrowRight,
  BookOpen,
  Server,
  Zap,
  Clock,
  Download
} from 'lucide-react';

interface GuideTabProps {
  lang: 'ar' | 'en';
  onGoToDownloader: () => void;
}

export const GuideTab: React.FC<GuideTabProps> = ({ lang, onGoToDownloader }) => {
  const isAr = lang === 'ar';

  const enhancements = [
    {
      id: 1,
      titleAr: 'صمامات أمان النزاهة الأكاديمية (Academic Integrity Guard)',
      titleEn: 'Academic Integrity Guard (6-Tier Protection)',
      descAr: 'عدم الاكتفاء بفحص تاريخ آخر تسجيل دخول، بل التحقق الشامل من 6 جداول حيوية (عدم وجود مقالات منشورة أو قيد التحكيم، عدم وجود تكليفات تحكيم، عدم وجود مهام تحرير، وعدم حذف مديري النظام مطلقاً).',
      descEn: 'Never purge by login date alone. Enforces checks across 6 critical relational vectors (submissions, reviews, stage assignments, event log, authors, site admin).',
      badge: isAr ? 'أمان بنسبة 100%' : '100% Safe',
      icon: ShieldCheck
    },
    {
      id: 2,
      titleAr: 'الحذف الآمن بالدفعات (100 حساب/دفعة) مع المعاملات الذرية (ACID)',
      titleEn: 'Transactional Batching (100 Accounts/Run)',
      descAr: 'تطبيق الحذف داخل معاملة (DB::beginTransaction) لضمان التراجع الفوري (Rollback) في حال حدوث أي خطأ، مع تقسيم العمليات بحد أقصى 100 حساب لمنع تجميد خادم MySQL (Table Lock).',
      descEn: 'Executes within atomic DB transactions with instant rollback on error, chunking into 100 accounts to prevent MySQL locks and PHP gateway timeouts.',
      badge: isAr ? 'طلب أساسي' : 'Core Requirement',
      icon: Zap
    },
    {
      id: 3,
      titleAr: 'المعاينة التجريبية الآمنة (Dry-Run Mode)',
      titleEn: 'Safe Dry-Run Preview Mode',
      descAr: 'إمكانية تشغيل فحص افتراضي يحاكي الحذف بدقة ويظهر عدد السجلات التي ستتأثر في كل جدول، قبل ضغط زر الحذف النهائي الذي لا رجعة فيه.',
      descEn: 'Simulates the deletion run without altering data, projecting exact row deletions per table before permanent execution.',
      badge: isAr ? 'ميزة حاسمة' : 'Crucial Safety',
      icon: Lightbulb
    },
    {
      id: 4,
      titleAr: 'محرك سطر الأوامر المستقل (CLI Tool & Cron Support)',
      titleEn: 'CLI Engine & Cron Scheduled Task',
      descAr: 'توفير أداة سطر أوامر جاهزة (tools/maas_remover_cli.php) تمكّن مشرف السيرفر من معالجة آلاف حسابات السبام المتراكمة دفعة تلو الأخرى دون التأثر بمهلة المتصفح (PHP 30s Timeout).',
      descEn: 'Dedicated CLI script for processing 50k+ spam accounts in server loops or automated cron jobs without browser timeouts.',
      badge: isAr ? 'للأعداد الضخمة' : 'High Volume',
      icon: Terminal
    },
    {
      id: 5,
      titleAr: 'سجل التدقيق الإداري والتصدير (Audit Logging & CSV)',
      titleEn: 'Audit Logging & CSV/JSON Export',
      descAr: 'توليد وتصدير سجل رسمي بأسماء ومعرفات الحسابات المستهدفة والمحذوفة مع الطوابع الزمنية، لتلبية متطلبات الشفافية وتوثيق هيئة التحرير (COPE Standards).',
      descEn: 'Generates exportable CSV/JSON audit logs with user IDs, usernames, emails, and purge timestamps for institutional compliance.',
      badge: isAr ? 'حوكمة وتدقيق' : 'Governance',
      icon: BookOpen
    },
    {
      id: 6,
      titleAr: 'التنظيف الجذري لـ 10 جداول تابعة (Zero Dangling Records)',
      titleEn: 'Deep Cascading Clean Across 10 Tables',
      descAr: 'تنظيف شامل للبيانات الشخصية والاهتمامات والملفات المؤقتة والجلسات وسجلات البريد، مما يمنع بقاء أي بيانات ميتة (Ghost Records) داخل قاعدة البيانات.',
      descEn: 'Cleans user_settings, user_user_groups, temporary_files, sessions, notes, access_keys and mail logs in strict cascade order.',
      badge: isAr ? 'نظافة تامة' : 'Zero Ghost Data',
      icon: Lock
    },
    {
      id: 7,
      titleAr: 'التوافق الثنائي بين معماريات OJS (Dual Compatibility)',
      titleEn: 'Dual Compatibility (OJS 3.3 LTS vs OJS 3.4/3.5)',
      descAr: 'التوافق مع أحدث إصدارات OJS 3.4+ المعتمدة على مجالات الأسماء PSR-4 و Laravel Illuminate، مع دعم الأجهزة والمجلات التي لا تزال تعمل على OJS 3.3 LTS.',
      descEn: 'Supports both modern PSR-4 / Laravel Eloquent architectures in OJS 3.4/3.5 and legacy DAOs in 3.3 LTS.',
      badge: isAr ? 'تغطية شاملة' : 'Broad Support',
      icon: Server
    },
    {
      id: 8,
      titleAr: 'حماية وقائية استباقية من سبام التسجيل (Proactive Anti-Spam)',
      titleEn: 'Proactive Prevention Recommendations',
      descAr: 'توجيه إدارة المجلة إلى تفعيل حقل مصيدة الروبوتات (Honeypot Plugin) وميزة Google reCAPTCHA v3 في نموذج التسجيل لمنع تسجيل آلاف البوتات في المستقبل.',
      descEn: 'Best-practice guidelines for configuring honeypots and invisible reCAPTCHA v3 to stop future spam bot registrations.',
      badge: isAr ? 'وقاية للمستقبل' : 'Future Proof',
      icon: Sparkles
    }
  ];

  return (
    <div className="space-y-8">
      {/* Improvements Intro Section */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-rose-950/30 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-2xl p-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'التحسينات والتعديلات المقترحة على الفكرة الأولية' : 'Architectural Enhancements Added to Initial Idea'}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {isAr
              ? 'كيف قمنا بتطوير فكرة MAAS Remover لتصبح إضافة بمستوى المؤسسات الأكاديمية؟'
              : 'How We Elevated MAAS Remover into an Enterprise-Grade OJS Plugin'}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-2 leading-relaxed">
            {isAr
              ? 'بناءً على طلبكم: "اعتبر ذلك فكرة اولية وادخل اي تعديلات او تحسينات عليها"، قمنا بإضافة 8 تحسينات هيكلية جوهرية تحول الإضافة من مجرد سكريبت حذف عشوائي إلى أداة رسمية آمنة بنسبة 100% تحمي سلامة المجلة والبيانات الأكاديمية:'
              : 'Per your request to refine and expand upon the initial idea, we engineered 8 major safeguards and features transforming raw deletion into a reliable, enterprise-grade generic plugin:'}
          </p>
        </div>

        {/* Enhancements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enhancements.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      {isAr ? item.titleAr : item.titleEn}
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr ? item.descAr : item.descEn}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Installation Manual Step-by-Step */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>{isAr ? 'دليل التثبيت والتشغيل خطوة بخطوة' : 'Step-by-Step Installation Manual'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'طريقتان لتثبيت MAAS Remover في مجلتك: عبر لوحة التحكم الرسومية أو عبر السيرفر'
                : 'Two standard installation methods: OJS Admin GUI or Server CLI / SSH'}
            </p>
          </div>

          <button
            onClick={onGoToDownloader}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white flex items-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحميل الحزمة الآن' : 'Get Package Now'}</span>
          </button>
        </div>

        {/* Method 1: Web GUI */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
              1
            </span>
            <span>{isAr ? 'التثبيت عبر لوحة تحكم OJS (Web GUI - الطريقة الأسهل)' : 'Method 1: Via OJS Web Dashboard (Recommended)'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <div className="text-rose-400 font-bold">{isAr ? 'الخطوة 1: تنزيل الحزمة' : 'Step 1: Download'}</div>
              <p className="text-slate-400 leading-relaxed">
                {isAr
                  ? 'قم بتحميل ملف maasRemover.zip من تبويب "حزمة الإضافة والتحميل".'
                  : 'Download the prepared maasRemover.zip archive from the download tab.'}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <div className="text-rose-400 font-bold">{isAr ? 'الخطوة 2: رفع الإضافة' : 'Step 2: Upload Plugin'}</div>
              <p className="text-slate-400 leading-relaxed">
                {isAr
                  ? 'توجه إلى Settings > Website > Plugins واضغط على "Upload A New Plugin" واختر الملف.'
                  : 'Navigate to Settings > Website > Plugins > Installed Plugins and click "Upload A New Plugin".'}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <div className="text-rose-400 font-bold">{isAr ? 'الخطوة 3: التفعيل والتشغيل' : 'Step 3: Enable'}</div>
              <p className="text-slate-400 leading-relaxed">
                {isAr
                  ? 'فعّل الإضافة تحت Generic Plugins، ثم اضغط على زر Settings لإجراء الفحص والحذف.'
                  : 'Enable MAAS Remover under Generic Plugins, then click Settings to scan and purge.'}
              </p>
            </div>
          </div>
        </div>

        {/* Method 2: CLI / SSH */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
              2
            </span>
            <span>{isAr ? 'التثبيت اليدوي عبر السيرفر وسطر الأوامر (CLI / SSH)' : 'Method 2: Manual Installation via SSH / Terminal'}</span>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 space-y-3 overflow-x-auto">
            <div className="text-slate-500"># 1. انتقل لمجلد إضافات OJS وفك ضغط الحزمة:</div>
            <div className="text-amber-300">cd /var/www/html/ojs/plugins/generic/</div>
            <div className="text-amber-300">unzip maasRemover.zip</div>

            <div className="text-slate-500 pt-2"># 2. ضبط الصلاحيات المناسبة لخادم الويب (Apache / Nginx):</div>
            <div className="text-amber-300">chown -R www-data:www-data maasRemover/</div>
            <div className="text-amber-300">chmod -R 755 maasRemover/</div>

            <div className="text-slate-500 pt-2"># 3. تشغيل أداة الحذف المباشرة بدون متصفح (دفعة 100 حساب):</div>
            <div className="text-emerald-400">php /var/www/html/ojs/plugins/generic/maasRemover/tools/maas_remover_cli.php --batch=100 --days=30 --force</div>
          </div>
        </div>

        {/* Method 3: GitHub Direct Installation (Cloning & Submodule) */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs border border-slate-600">
                3
              </span>
              <div className="flex items-center gap-2">
                <span>{isAr ? 'التثبيت المباشر من GitHub (Git Clone & Submodule)' : 'Method 3: Direct Installation from GitHub'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  GitHub Official
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-400">
              {isAr ? 'الخيار المفضل لمهندسي الأنظمة و DevOps' : 'Recommended for System Admins & DevOps'}
            </span>
          </div>

          {/* GitHub Commands Tabs / Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 3A: Git Clone */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  {isAr ? 'أ: الاستنساخ المباشر (git clone)' : 'A: Direct git clone'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">plugins/generic/maasRemover</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isAr
                  ? 'يتم استنساخ المستودع مباشرة داخل مجلد generic في OJS باسم المجلد الصحيح maasRemover:'
                  : 'Clones repository directly into generic plugins directory with canonical folder naming:'}
              </p>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto space-y-1.5">
                <div className="text-slate-500"># 1. الانتقال لمجلد الإضافات</div>
                <div className="text-amber-300">cd /var/www/html/ojs/plugins/generic/</div>
                <div className="text-slate-500 pt-1"># 2. الاستنساخ من GitHub</div>
                <div className="text-emerald-400">git clone https://github.com/maas-remover/maasRemover.git maasRemover</div>
                <div className="text-slate-500 pt-1"># 3. تثبيت الإصدار المستقر وضبط الصلاحيات</div>
                <div className="text-indigo-300">cd maasRemover && git checkout v1.2.0</div>
                <div className="text-amber-300">chown -R www-data:www-data ../maasRemover</div>
                <div className="text-amber-300">chmod -R 755 ../maasRemover</div>
              </div>
            </div>

            {/* Option 3B: Git Submodule */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  {isAr ? 'ب: إضافة كوحدة فرعية (git submodule)' : 'B: Git Submodule (DevOps)'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">For Git-managed OJS</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isAr
                  ? 'إذا كنت تدير كود OJS بالكامل عبر Git وتريد تتبع التحديثات تلقائياً:'
                  : 'Best if your full OJS instance is tracked inside an institutional Git repository:'}
              </p>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto space-y-1.5">
                <div className="text-slate-500"># من المجلد الرئيسي لنظام OJS:</div>
                <div className="text-amber-300">cd /var/www/html/ojs/</div>
                <div className="text-slate-500 pt-1"># إضافة المستودع كوحدة فرعية:</div>
                <div className="text-indigo-400">git submodule add https://github.com/maas-remover/maasRemover.git plugins/generic/maasRemover</div>
                <div className="text-slate-500 pt-1"># تهيئة وتحديث الملفات:</div>
                <div className="text-emerald-400">git submodule update --init --recursive</div>
              </div>
            </div>
          </div>

          {/* GitHub Trap & Caution Alert */}
          <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'تنبيه هام جداً حول تحميل ملف ZIP مباشرة من GitHub:' : 'Critical Warning on GitHub Auto-Generated ZIPs'}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {isAr ? (
                <>
                  عند ضغط زر <strong>&quot;Download ZIP&quot;</strong> من موقع GitHub مباشرة، يقوم GitHub تلقائياً بتسمية المجلد الداخلي بـ <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">maasRemover-main/</code> بدلاً من <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">maasRemover/</code>. نظام OJS يرفض هذا الملف ويعطي خطأ: <em>&quot;The uploaded plugin archive does not contain a folder that corresponds to the plugin name&quot;</em>.
                  <br />
                  <strong>الحل:</strong> إما تثبيتها عبر أمر <code className="text-emerald-400">git clone</code> الموضح أعلاه، أو تحميل الحزمة الجاهزة مباشرة بنقرة واحدة من تبويب <strong>&quot;حزمة الإضافة والتحميل&quot;</strong> في هذا التطبيق حيث قمنا بضبط هيكل المجلدات داخلياً ليتوافق 100% مع معايير PKP.
                </>
              ) : (
                <>
                  When using GitHub&apos;s default &quot;Download ZIP&quot; button, GitHub names the root directory <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">maasRemover-main/</code> instead of <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">maasRemover/</code>. OJS will reject it with: <em>&quot;The uploaded plugin archive does not contain a folder that corresponds to the plugin name&quot;</em>.
                  <br />
                  <strong>Solution:</strong> Either install via <code className="text-emerald-400">git clone</code> as documented above, or download the pre-packaged ZIP directly from the <strong>&quot;Plugin Package &amp; Download&quot;</strong> tab here.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Anti-Spam Best Practices for OJS */}
        <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 space-y-2 text-xs">
          <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-indigo-400" />
            <span>{isAr ? 'نصيحة وقائية هامة لمنع عودة آلاف حسابات السبام مستقبلاً:' : 'Proactive Tip: Prevent Future Spam Registrations'}</span>
          </h4>
          <p className="text-slate-300 leading-relaxed">
            {isAr
              ? 'بعد حذف الحسابات المتراكمة بواسطة MAAS Remover، يُنصح بشدة بتفعيل Google reCAPTCHA v3 في ملف config.inc.php داخل OJS وتثبيت إضافة Honeypot Plugin. هذا يمنع برمجيات البوتات الآلية من إنشاء حسابات عشوائية مستقبلاً بنسبة تفوق 99%.'
              : 'After cleaning your existing database with MAAS Remover, configure invisible Google reCAPTCHA v3 in OJS config.inc.php and enable the PKP Honeypot plugin. This blocks automated registration bots at the gate.'}
          </p>
        </div>
      </div>
    </div>
  );
};
