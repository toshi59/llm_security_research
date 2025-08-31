/**
 * Redis データマイグレーション スクリプト
 * 個別キーベースのスキーマから Hash ベースのスキーマに移行
 * 
 * 実行方法: npx tsx src/scripts/migrate-to-hash.ts
 */

import { Redis } from '@upstash/redis';
import type { SecurityItem, Model, Assessment, AssessmentItem, AdminUser, AuditLog } from '@/lib/types';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function migrateSecurityItems() {
  console.log('🔄 Migrating security items...');
  
  // 既存のキーを取得
  const oldKeys = await redis.keys('security_item:*');
  console.log(`Found ${oldKeys.length} security items`);
  
  if (oldKeys.length === 0) return;
  
  // 各アイテムをHashに移行
  for (const key of oldKeys) {
    const item = await redis.get<SecurityItem>(key);
    if (item) {
      await redis.hset('security_items', item.id, JSON.stringify(item));
      console.log(`✓ Migrated security item: ${item.name}`);
    }
  }
  
  console.log('✅ Security items migration complete');
}

async function migrateModels() {
  console.log('🔄 Migrating models...');
  
  const oldKeys = await redis.keys('model:*');
  console.log(`Found ${oldKeys.length} models`);
  
  if (oldKeys.length === 0) return;
  
  for (const key of oldKeys) {
    const model = await redis.get<Model>(key);
    if (model) {
      await redis.hset('models', model.id, JSON.stringify(model));
      console.log(`✓ Migrated model: ${model.name}`);
    }
  }
  
  console.log('✅ Models migration complete');
}

async function migrateAssessments() {
  console.log('🔄 Migrating assessments...');
  
  const oldKeys = await redis.keys('assessment:*');
  console.log(`Found ${oldKeys.length} assessments`);
  
  if (oldKeys.length === 0) return;
  
  for (const key of oldKeys) {
    const assessment = await redis.get<Assessment>(key);
    if (assessment) {
      await redis.hset('assessments', assessment.id, JSON.stringify(assessment));
      
      // モデル別インデックスも作成
      await redis.sadd(`model_assessments:${assessment.modelId}`, assessment.id);
      
      console.log(`✓ Migrated assessment: ${assessment.id}`);
    }
  }
  
  console.log('✅ Assessments migration complete');
}

async function migrateAssessmentItems() {
  console.log('🔄 Migrating assessment items...');
  
  const oldKeys = await redis.keys('assessment_item:*');
  console.log(`Found ${oldKeys.length} assessment items`);
  
  if (oldKeys.length === 0) return;
  
  for (const key of oldKeys) {
    const item = await redis.get<AssessmentItem>(key);
    if (item) {
      await redis.hset('assessment_items', item.id, JSON.stringify(item));
      
      // インデックスも作成
      await redis.sadd(`assessment_items_by_assessment:${item.assessmentId}`, item.id);
      await redis.sadd(`assessment_items_by_item:${item.itemId}`, item.id);
      
      console.log(`✓ Migrated assessment item: ${item.id}`);
    }
  }
  
  console.log('✅ Assessment items migration complete');
}

async function migrateAdminUsers() {
  console.log('🔄 Migrating admin users...');
  
  const oldKeys = await redis.keys('admin_user:*');
  console.log(`Found ${oldKeys.length} admin users`);
  
  if (oldKeys.length === 0) return;
  
  for (const key of oldKeys) {
    const user = await redis.get<AdminUser>(key);
    if (user) {
      await redis.hset('admin_users', user.username, JSON.stringify(user));
      console.log(`✓ Migrated admin user: ${user.username}`);
    }
  }
  
  console.log('✅ Admin users migration complete');
}

async function migrateAuditLogs() {
  console.log('🔄 Migrating audit logs...');
  
  const oldKeys = await redis.keys('audit:*');
  console.log(`Found ${oldKeys.length} audit logs`);
  
  if (oldKeys.length === 0) return;
  
  for (const key of oldKeys) {
    const log = await redis.get<AuditLog>(key);
    if (log) {
      await redis.hset('audit_logs', log.id, JSON.stringify(log));
      
      // 時系列インデックス（ソートセット）も作成
      const timestamp = new Date(log.timestamp).getTime();
      await redis.zadd('audit_logs_timeline', { score: timestamp, member: log.id });
      
      console.log(`✓ Migrated audit log: ${log.id}`);
    }
  }
  
  console.log('✅ Audit logs migration complete');
}

async function cleanupOldKeys() {
  console.log('🧹 Cleaning up old keys...');
  
  const patterns = [
    'security_item:*',
    'model:*', 
    'assessment:*',
    'assessment_item:*',
    'admin_user:*',
    'audit:*'
  ];
  
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      console.log(`Deleting ${keys.length} keys matching ${pattern}`);
      await redis.del(...keys);
    }
  }
  
  console.log('✅ Cleanup complete');
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  const checks = [
    { hash: 'security_items', name: 'Security Items' },
    { hash: 'models', name: 'Models' },
    { hash: 'assessments', name: 'Assessments' },
    { hash: 'assessment_items', name: 'Assessment Items' },
    { hash: 'admin_users', name: 'Admin Users' },
    { hash: 'audit_logs', name: 'Audit Logs' }
  ];
  
  for (const check of checks) {
    const count = await redis.hlen(check.hash);
    console.log(`✓ ${check.name}: ${count} records`);
  }
  
  // インデックス確認
  const indexKeys = await redis.keys('*assessments:*');
  console.log(`✓ Assessment indices: ${indexKeys.length} keys`);
  
  const timelineCount = await redis.zcard('audit_logs_timeline');
  console.log(`✓ Audit logs timeline: ${timelineCount} entries`);
  
  console.log('✅ Verification complete');
}

async function main() {
  try {
    console.log('🚀 Starting Redis Hash Migration...\n');
    
    // マイグレーション実行
    await migrateSecurityItems();
    await migrateModels();
    await migrateAssessments();
    await migrateAssessmentItems();
    await migrateAdminUsers();
    await migrateAuditLogs();
    
    // 検証
    await verifyMigration();
    
    // 古いキーの削除（安全のため確認してから実行）
    const shouldCleanup = process.argv.includes('--cleanup');
    if (shouldCleanup) {
      await cleanupOldKeys();
    } else {
      console.log('\n⚠️  Old keys not deleted. Run with --cleanup flag to remove them.');
      console.log('   Example: npx tsx src/scripts/migrate-to-hash.ts --cleanup');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// 実行
main();