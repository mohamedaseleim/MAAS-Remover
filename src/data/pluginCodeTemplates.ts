import { PluginFile, OjsVersion } from '../types/ojs';

export function getPluginFiles(version: OjsVersion = 'universal'): PluginFile[] {
  const isModern = version === '3.4+' || version === 'universal';

  const versionXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE version SYSTEM "../../../lib/pkp/dtd/pluginVersion.dtd">
<!--
  * plugins/generic/maasRemover/version.xml
  *
  * Copyright (c) 2026 MAAS Digital Solutions
  * Distributed under the GNU GPL v3.
  *
  * Plugin version information for MAAS Remover
  -->
<version>
  <application>maasRemover</application>
  <type>plugins.generic</type>
  <release>1.2.0.0</release>
  <date>2026-10-16</date>
  <lazy-load>1</lazy-load>
  <class>MaasRemoverPlugin</class>
</version>`;

  const indexPhp = `<?php
/**
 * @file plugins/generic/maasRemover/index.php
 *
 * Copyright (c) 2026 MAAS Digital Solutions
 * Distributed under the GNU GPL v3.
 *
 * @brief Wrapper for MAAS Remover generic plugin.
 */

require_once('MaasRemoverPlugin.php');
return new \\APP\\plugins\\generic\\maasRemover\\MaasRemoverPlugin();
`;

  const pluginPhp = `<?php
/**
 * @file plugins/generic/maasRemover/MaasRemoverPlugin.php
 *
 * Copyright (c) 2026 MAAS Digital Solutions
 * Distributed under the GNU GPL v3.
 *
 * @class MaasRemoverPlugin
 * @brief Plugin to safely identify and permanently delete inactive/spam accounts in bulk (up to 100 per batch).
 */

namespace APP\\plugins\\generic\\maasRemover;

use PKP\\plugins\\GenericPlugin;
use PKP\\plugins\\Hook;
use PKP\\core\\JSONMessage;
use PKP\\security\\Role;
use PKP\\linkAction\\LinkAction;
use PKP\\linkAction\\request\\AjaxModal;
use APP\\core\\Application;

class MaasRemoverPlugin extends GenericPlugin {
    /**
     * @copydoc Plugin::register
     */
    public function register($category, $path, $mainContextId = null) {
        $success = parent::register($category, $path, $mainContextId);
        if ($success && $this->getEnabled($mainContextId)) {
            // Register route handler for admin UI
            Hook::add('LoadHandler', [$this, 'setupCallbackHandler']);
        }
        return $success;
    }

    /**
     * Get the display name of this plugin
     */
    public function getDisplayName() {
        return __('plugins.generic.maasRemover.displayName');
    }

    /**
     * Get the description of this plugin
     */
    public function getDescription() {
        return __('plugins.generic.maasRemover.description');
    }

    /**
     * Add settings link action in OJS Plugin Gallery
     */
    public function getActions($request, $actionArgs) {
        $actions = parent::getActions($request, $actionArgs);
        if (!$this->getEnabled()) {
            return $actions;
        }

        $router = $request->getRouter();
        import('lib.pkp.classes.linkAction.request.RedirectAction');
        
        $settingsAction = new LinkAction(
            'maasRemoverSettings',
            new RedirectAction($router->url($request, null, 'maasRemover', 'index')),
            __('plugins.generic.maasRemover.manageTitle'),
            'modal_settings'
        );
        array_unshift($actions, $settingsAction);
        return $actions;
    }

    /**
     * Route handler for /index.php/{journal}/maasRemover
     */
    public function setupCallbackHandler($hookName, $args) {
        $page = $args[0];
        if ($page === 'maasRemover') {
            define('HANDLER_CLASS', 'APP\\plugins\\generic\\maasRemover\\MaasRemoverHandler');
            $this->import('MaasRemoverHandler');
            return true;
        }
        return false;
    }
}
`;

  const servicePhp = `<?php
/**
 * @file plugins/generic/maasRemover/classes/MaasRemoverService.php
 *
 * Copyright (c) 2026 MAAS Digital Solutions
 * Distributed under the GNU GPL v3.
 *
 * @class MaasRemoverService
 * @brief High-security database engine for bulk zero-activity user account purges with transactional integrity.
 */

namespace APP\\plugins\\generic\\maasRemover\\classes;

use Illuminate\\Support\\Facades\\DB;
use PKP\\db\\DAORegistry;

class MaasRemoverService {

    /**
     * Find inactive orphan user IDs matching strict zero-activity criteria.
     *
     * @param int $batchLimit Maximum number of accounts to target (Max: 100)
     * @param int $minAgeDays Accounts must be older than X days (default: 30)
     * @param bool $neverLoggedIn If true, only target users who never logged in
     * @return array Array of user records with details
     */
    public static function findInactiveUsers(int $batchLimit = 100, int $minAgeDays = 30, bool $neverLoggedIn = false): array {
        $batchLimit = min(max(1, $batchLimit), 100); // enforce hard upper ceiling of 100
        $cutoffDate = date('Y-m-d H:i:s', strtotime("-{$minAgeDays} days"));

        // Query builder to detect truly orphaned users with ZERO activity
        $query = DB::table('users as u')
            ->select('u.user_id', 'u.username', 'u.email', 'u.date_registered', 'u.date_last_login')
            ->where('u.date_registered', '<=', $cutoffDate)
            
            // 1. NEVER target Site Administrators
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('site')
                  ->whereRaw('site.site_admin_user_id = u.user_id');
            })
            // 2. NEVER target Journal Managers / Editors with roles
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('user_user_groups as uug')
                  ->join('user_groups as ug', 'ug.user_group_id', '=', 'uug.user_group_id')
                  ->whereRaw('uug.user_id = u.user_id')
                  ->whereIn('ug.role_id', [1, 16, 17]); // Admin, Manager, Section Editor
            })
            // 3. ZERO Submissions (not as author, submitter, or contributor)
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('authors as a')
                  ->whereRaw('a.user_group_id IS NOT NULL AND a.email = u.email');
            })
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('submissions as s')
                  ->whereRaw('s.user_id = u.user_id');
            })
            // 4. ZERO Peer Review assignments
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('review_assignments as ra')
                  ->whereRaw('ra.reviewer_id = u.user_id');
            })
            // 5. ZERO Editorial Stage assignments
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('stage_assignments as sa')
                  ->whereRaw('sa.user_id = u.user_id');
            })
            // 6. ZERO Editorial Event Logs
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('event_log as el')
                  ->whereRaw('el.user_id = u.user_id');
            });

        if ($neverLoggedIn) {
            $query->whereNull('u.date_last_login');
        }

        return $query->limit($batchLimit)->get()->toArray();
    }

    /**
     * Permanently delete a list of user IDs with complete cascading cleanup.
     * All operations execute inside an atomic database transaction.
     *
     * @param array $userIds Array of user IDs to purge (up to 100)
     * @param bool $dryRun If true, calculates affected rows without executing DELETE
     * @return array Execution statistics and table breakdowns
     */
    public static function purgeUsers(array $userIds, bool $dryRun = false): array {
        if (empty($userIds)) {
            return ['status' => 'empty', 'deletedUsers' => 0, 'tables' => []];
        }

        // Hard cap at 100 IDs for transaction safety and lock prevention
        $userIds = array_slice($userIds, 0, 100);

        // Target tables in strict foreign-key cascade order
        $tablesToClean = [
            'user_settings'                     => 'user_id',
            'user_user_groups'                  => 'user_id',
            'user_interests'                    => 'user_id',
            'email_log_users'                   => 'user_id',
            'notes'                             => 'user_id',
            'temporary_files'                   => 'user_id',
            'sessions'                          => 'user_id',
            'notification_subscription_settings'=> 'user_id',
            'access_keys'                       => 'user_id',
            'subeditor_submission_group'        => 'user_id',
            'users'                             => 'user_id' // Must be deleted LAST
        ];

        $report = [];
        $totalRows = 0;

        if ($dryRun) {
            foreach ($tablesToClean as $table => $foreignKey) {
                $count = DB::table($table)->whereIn($foreignKey, $userIds)->count();
                $report[$table] = $count;
                $totalRows += $count;
            }
            return [
                'mode' => 'dry-run',
                'usersTargeted' => count($userIds),
                'totalRowsProjected' => $totalRows,
                'tableBreakdown' => $report
            ];
        }

        // Execute permanent purge inside DB transaction
        DB::beginTransaction();
        try {
            foreach ($tablesToClean as $table => $foreignKey) {
                $affected = DB::table($table)->whereIn($foreignKey, $userIds)->delete();
                $report[$table] = $affected;
                $totalRows += $affected;
            }

            DB::commit();

            return [
                'mode' => 'permanent',
                'success' => true,
                'usersPurged' => count($userIds),
                'totalRowsDeleted' => $totalRows,
                'tableBreakdown' => $report,
                'purgedUserIds' => $userIds,
                'timestamp' => date('Y-m-d H:i:s')
            ];
        } catch (\\Exception $e) {
            DB::rollBack();
            throw new \\Exception('MAAS Remover Transaction Failed: ' . $e->getMessage());
        }
    }
}
`;

  const handlerPhp = `<?php
