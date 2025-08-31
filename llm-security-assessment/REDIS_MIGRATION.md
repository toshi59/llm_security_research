# Redis Hash-based Schema Migration

## 概要

このプロジェクトのRedisデータスキーマを個別キーベースからHashベースに最適化しました。

## 変更前後の比較

### 変更前（個別キーベース）
```
security_item:01ABC123...
security_item:01DEF456...
model:01GHI789...
assessment:01JKL012...
...（数千個のキー）
```

### 変更後（Hashベース）
```
security_items -> Hash {field1: data1, field2: data2, ...}
models -> Hash {...}
assessments -> Hash {...}
assessment_items -> Hash {...}
admin_users -> Hash {...}
audit_logs -> Hash {...}
audit_logs_timeline -> Sorted Set (時系列検索用)
```

## パフォーマンス改善

- ✅ **キー数**: 数千個 → 5個程度に激減
- ✅ **検索速度**: O(n) → O(1) 
- ✅ **メモリ使用量**: 大幅削減
- ✅ **`keys('*')`の完全廃止**: 全キースキャンを排除

## マイグレーション手順

### 1. データのバックアップ（推奨）
```bash
# Upstash Redis Consoleでデータをエクスポート（GUIから）
```

### 2. マイグレーション実行
```bash
cd llm-security-assessment

# 検証のみ（古いキーは削除しない）
npm run migrate:redis

# 完全マイグレーション（古いキー削除込み）
npm run migrate:redis:cleanup
```

### 3. 動作確認
- アプリケーションを起動: `npm run dev`
- 全機能が正常に動作することを確認
- パフォーマンスの改善を確認

## 新スキーマの詳細

### 主要ハッシュ
- `security_items` - セキュリティ評価項目
- `models` - AIモデル情報
- `assessments` - アセスメント結果
- `assessment_items` - アセスメント詳細項目
- `admin_users` - 管理者ユーザー
- `audit_logs` - 監査ログ

### インデックス
- `model_assessments:{modelId}` - Set: モデル別アセスメント
- `assessment_items_by_assessment:{assessmentId}` - Set: アセスメント別項目
- `assessment_items_by_item:{itemId}` - Set: 項目別アセスメント
- `audit_logs_timeline` - Sorted Set: 時系列監査ログ

## ロールバック方法

マイグレーション後に問題が発生した場合:

1. `--cleanup`なしでマイグレーションした場合は古いキーが残っているので、新しいハッシュキーを削除
2. `--cleanup`済みの場合はバックアップから復元

```bash
# 新しいハッシュキーを削除（ロールバック）
redis-cli DEL security_items models assessments assessment_items admin_users audit_logs audit_logs_timeline
```

## 注意事項

- マイグレーション中はアプリケーションを停止してください
- 本番環境では必ずバックアップを取ってからマイグレーションしてください
- マイグレーション前後でデータ件数を確認してください