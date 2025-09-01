#!/usr/bin/env tsx
/**
 * 不要なassessment_items_by_item:*キーをクリーンアップするスクリプト
 * 実行方法: npx tsx src/scripts/cleanup-item-indexes.ts
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function cleanupItemIndexes() {
  console.log('🧹 不要なインデックスキーのクリーンアップを開始します...');
  
  try {
    // assessment_items_by_item:* パターンのキーを検索
    let cursor = '0';
    let deletedCount = 0;
    const pattern = 'assessment_items_by_item:*';
    
    do {
      // Redisの SCAN コマンドを使用してキーを取得
      const result = await redis.scan(cursor, {
        match: pattern,
        count: 100
      });
      
      cursor = result[0];
      const keys = result[1];
      
      if (keys.length > 0) {
        console.log(`📋 ${keys.length}個のキーを発見しました`);
        
        // バッチで削除
        for (const key of keys) {
          await redis.del(key);
          deletedCount++;
          
          if (deletedCount % 10 === 0) {
            console.log(`  削除済み: ${deletedCount}個`);
          }
        }
      }
    } while (cursor !== '0');
    
    console.log(`\n✅ クリーンアップ完了！`);
    console.log(`📊 削除したキー数: ${deletedCount}個`);
    
    // 確認のため、残っているキーをチェック
    const checkResult = await redis.scan('0', {
      match: pattern,
      count: 1
    });
    
    if (checkResult[1].length === 0) {
      console.log('✨ すべてのassessment_items_by_item:*キーが削除されました');
    } else {
      console.log('⚠️ まだ一部のキーが残っている可能性があります');
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// スクリプトを実行
cleanupItemIndexes();