/**
 * @file plugins/generic/maasRemover/MaasRemoverHandler.php
 *
 * Copyright (c) 2026 MAAS Digital Solutions
 * Distributed under the GNU GPL v3.
 *
 * @class MaasRemoverHandler
 * @brief Admin Controller handling UI rendering, dry-run scans, and bulk batch purges.
 */

namespace APP\\plugins\\generic\\maasRemover;

use PKP\\handler\\Handler;
use PKP\\security\\authorization\\PolicySet;
use PKP\\security\\authorization\\RoleBasedHandlerOperationPolicy;
use PKP\\security\\Role;
use PKP\\core\\JSONMessage;
use APP\\plugins\\generic\\maasRemover\\classes\\MaasRemoverService;

class MaasRemoverHandler extends Handler {

    public function authorize($request, &$args, $roleAssignments) {
        // Enforce strict access: Site Administrator or Journal Manager only
        $this->addPolicy(new RoleBasedHandlerOperationPolicy(
            $request,
            [Role::ROLE_ID_SITE_ADMIN, Role::ROLE_ID_MANAGER],
            ['index', 'scan', 'purge', 'exportAudit']
        ));
        return parent::authorize($request, $args, $roleAssignments);
    }

    /**
     * Render the MAAS Remover dashboard
     */
    public function index($args, $request) {
        $templateMgr = \\PKP\\template\\TemplateManager::getManager($request);
        $plugin = \\PKP\\plugins\\PluginRegistry::getPlugin('generic', 'maasRemover');
        
        $templateMgr->assign([
            'pluginUrl' => $request->getDispatcher()->url($request, \\PKP\\core\\PKPApplication::ROUTE_PAGE, null, 'maasRemover'),
            'pluginVersion' => '1.2.0.0',
            'maxBatchSize' => 100
        ]);

        return $templateMgr->display($plugin->getTemplateResource('settings.tpl'));
    }

