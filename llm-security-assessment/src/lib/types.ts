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
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'submitted';
  summary: string;
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
  changes?: any;
}

export interface InvestigationRequest {
  modelName: string;
  vendor?: string;
}