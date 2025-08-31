export interface SecurityItem {
  id: string;
  category: string;
  name: string;
  criteria: string;
  standards: string;
  evidence_examples: string;
  risk: string;
  order: number;
}

export interface Model {
  id: string;
  name: string;
  vendor: string;
  notes?: string;
}

export interface Assessment {
  id: string;
  modelId: string;
  modelName?: string;
  createdAt: string;
  createdBy?: string;
  status: 'draft' | 'submitted' | 'in_progress' | 'completed' | 'failed';
  summary?: string;
  updatedAt?: string;
}

export interface Evidence {
  url: string;
  title: string;
  snippet: string;
  confidence?: number;
}

export interface AssessmentItem {
  id: string;
  assessmentId: string;
  itemId: string;
  judgement: '○' | '×' | '要改善' | null;
  comment: string;
  evidences: Evidence[];
  filledBy: string;
  updatedAt: string;
}

export interface AdminUser {
  username: string;
  passwordHash: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
}

export interface InvestigationRequest {
  modelName: string;
  vendor?: string;
}

// アセスメント進捗関連の型定義
export interface AssessmentStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  details?: string;
  timestamp?: string;
}

export interface AssessmentProgressData {
  modelName: string;
  totalItems: number;
  completedItems: number;
  currentItem?: {
    id: string;
    name: string;
    category: string;
  };
  steps: AssessmentStep[];
  overallStatus: 'preparing' | 'running' | 'completed' | 'error';
  estimatedTimeRemaining?: number;
}