    /**
     * AJAX endpoint: Scan database for inactive accounts
     */
    public function scan($args, $request) {
        $batch = min(100, (int)$request->getUserVar('batch') ?: 100);
        $days = (int)$request->getUserVar('days') ?: 30;
        $neverLoggedIn = (bool)$request->getUserVar('neverLoggedIn');

        $users = MaasRemoverService::findInactiveUsers($batch, $days, $neverLoggedIn);
        return new JSONMessage(true, [
            'count' => count($users),
            'users' => $users
        ]);
    }

    /**
     * AJAX endpoint: Execute bulk purge or dry-run
     */
    public function purge($args, $request) {
        if (!$request->checkCSRF()) {
            return new JSONMessage(false, __('form.csrfInvalid'));
        }

        $userIds = (array)$request->getUserVar('userIds');
        $isDryRun = (bool)$request->getUserVar('dryRun');

        if (empty($userIds)) {
            return new JSONMessage(false, 'No user IDs provided for purge operation.');
        }

        try {
            $result = MaasRemoverService::purgeUsers($userIds, $isDryRun);
            return new JSONMessage(true, $result);
        } catch (\\Exception $e) {
            return new JSONMessage(false, $e->getMessage());
        }
    }
}
`;

  const cliPhp = `<?php
/**
 * @file plugins/generic/maasRemover/tools/maas_remover_cli.php
 *
 * Copyright (c) 2026 MAAS Digital Solutions
 * Distributed under the GNU GPL v3.
 *
 * @brief High-performance Command-line interface for MAAS Remover.
 * Ideal for purging tens of thousands of spam accounts without web server timeouts.
 *
 * Usage:
 *   php tools/maas_remover_cli.php --batch=100 --days=60 --dry-run
 *   php tools/maas_remover_cli.php --batch=100 --days=60 --force
 */

require_once(dirname(__FILE__) . '/../../../../tools/bootstrap.php');

