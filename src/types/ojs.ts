export interface OjsUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  dateRegistered: string;
  lastLogin: string | null;
  roles: string[];
  submissionCount: number;
  reviewCount: number;
  editorialAssignmentCount: number;
  isSiteAdmin: boolean;
  status: 'active' | 'orphan_inactive' | 'spam_bot' | 'author' | 'reviewer';
  riskScore: number; // 0 to 100
  notes?: string;
}

export interface PurgeCriteria {
  minAccountAgeDays: number;
  batchSize: number; // up to 100
  requireZeroSubmissions: boolean;
  requireZeroReviews: boolean;
  requireZeroEditorialAssignments: boolean;
  excludeSiteAdmins: boolean;
  excludeManagers: boolean;
  onlyNeverLoggedIn: boolean;
  dryRun: boolean;
}

export interface PurgeResult {
  purgedCount: number;
  purgedUsers: OjsUser[];
  affectedTables: {
    tableName: string;
    deletedRows: number;
    description: string;
  }[];
  executionTimeMs: number;
  timestamp: string;
  mode: 'dry-run' | 'permanent';
  transactionSuccess: boolean;
}

export type OjsVersion = '3.4+' | '3.3-lts' | 'universal';

export interface PluginFile {
  path: string;
  filename: string;
  description: string;
  descriptionAr: string;
  language: 'php' | 'xml' | 'smarty' | 'po' | 'markdown' | 'bash';
  code: string;
}
