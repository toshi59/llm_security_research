import { Redis } from '@upstash/redis';
import { ulid } from 'ulid';
import type { 
  SecurityItem, 
  Model, 
  Assessment, 
  AssessmentItem, 
  AdminUser, 
  AuditLog 
} from '@/lib/types';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class RedisService {
  static async getSecurityItem(id: string): Promise<SecurityItem | null> {
    return await redis.get(`security_item:${id}`);
  }

  static async getAllSecurityItems(): Promise<SecurityItem[]> {
    const keys = await redis.keys('security_item:*');
    if (keys.length === 0) return [];
    
    const items = await Promise.all(
      keys.map(key => redis.get<SecurityItem>(key))
    );
    
    return items
      .filter((item): item is SecurityItem => item !== null)
      .sort((a, b) => a.order - b.order);
  }

  static async createSecurityItem(item: Omit<SecurityItem, 'id'>): Promise<SecurityItem> {
    const id = ulid();
    const newItem = { ...item, id };
    await redis.set(`security_item:${id}`, newItem);
    return newItem;
  }

  static async getModel(id: string): Promise<Model | null> {
    return await redis.get(`model:${id}`);
  }

  static async getAllModels(): Promise<Model[]> {
    const keys = await redis.keys('model:*');
    if (keys.length === 0) return [];
    
    const models = await Promise.all(
      keys.map(key => redis.get<Model>(key))
    );
    
    return models.filter((model): model is Model => model !== null);
  }

  static async createModel(model: Omit<Model, 'id'>): Promise<Model> {
    const id = ulid();
    const newModel = { ...model, id };
    await redis.set(`model:${id}`, newModel);
    return newModel;
  }

  static async getAssessment(id: string): Promise<Assessment | null> {
    return await redis.get(`assessment:${id}`);
  }

  static async getAllAssessments(): Promise<Assessment[]> {
    const keys = await redis.keys('assessment:*');
    if (keys.length === 0) return [];
    
    const assessments = await Promise.all(
      keys.map(key => redis.get<Assessment>(key))
    );
    
    return assessments
      .filter((assessment): assessment is Assessment => assessment !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async createAssessment(assessment: Omit<Assessment, 'id'>): Promise<Assessment> {
    const id = ulid();
    const newAssessment = { ...assessment, id };
    await redis.set(`assessment:${id}`, newAssessment);
    return newAssessment;
  }

  static async getAssessmentItem(id: string): Promise<AssessmentItem | null> {
    return await redis.get(`assessment_item:${id}`);
  }

  static async getAssessmentItems(assessmentId: string): Promise<AssessmentItem[]> {
    const keys = await redis.keys('assessment_item:*');
    if (keys.length === 0) return [];
    
    const items = await Promise.all(
      keys.map(key => redis.get<AssessmentItem>(key))
    );
    
    return items.filter(
      (item): item is AssessmentItem => item !== null && item.assessmentId === assessmentId
    );
  }

  static async createAssessmentItem(item: Omit<AssessmentItem, 'id'>): Promise<AssessmentItem> {
    const id = ulid();
    const newItem = { ...item, id };
    await redis.set(`assessment_item:${id}`, newItem);
    
    await redis.sadd(`idx:assessment_items:by_model:${item.assessmentId}`, id);
    await redis.sadd(`idx:assessment_items:by_item:${item.itemId}`, id);
    
    return newItem;
  }

  static async updateAssessmentItem(id: string, updates: Partial<AssessmentItem>): Promise<AssessmentItem | null> {
    const existing = await redis.get<AssessmentItem>(`assessment_item:${id}`);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await redis.set(`assessment_item:${id}`, updated);
    return updated;
  }

  static async getAdminUser(username: string): Promise<AdminUser | null> {
    return await redis.get(`admin_user:${username}`);
  }

  static async createAdminUser(user: AdminUser): Promise<void> {
    await redis.set(`admin_user:${user.username}`, user);
  }

  static async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const id = ulid();
    const newLog = {
      ...log,
      id,
      timestamp: new Date().toISOString(),
    };
    await redis.set(`audit:${id}`, newLog);
    return newLog;
  }

  static async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    const keys = await redis.keys('audit:*');
    if (keys.length === 0) return [];
    
    const logs = await Promise.all(
      keys.slice(0, limit).map(key => redis.get<AuditLog>(key))
    );
    
    return logs
      .filter((log): log is AuditLog => log !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // 削除メソッド
  static async deleteAssessment(id: string): Promise<boolean> {
    const result = await redis.del(`assessment:${id}`);
    return result === 1;
  }

  static async deleteAssessmentItem(id: string): Promise<boolean> {
    const item = await redis.get<AssessmentItem>(`assessment_item:${id}`);
    if (item) {
      // インデックスからも削除
      await redis.srem(`idx:assessment_items:by_model:${item.assessmentId}`, id);
      await redis.srem(`idx:assessment_items:by_item:${item.itemId}`, id);
    }
    
    const result = await redis.del(`assessment_item:${id}`);
    return result === 1;
  }
}

export default redis;