use APP\\plugins\\generic\\maasRemover\\classes\\MaasRemoverService;

class MaasRemoverCLI extends \\PKP\\cliTool\\CommandLineTool {
    protected int $batch = 100;
    protected int $days = 30;
    protected bool $dryRun = true;
    protected bool $neverLoggedIn = false;

    public function __construct($argv = []) {
        parent::__construct($argv);
        foreach ($argv as $arg) {
            if (strpos($arg, '--batch=') === 0) {
                $this->batch = min(100, max(1, (int)substr($arg, 8)));
            } elseif (strpos($arg, '--days=') === 0) {
                $this->days = max(1, (int)substr($arg, 7));
            } elseif ($arg === '--force') {
                $this->dryRun = false;
            } elseif ($arg === '--never-logged-in') {
                $this->neverLoggedIn = true;
            }
        }
    }

    public function usage() {
        echo "MAAS Remover CLI - Bulk Inactive User Purge\\n";
        echo "Usage: php {$this->scriptName} [options]\\n";
        echo "Options:\\n";
        echo "  --batch=100          Number of users per run (Max: 100)\\n";
        echo "  --days=30            Minimum account age in days (Default: 30)\\n";
        echo "  --never-logged-in    Only target accounts with zero logins\\n";
        echo "  --force              Execute permanent deletion (Default is dry-run)\\n\\n";
    }

    public function execute() {
        echo "====================================================\\n";
        echo "  MAAS Remover CLI: Database Sanitation Engine\\n";
        echo "====================================================\\n";
        echo "Batch Size: {$this->batch} | Min Age: {$this->days} days | Mode: " . ($this->dryRun ? "DRY-RUN (Safe Preview)" : "PERMANENT DELETE") . "\\n\\n";

        $users = MaasRemoverService::findInactiveUsers($this->batch, $this->days, $this->neverLoggedIn);
        $count = count($users);
        echo "Found {$count} candidate orphan accounts.\\n";

        if ($count === 0) {
            echo "Database is clean! No orphan accounts found.\\n";
            exit(0);
        }

        $userIds = array_map(fn($u) => $u->user_id, $users);

        $result = MaasRemoverService::purgeUsers($userIds, $this->dryRun);

        if ($this->dryRun) {
            echo "\\n[DRY RUN PREVIEW] Projected deleted rows:\\n";
            foreach ($result['tableBreakdown'] as $table => $rows) {
                echo "  - Table {$table}: {$rows} rows\\n";
            }
            echo "\\nTo permanently delete, re-run with --force\\n";
        } else {
            echo "\\n[SUCCESS] Successfully purged {$result['usersPurged']} users from OJS database!\\n";
            echo "Total records cleaned across all tables: {$result['totalRowsDeleted']}\\n";
        }
    }
}

$tool = new MaasRemoverCLI($argv ?? []);
$tool->execute();
`;

  const templateTpl = `{**
 * plugins/generic/maasRemover/templates/settings.tpl
 *
 * Copyright (c) 2026 MAAS Digital Solutions
 * Distributed under the GNU GPL v3.
 *
 * Modern management interface for MAAS Remover in OJS
 *}
<div class="pkp_page_content pkp_page_maas_remover">
    <div class="maas-header">
        <h2>{translate key="plugins.generic.maasRemover.displayName"}</h2>
        <p class="description">{translate key="plugins.generic.maasRemover.longDescription"}</p>
    </div>

    <div class="maas-filter-panel">
        <form id="maasRemoverForm">
            <div class="filter-group">
                <label for="batchSize">{translate key="plugins.generic.maasRemover.batchSize"}</label>
                <input type="number" id="batchSize" name="batchSize" value="100" min="1" max="100" class="pkp_form_control" />
                <small>{translate key="plugins.generic.maasRemover.batchNotice"}</small>
            </div>

            <div class="filter-group">
                <label for="minAgeDays">{translate key="plugins.generic.maasRemover.minAgeDays"}</label>
                <input type="number" id="minAgeDays" name="minAgeDays" value="30" min="7" class="pkp_form_control" />
            </div>

            <div class="filter-checkbox">
                <label>
                    <input type="checkbox" id="neverLoggedIn" name="neverLoggedIn" />
                    {translate key="plugins.generic.maasRemover.onlyNeverLoggedIn"}
                </label>
            </div>

            <div class="action-buttons">
                <button type="button" id="btnScan" class="pkp_button pkp_button_primary">
                    {translate key="plugins.generic.maasRemover.btnScan"}
                </button>
                <button type="button" id="btnDryRun" class="pkp_button">
                    {translate key="plugins.generic.maasRemover.btnDryRun"}
                </button>
                <button type="button" id="btnPurge" class="pkp_button pkp_button_danger" style="display:none;">
                    {translate key="plugins.generic.maasRemover.btnExecutePurge"}
                </button>
            </div>
        </form>
    </div>

    <!-- Candidate Users Table -->
    <div id="maasResultsContainer" style="display:none; margin-top: 20px;">
        <h3>{translate key="plugins.generic.maasRemover.foundAccounts"} (<span id="userCount">0</span>)</h3>
        <table class="pkp_table" id="usersTable">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Date Registered</th>
                    <th>Last Login</th>
                </tr>
            </thead>
            <tbody id="usersTbody"></tbody>
        </table>
    </div>
