import { Redis } from '@upstash/redis';
import { ulid } from 'ulid';
import type { 
  SecurityItem, 
  Model, 
  Assessment, 
  AssessmentItem, 
  AdminUser, 
  AuditLog,
  AssessmentProgressData 
} from '@/lib/types';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class RedisService {
  // ===== セキュリティ項目管理 =====
  static async getSecurityItem(id: string): Promise<SecurityItem | null> {
    const item = await redis.hget('security_items', id);
    return item as SecurityItem | null;
  }

  static async getAllSecurityItems(): Promise<SecurityItem[]> {
    const items = await redis.hgetall('security_items');
    if (!items || Object.keys(items).length === 0) return [];
    
    return Object.values(items)
      .map(item => typeof item === 'string' ? JSON.parse(item) : item)
      .filter((item): item is SecurityItem => item !== null)
      .sort((a, b) => a.order - b.order);
  }

  static async createSecurityItem(item: Omit<SecurityItem, 'id'>): Promise<SecurityItem> {
    const id = ulid();
    const newItem = { ...item, id };
    await redis.hset('security_items', { [id]: JSON.stringify(newItem) });
    return newItem;
  }

  static async updateSecurityItem(id: string, item: Partial<SecurityItem>): Promise<SecurityItem | null> {
    const existing = await this.getSecurityItem(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...item, id };
    await redis.hset('security_items', { [id]: JSON.stringify(updated) });
    return updated;
  }

  static async deleteSecurityItem(id: string): Promise<boolean> {
    const result = await redis.hdel('security_items', id);
    return result === 1;
  }

  // ===== モデル管理 =====
  static async getModel(id: string): Promise<Model | null> {
    const model = await redis.hget('models', id);
    return model ? (typeof model === 'string' ? JSON.parse(model) : model) as Model : null;
  }

  static async getAllModels(): Promise<Model[]> {
    const models = await redis.hgetall('models');
    if (!models || Object.keys(models).length === 0) return [];
    
    return Object.values(models)
      .map(model => typeof model === 'string' ? JSON.parse(model) : model)
      .filter((model): model is Model => model !== null);
  }

  static async createModel(model: Omit<Model, 'id'>): Promise<Model> {
    const id = ulid();
    const newModel = { ...model, id };
    await redis.hset('models', { [id]: JSON.stringify(newModel) });
    return newModel;
  }

  static async updateModel(id: string, model: Partial<Model>): Promise<Model | null> {
    const existing = await this.getModel(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...model, id };
    await redis.hset('models', { [id]: JSON.stringify(updated) });
    return updated;
  }

  static async deleteModel(id: string): Promise<boolean> {
    const result = await redis.hdel('models', id);
    return result === 1;
  }

  // ===== アセスメント管理 =====
  static async getAssessment(id: string): Promise<Assessment | null> {
    const assessment = await redis.hget('assessments', id);
    return assessment ? (typeof assessment === 'string' ? JSON.parse(assessment) : assessment) as Assessment : null;
  }

  static async getAllAssessments(): Promise<Assessment[]> {
    const assessments = await redis.hgetall('assessments');
    if (!assessments || Object.keys(assessments).length === 0) return [];
    
    return Object.values(assessments)
      .map(assessment => typeof assessment === 'string' ? JSON.parse(assessment) : assessment)
      .filter((assessment): assessment is Assessment => assessment !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async createAssessment(assessment: Omit<Assessment, 'id'>): Promise<Assessment> {
    const id = ulid();
    const newAssessment = { ...assessment, id };
    await redis.hset('assessments', { [id]: JSON.stringify(newAssessment) });
    
    // モデルIDでのインデックスも作成（効率的な検索のため）
    await redis.sadd(`model_assessments:${assessment.modelId}`, id);
    
    return newAssessment;
  }

  static async updateAssessment(id: string, assessment: Partial<Assessment>): Promise<Assessment | null> {
    const existing = await this.getAssessment(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...assessment, id };
    await redis.hset('assessments', { [id]: JSON.stringify(updated) });
    return updated;
  }

  static async deleteAssessment(id: string): Promise<boolean> {
    const assessment = await this.getAssessment(id);
    if (!assessment) return false;
    
    // メインハッシュから削除
    const result = await redis.hdel('assessments', id);
    
    // インデックスからも削除
    await redis.srem(`model_assessments:${assessment.modelId}`, id);
    
    return result === 1;
  }

  static async getAssessmentsByModelId(modelId: string): Promise<Assessment[]> {
    const assessmentIds = await redis.smembers(`model_assessments:${modelId}`) as string[];
    if (assessmentIds.length === 0) return [];
    
    const assessments = await Promise.all(
      assessmentIds.map(id => this.getAssessment(id))
    );
    
    return assessments
      .filter((assessment): assessment is Assessment => assessment !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ===== アセスメントアイテム管理 =====
  static async getAssessmentItem(id: string): Promise<AssessmentItem | null> {
    const item = await redis.hget('assessment_items', id);
    return item ? (typeof item === 'string' ? JSON.parse(item) : item) as AssessmentItem : null;
  }

  static async getAssessmentItems(assessmentId: string): Promise<AssessmentItem[]> {
    const itemIds = await redis.smembers(`assessment_items_by_assessment:${assessmentId}`) as string[];
    if (itemIds.length === 0) return [];
    
    const items = await Promise.all(
      itemIds.map(id => this.getAssessmentItem(id))
    );
    
    return items.filter((item): item is AssessmentItem => item !== null);
  }

  static async createAssessmentItem(item: Omit<AssessmentItem, 'id'>): Promise<AssessmentItem> {
    const id = ulid();
    const newItem = { ...item, id };
    await redis.hset('assessment_items', { [id]: JSON.stringify(newItem) });
    
    // アセスメントIDによるインデックスのみ作成（itemIdによるインデックスは不要）
    await redis.sadd(`assessment_items_by_assessment:${item.assessmentId}`, id);
    
    return newItem;
  }

  static async updateAssessmentItem(id: string, updates: Partial<AssessmentItem>): Promise<AssessmentItem | null> {
    const existing = await this.getAssessmentItem(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await redis.hset('assessment_items', { [id]: JSON.stringify(updated) });
    return updated;
  }

  static async deleteAssessmentItem(id: string): Promise<boolean> {
    const item = await this.getAssessmentItem(id);
    if (!item) return false;
    
    // メインハッシュから削除
    const result = await redis.hdel('assessment_items', id);
    
    // インデックスからも削除（itemIdによるインデックスは不要）
    await redis.srem(`assessment_items_by_assessment:${item.assessmentId}`, id);
    
    return result === 1;
  }

  // ===== 管理者ユーザー管理 =====
  static async getAdminUser(username: string): Promise<AdminUser | null> {
    const user = await redis.hget('admin_users', username);
    return user ? (typeof user === 'string' ? JSON.parse(user) : user) as AdminUser : null;
  }

  static async createAdminUser(user: AdminUser): Promise<void> {
    await redis.hset('admin_users', { [user.username]: JSON.stringify(user) });
  }

  static async getAllAdminUsers(): Promise<AdminUser[]> {
    const users = await redis.hgetall('admin_users');
    if (!users || Object.keys(users).length === 0) return [];
    
    return Object.values(users)
      .map(user => typeof user === 'string' ? JSON.parse(user) : user)
      .filter((user): user is AdminUser => user !== null);
  }

  static async deleteAdminUser(username: string): Promise<boolean> {
    const result = await redis.hdel('admin_users', username);
    return result === 1;
  }

  // ===== 監査ログ管理 =====
  static async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const id = ulid();
    const timestamp = new Date().toISOString();
    const newLog = {
      ...log,
      id,
      timestamp,
    };
    
    // ハッシュに保存
    await redis.hset('audit_logs', { [id]: JSON.stringify(newLog) });
    
    // 時系列検索用のソートセット（スコアはタイムスタンプ）
    await redis.zadd('audit_logs_timeline', { score: Date.now(), member: id });
    
    return newLog;
  }

  static async getAuditLogs(limit = 100, offset = 0): Promise<AuditLog[]> {
    // 最新の監査ログIDを取得（逆順）
    const logIds = await redis.zrange('audit_logs_timeline', offset, offset + limit - 1, { rev: true }) as string[];
    if (logIds.length === 0) return [];
    
    const logs = await Promise.all(
      logIds.map(id => this.getAuditLog(id))
    );
    
    return logs.filter((log): log is AuditLog => log !== null);
  }

  static async getAuditLog(id: string): Promise<AuditLog | null> {
    const log = await redis.hget('audit_logs', id);
    return log ? (typeof log === 'string' ? JSON.parse(log) : log) as AuditLog : null;
  }

  // ===== アセスメント進捗管理 =====
  static async setAssessmentProgress(assessmentId: string, progressData: AssessmentProgressData): Promise<void> {
    await redis.hset('assessment_progress', { [assessmentId]: JSON.stringify(progressData) });
    
    // TTL設定（24時間後に自動削除）
    await redis.expire(`assessment_progress:${assessmentId}`, 24 * 60 * 60);
  }

  static async getAssessmentProgress(assessmentId: string): Promise<AssessmentProgressData | null> {
    const progress = await redis.hget('assessment_progress', assessmentId);
    return progress ? (typeof progress === 'string' ? JSON.parse(progress) : progress) as AssessmentProgressData : null;
  }

  static async deleteAssessmentProgress(assessmentId: string): Promise<void> {
    await redis.hdel('assessment_progress', assessmentId);
  }

  static async updateAssessmentStep(
    assessmentId: string, 
    stepId: string, 
    status: 'pending' | 'running' | 'completed' | 'error' | 'in_progress',
    details?: string
  ): Promise<void> {
    const currentProgress = await this.getAssessmentProgress(assessmentId);
    if (currentProgress) {
      const stepIndex = currentProgress.steps.findIndex(step => step.id === stepId);
      if (stepIndex !== -1) {
        currentProgress.steps[stepIndex] = {
          ...currentProgress.steps[stepIndex],
          status,
          details,
          timestamp: new Date().toISOString()
        };
        await this.setAssessmentProgress(assessmentId, currentProgress);
      }
    }
  }
}

export default redis;