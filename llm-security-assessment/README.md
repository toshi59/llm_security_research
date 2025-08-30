# LLMセキュリティ評価システム

Next.jsベースのWebアプリケーションで、LLMモデルのセキュリティ評価を**閲覧（匿名OK）**と**登録（管理者のみ）**できます。データはUpstash Redisに保存され、調査はTavily＋GPT-5で自動実行されます。

## 機能

- **包括的な評価項目**: 法規制、セキュリティ、AI倫理、技術的健全性など40項目
- **自動調査機能**: Tavily APIとGPT-4を活用した情報収集と評価
- **モデル別・カテゴリ別表示**: 折りたたみ可能なアコーディオン形式でデータを整理
- **詳細なレポート**: エビデンスベースの評価結果
- **セキュアな管理**: JWT認証による管理者権限と監査ログ
- **レスポンシブUI**: サイドバー固定レイアウトで使いやすさを重視
- **ブランドカラー**: #0066FF (プライマリー) と #66CC00 (アクセント)

## 技術スタック

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **UI**: Tailwind CSS + shadcn/ui
- **Database**: Upstash Redis (JSON API)
- **Authentication**: JWT + bcrypt (HTTP-only cookies)
- **External APIs**: Tavily Search API, OpenAI GPT-4
- **Deployment**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env`にコピーして、必要な値を設定してください：

```bash
cp .env.example .env
```

必要な環境変数：
- `UPSTASH_REDIS_REST_URL`: Upstash RedisのREST URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redisのトークン
- `TAVILY_API_KEY`: Tavily Search APIキー
- `OPENAI_API_KEY`: OpenAI APIキー
- `ADMIN_USERNAME`: 管理者ユーザー名（デフォルト: admin）
- `ADMIN_PASSWORD_HASH`: 管理者パスワードのbcryptハッシュ（未設定時は'0000'）
- `JWT_SECRET`: JWTシークレットキー

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## 使用方法

### 評価結果画面 (`/assessments`)

- **モデル別・カテゴリ別の階層表示**: 折りたたみ可能なアコーディオン形式
- **フィルタリング機能**: モデル、カテゴリ、判定、リスクレベルで絞り込み
- **詳細表示**: スライドオーバーでエビデンス情報を確認
- **統計ダッシュボード**: 判定結果の集計とグラフ表示
- **レスポンシブ列幅**: リスク情報など長文に対応した適切な列幅設定

### 管理画面 (`/admin`)

1. `/login` で管理者ログイン（デフォルト: admin/0000）
2. モデル名を入力して「調査を実行」
3. 自動調査結果のプレビュー
4. 必要に応じて修正して「評価を登録」

### 初回セットアップ

アプリケーション初回起動時に以下が自動実行されます：
- 管理者ユーザーの作成（存在しない場合）
- 40件のセキュリティ評価項目のRedisへの投入

## 評価カテゴリ

| カテゴリ | 項目数 | 説明 |
|---------|--------|------|
| 法規制・プライバシー | 5 | GDPR、CCPA、データローカライゼーション等 |
| セキュリティ | 5 | 暗号化、アクセス制御、脆弱性管理等 |
| AI倫理 | 5 | 公平性、説明可能性、有害コンテンツ防止等 |
| 技術的健全性 | 5 | 精度、堅牢性、スケーラビリティ等 |
| 透明性・説明責任 | 5 | 文書化、利用規約、第三者監査等 |
| 持続可能性 | 3 | 環境影響、リソース効率等 |
| データガバナンス | 4 | データ品質、ライフサイクル管理等 |
| 統合・相互運用性 | 3 | API標準、データフォーマット等 |
| コスト・ROI | 3 | 総所有コスト、使用量ベース課金等 |
| ベンダー管理 | 2 | 財務健全性、SLA等 |

## データモデル

### Redis JSONキー

- `security_item:{itemId}`: セキュリティ評価項目
- `model:{modelId}`: LLMモデル情報
- `assessment:{assessmentId}`: 評価
- `assessment_item:{assessmentItemId}`: 評価項目
- `admin_user:{username}`: 管理者ユーザー
- `audit:{ulid}`: 監査ログ

## APIエンドポイント

### 公開API
- `GET /api/assessments`: 評価一覧取得
- `GET /api/security-items`: セキュリティ項目一覧取得

### 認証API
- `POST /api/login`: ログイン
- `POST /api/logout`: ログアウト

### 管理者API（要認証）
- `POST /api/admin/investigate`: モデル調査実行
- `POST /api/admin/assessments`: 評価作成

## デプロイ

### Vercelへのデプロイ

1. GitHubリポジトリにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定
4. デプロイ実行

### 環境変数（本番環境）

本番環境では以下の点に注意：
- `JWT_SECRET`: 十分に複雑なランダム文字列
- `ADMIN_PASSWORD_HASH`: 強力なパスワードのbcryptハッシュ
- `NODE_ENV=production`

## セキュリティ

- パスワードはbcryptでハッシュ化
- JWTトークンはHTTP-onlyクッキーで管理
- CSRF対策
- 入力値検証（zod）
- Rate limiting対応

## 監査とコンプライアンス

- 全ての評価作成・更新を監査ログに記録
- ユーザー、アクション、変更内容を追跡
- ISO 27001、SOC 2等の基準に準拠した評価項目

## ライセンス

MIT License

## サポート

問題や質問がある場合は、GitHubのIssuesをご利用ください。