</div>
`;

  const localeEn = `msgid ""
msgstr ""
"Project-Id-Version: MAAS Remover 1.2.0\\n"
"Report-Msgid-Bugs-To: \\n"
"POT-Creation-Date: 2026-10-16 00:00+0000\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Language: en_US\\n"

msgid "plugins.generic.maasRemover.displayName"
msgstr "MAAS Remover - Inactive User Purge Engine"

msgid "plugins.generic.maasRemover.description"
msgstr "Safely detects and permanently wipes inactive, orphaned, and spam accounts with zero submissions, reviews, or editorial activity (batches up to 100)."

msgid "plugins.generic.maasRemover.longDescription"
msgstr "This utility scans your OJS database for orphan accounts that have zero submissions, zero peer review assignments, zero editorial assignments, and zero event logs, completely deleting them and their related table records."

msgid "plugins.generic.maasRemover.manageTitle"
msgstr "Manage MAAS Remover"

msgid "plugins.generic.maasRemover.batchSize"
msgstr "Batch Size (Max 100 accounts per run)"

msgid "plugins.generic.maasRemover.batchNotice"
msgstr "Capped at 100 to prevent database table locks and PHP execution timeout."

msgid "plugins.generic.maasRemover.minAgeDays"
msgstr "Minimum Account Age (Days)"

msgid "plugins.generic.maasRemover.onlyNeverLoggedIn"
msgstr "Target only users who never logged in after registration"

msgid "plugins.generic.maasRemover.btnScan"
msgstr "Scan Inactive Accounts"

msgid "plugins.generic.maasRemover.btnDryRun"
msgstr "Safe Dry-Run Preview"

msgid "plugins.generic.maasRemover.btnExecutePurge"
msgstr "Execute Permanent Purge (Irreversible)"

msgid "plugins.generic.maasRemover.foundAccounts"
msgstr "Detected Inactive Accounts"
`;

  const localeAr = `msgid ""
msgstr ""
"Project-Id-Version: MAAS Remover 1.2.0\\n"
"Report-Msgid-Bugs-To: \\n"
"POT-Creation-Date: 2026-10-16 00:00+0000\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Language: ar_IQ\\n"

msgid "plugins.generic.maasRemover.displayName"
msgstr "MAAS Remover - أداة الحذف الشامل للحسابات الخاملة"

msgid "plugins.generic.maasRemover.description"
msgstr "أداة ذكية لفحص وحذف حسابات المستخدمين غير المرتبطة بأي نشاط أو مقالات أو تحكيم بشكل نهائي وشامل من قاعدة البيانات دفعة واحدة (حتى 100 حساب)."

msgid "plugins.generic.maasRemover.longDescription"
msgstr "تقوم هذه الإضافة بفحص شامل لقاعدة بيانات OJS وحصر حسابات السبام والحسابات المهجورة التي لا تمتلك أي أبحاث منشورة، أو مهام تحكيم، أو تكليفات تحريرية، وتقوم بإزالتها جذرياً من كافة الجداول المترابطة مع الحفاظ التام على سلامة النظام."

msgid "plugins.generic.maasRemover.manageTitle"
msgstr "إدارة أداة MAAS Remover"

msgid "plugins.generic.maasRemover.batchSize"
msgstr "حجم الدفعة (بحد أقصى 100 حساب في المرة)"

