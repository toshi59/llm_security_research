# 技術仕様書_v1.0

## 目的
Next.jsベースで「LLMモデルのセキュリティ評価」を**閲覧（匿名OK）**と**登録（管理者のみ）**できるWebアプリを生成してください。  
データはUpstash Redis（JSON）に保存し、**調査はTavily＋GPT-5**で自動実行します。UIは日本語、将来の英語対応を考慮してi18nの足場も用意します。ブランドカラーは **#0066FF** と **#66CC00**。

---

## 固定仕様・スタック
- Framework: **Next.js 14+**（App Router, TypeScript）
- UI: **Tailwind CSS + shadcn/ui**（ダーク/ライト切替、ブランドカラー #0066FF/#66CC00 をテーマ化）
- 認証（管理者のみ）: **簡易ユーザ名/パスワード方式**（1ユーザ）
  - 既定管理者：**username=admin / password=0000**
  - 実装：/login で認証 → 署名付きHTTP-onlyクッキー（JWT）でセッション。/admin配下を保護。
  - パスワードは**平文保存せず**ハッシュ（bcrypt）で保持。初回起動時に管理者が存在しなければ作成。
- DB: **Upstash Redis（@upstash/redis, JSON API）**
- 外部API: **Tavily Search API**、**OpenAI GPT-5（`gpt-5-latest`）**
- デプロイ: **Vercel**（GitHub連携）
- Lint/Format: ESLint + Prettier（TS strict, no-any）
- テスト: Playwright（E2E）＆ Vitest（ユニット）
- ロギング/監査: アプリ内監査ログ（作成/更新差分）

---

## 環境変数
`.env` に記載し、READMEに説明すること。

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `TAVILY_API_KEY`
- `OPENAI_API_KEY`
- `ADMIN_USERNAME`（未設定時は`admin`）
- `ADMIN_PASSWORD_HASH`（未設定時は`0000`のbcryptハッシュを起動時生成）
- `JWT_SECRET`（ランダム値）
- `NEXT_PUBLIC_BRAND_PRIMARY=#0066FF`, `NEXT_PUBLIC_BRAND_ACCENT=#66CC00`

---

## データモデル（Redis JSONキー）

### security_item:{itemId}
```json
{
  "id": "ulid",
  "category": "法規制・プライバシー",
  "name": "GDPR適合性",
  "criteria": "詳細基準/望ましい水準",
  "standards": "参考規格・法令",
  "evidence_examples": "証拠/確認ソース（例）",
  "risk": "未達時の主なリスク",
  "order": 1
}
````

### model:{modelId}

```json
{"id":"ulid","name":"GPT-5 Enterprise","vendor":"OpenAI","notes":""}
```

### assessment:{assessmentId}

```json
{"id":"ulid","modelId":"ref:model","createdAt":"iso","createdBy":"email/username",
 "status":"draft|submitted","summary":"全体所見"}
```

### assessment\_item:{assessmentItemId}

```json
{"id":"ulid","assessmentId":"ref:assessment","itemId":"ref:security_item",
 "judgement":"○|×|要改善|null","comment":"備考/所見",
 "evidences":[{"url":"...","title":"...","snippet":"...","confidence":0.0}],
 "filledBy":"user","updatedAt":"iso"}
```

### admin\_user:{username}

```json
{"username":"admin","passwordHash":"..."}
```

### audit:{ulid}

監査ログ（誰が/いつ/何を、変更差分も保存）

---

## インデックス

* `idx:assessment_items:by_model:{modelId}`
* `idx:assessment_items:by_item:{itemId}`
* 判定サマリのキャッシュキー

---

## 初期データ

CSVを参考にした**40件の評価項目マスタ**を `seed/security-items.json` に保存し、初回起動時にRedisへ投入する。
CSVの内容は展開して全件JSON化すること。起動後は再読込不要。

---

## 画面仕様

### 閲覧画面（/assessments）

* テーブルで「モデル」「カテゴリ」「チェック項目」「判定」「備考」を一覧
* フィルタ：モデル、項目、判定（○/×/要改善/未設定）
* 行クリック → 詳細スライドオーバー（criteria/standards/risk/evidencesを表示）
* 集計ヘッダー：判定件数ピル、カテゴリ別ドーナツチャート

### 管理画面（/admin, 要ログイン）

* モデル名入力フィールド＋「調査実行」ボタン
* 実行後の進捗モーダル（Tavily収集 → GPT-5整形 → 割当）
* プレビュー画面で判定/備考/エビデンス修正可能
* 「登録」ボタンで保存（assessment + assessment\_item\[]）
* 履歴タブ：過去のassessment一覧、差分表示（変更箇所をハイライト）

---

## 自動調査ワークフロー

1. モデル名入力
2. Tavily検索（一般Webのみ、最大100件、重複除去）
3. スニペット収集と項目マッピング
4. GPT-5でJSON整形

   * judgement（○/×/要改善/null）
   * comment（100字以内）
   * evidences\[{url,title,snippet}]
   * 不明確はnull
5. 保存：assessment + assessment\_item\[]
6. 監査ログ記録

---

## APIルート

* `POST /api/login`
* `POST /api/logout`
* `POST /api/admin/investigate`
* `POST /api/admin/assessments`
* `GET /api/assessments`
* `GET /api/security-items`

---

## コンポーネント

* `<DataTable />`
* `<Filters />`
* `<AssessmentPreview />`
* `<EvidenceBadge />`
* `<AuthGuard />`

---

## 非機能要件

* 入力バリデーション: zod
* JWT + RBACによる管理API保護
* CSRF対策
* URLサニタイズ
* Rate Limit（Upstash Ratelimit）
* エラーハンドリング（UIトースト＋サーバーログ）

---

## i18n

* 日本語を既定、next-intlで英語追加しやすい構造
* 文言は辞書化

---

## 受け入れテスト

1. 初回起動で `seed/security-items.json` の40件が登録される
2. 匿名で /assessments アクセス可、フィルタが正しく効く
3. /login で admin/0000 ログイン可能
4. 調査実行で100件以内の証拠収集、10件以上にURL付与
5. 登録後、閲覧画面に反映される
6. 監査ログに記録される