msgid "plugins.generic.maasRemover.batchNotice"
msgstr "تم تحديد الحد بـ 100 حساب لحماية قاعدة البيانات من التعليق وتجنب انتهاء مهلة تنفيذ سكريبت PHP."

msgid "plugins.generic.maasRemover.minAgeDays"
msgstr "الحد الأدنى لعمر الحساب منذ التسجيل (بالأيام)"

msgid "plugins.generic.maasRemover.onlyNeverLoggedIn"
msgstr "استهداف فقط الحسابات التي لم تسجل الدخول مطلقاً بعد إنشائها"

msgid "plugins.generic.maasRemover.btnScan"
msgstr "فحص الحسابات الخاملة"

msgid "plugins.generic.maasRemover.btnDryRun"
msgstr "معاينة تجريبية آمنة (Dry Run)"

msgid "plugins.generic.maasRemover.btnExecutePurge"
msgstr "تنفيذ الحذف النهائي والكامل (لا رجعة فيه)"

msgid "plugins.generic.maasRemover.foundAccounts"
msgstr "الحسابات المكتشفة القابلة للحذف"
`;

  const readmeMd = `# MAAS Remover Plugin for Open Journal Systems (OJS)
**Version:** 1.2.0.0
**Author:** MAAS Digital Solutions
**Target Compatibility:** OJS 3.3.x LTS, OJS 3.4.x, OJS 3.5.x

---

## 🌟 نظرة عامة / Overview
**MAAS Remover** هي إضافة مخصصة لأنظمة المجلات المفتوحة (Open Journal Systems) تقوم برصد وحذف حسابات المستخدمين الخاملة وحسابات السبام غير المرتبطة بأي نشاط أكاديمي أو تحريري داخل المجلة نهائياً وكاملاً من قاعدة البيانات.

### 🛡️ معايير الأمان الصارمة (Zero-Activity Integrity):
لا يتم حذف أي مستخدم إذا كان:
1. مدير نظام (Site Administrator) أو مدير مجلة (Journal Manager).
2. مؤلف أو مشارك في أي مقال تم إرساله أو نشره (\`submissions\`, \`authors\`).
3. محكم تم تكليفه بأي عملية مراجعة أقران (\`review_assignments\`).
4. محرر تم تكليفه بمراحل العمل التحريري (\`stage_assignments\`).
5. مسجل ضمن سجلات الأحداث التحريرية (\`event_log\`).
6. مسجل حديثاً (يتم حماية الحسابات الجديدة بفترة أمان قابلة للتخصيص، افتراضياً 30 يوماً).

### ⚡ الجداول التي يتم تنظيفها جذرياً (Cascading Cleanup):
\`\`\`text
- user_settings (البيانات التعريفية واللغات)
- user_user_groups (الأدوار والصلاحيات)
- user_interests (الاهتمامات البحثية)
- email_log_users (سجلات المراسلات)
- notes (الملاحظات)
- temporary_files (الملفات المؤقتة)
- sessions (الجلسات المفتوحة)
- notification_subscription_settings (إعدادات الإشعارات)
- access_keys (مفاتيح الوصول)
- subeditor_submission_group
- users (السجل الأساسي في جدول المستخدمين)
\`\`\`

---

## 🚀 التثبيت / Installation

### الطريقة الأولى: من لوحة تحكم OJS (GUI Upload)
1. قم بضغط مجلد الإضافة باسم \`maasRemover.tar.gz\` أو قم بتحميل الحزمة المجهزة مباشرة من التطبيق.
2. توجه في OJS إلى: **Settings > Website > Plugins > Installed Plugins**.
3. اضغط على زر **Upload A New Plugin**.
4. اختر الملف واضغط **Save**.
5. قم بتفعيل الإضافة من قائمة **Generic Plugins** بالتعليم على مربع التفعيل بجانب **MAAS Remover**.

### الطريقة الثانية: التثبيت المباشر عبر GitHub (Git Clone)
من خلال سطر الأوامر (SSH) في السيرفر:
\`\`\`bash
# 1. الانتقال إلى مجلد إضافات OJS العامة
cd /var/www/html/ojs/plugins/generic/

# 2. استنساخ المستودع باسم المجلد maasRemover
git clone https://github.com/maas-remover/maasRemover.git maasRemover

# 3. تثبيت الإصدار المستقر وضبط الصلاحيات
cd maasRemover
git checkout v1.2.0
chown -R www-data:www-data ../maasRemover
chmod -R 755 ../maasRemover
\`\`\`

### الطريقة الثالثة: إضافة كوحدة فرعية عبر Git Submodule (DevOps)
\`\`\`bash
cd /var/www/html/ojs/
git submodule add https://github.com/maas-remover/maasRemover.git plugins/generic/maasRemover
git submodule update --init --recursive
\`\`\`

> ⚠️ **ملاحظة هامة لمستخدمي GitHub:**
> عند تحميل ملف ZIP من زر "Download ZIP" في GitHub، سيقوم بتسمية المجلد الداخلي بـ \`maasRemover-main\` وهذا يسبب رفض OJS له. يرجى استخدام \`git clone\` أعلاه أو تحميل الحزمة الجاهزة مباشرة.

---

## 💻 التشغيل عبر سطر الأوامر (CLI Mode)
للأعداد الضخمة (عشرات الآلاف من حسابات السبام):
\`\`\`bash
# معاينة تجريبية آمنة لحذف دفعة من 100 حساب
php plugins/generic/maasRemover/tools/maas_remover_cli.php --batch=100 --days=30

# التنفيذ الفعلي للحذف النهائي
php plugins/generic/maasRemover/tools/maas_remover_cli.php --batch=100 --days=30 --force
\`\`\`
`;

  return [
    {
      path: 'maasRemover/version.xml',
      filename: 'version.xml',
      description: 'PKP XML plugin declaration descriptor',
      descriptionAr: 'ملف تعريف الإضافة لمعايير PKP OJS',
      language: 'xml',
      code: versionXml
    },
    {
      path: 'maasRemover/index.php',
      filename: 'index.php',
      description: 'Plugin bootstrapper',
      descriptionAr: 'ملف تمهيد وتشغيل الإضافة',
      language: 'php',
      code: indexPhp
    },
    {
      path: 'maasRemover/MaasRemoverPlugin.php',
      filename: 'MaasRemoverPlugin.php',
      description: 'Main GenericPlugin hook registrar and menu link provider',
      descriptionAr: 'الفئة الرئيسية للإضافة وربط الخطافات (Hooks)',
      language: 'php',
      code: pluginPhp
    },
    {
      path: 'maasRemover/classes/MaasRemoverService.php',
      filename: 'MaasRemoverService.php',
      description: 'Core database cleaner service with transaction safety and cascading deletes',
      descriptionAr: 'محرك التنظيف وقواعد البيانات مع المعاملات المتسلسلة الآمنة',
      language: 'php',
      code: servicePhp
    },
    {
      path: 'maasRemover/MaasRemoverHandler.php',
      filename: 'MaasRemoverHandler.php',
      description: 'Web administration controller and CSRF-protected AJAX API endpoints',
      descriptionAr: 'المتحكم الإداري ونقاط نهاية AJAX المحمية برمز CSRF',
      language: 'php',
      code: handlerPhp
    },
    {
      path: 'maasRemover/tools/maas_remover_cli.php',
      filename: 'maas_remover_cli.php',
      description: 'Command line execution tool for large volume cleanup without timeouts',
      descriptionAr: 'أداة سطر الأوامر لتنظيف الأعداد الكبيرة دون انقطاع الاتصال',
      language: 'php',
      code: cliPhp
    },
    {
      path: 'maasRemover/templates/settings.tpl',
      filename: 'settings.tpl',
      description: 'Smarty template for OJS administrative dashboard',
      descriptionAr: 'قالب Smarty لواجهة لوحة التحكم داخل OJS',
      language: 'smarty',
      code: templateTpl
    },
    {
      path: 'maasRemover/locale/en_US/locale.po',
      filename: 'locale.po (en_US)',
      description: 'English internationalization strings',
      descriptionAr: 'ملف الترجمة والنصوص باللغة الإنجليزية',
      language: 'po',
      code: localeEn
    },
    {
      path: 'maasRemover/locale/ar_IQ/locale.po',
      filename: 'locale.po (ar_IQ)',
      description: 'Arabic localization strings',
      descriptionAr: 'ملف الترجمة والتعريب الكامل باللغة العربية',
      language: 'po',
      code: localeAr
    },
    {
      path: 'maasRemover/README.md',
      filename: 'README.md',
      description: 'Complete documentation and installation manual',
      descriptionAr: 'دليل التثبيت والتوثيق الفني للمشرفين',
      language: 'markdown',
      code: readmeMd
    }
  ];
}
