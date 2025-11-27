# シューズレビューサイト

シューズのレビューを投稿・閲覧できるプラットフォームです。

## 技術スタック

- **フロントエンド**: Next.js 14.2.0 (App Router), React 18.3.0, TypeScript 5.3.3
- **スタイリング**: Tailwind CSS 3.4.0
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL 15.x
- **ORM**: Prisma 5.11.0
- **認証**: NextAuth.js 5.0.0-beta
- **フォーム管理**: React Hook Form 7.51.0, Zod 3.22.0

## セットアップ

### 必要な環境

- Node.js 20.x LTS
- PostgreSQL 15.x
- pnpm 8.x（推奨）または npm 10.x

### インストール手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd シューズレビューサイト
```

2. 依存関係のインストール
```bash
pnpm install
# または
npm install
```

3. 環境変数の設定
`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/shoes_review_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"

# Cloudinary (画像アップロード用)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# AI機能（自動キュレーション用）
OPENAI_API_KEY="your-openai-api-key"  # OpenAI APIキー（優先）
# または
GEMINI_API_KEY="your-gemini-api-key"  # Google Gemini APIキー（フォールバック）

# 外部キュレーション機能（オプション）
YOUTUBE_API_KEY="your-youtube-api-key"  # YouTube Data API v3キー
SERPER_API_KEY="your-serper-api-key"  # Serper APIキー（Web検索用、推奨）
# または
GOOGLE_SEARCH_API_KEY="your-google-search-api-key"  # Google Custom Search APIキー
GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id"  # Google Custom Search Engine ID
```

`NEXTAUTH_SECRET`は以下のコマンドで生成できます：
```bash
openssl rand -base64 32
```

4. データベースのセットアップ
```bash
# Prismaクライアントの生成
pnpm db:generate

# データベースマイグレーション
pnpm db:migrate

# シードデータの投入（オプション）
pnpm db:seed
```

5. 開発サーバーの起動
```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 主要機能

### Phase 1: MVP（実装済み）

- ✅ ユーザー認証機能（登録・ログイン・ログアウト）
- ✅ レビュー投稿機能
- ✅ レビュー一覧・詳細表示
- ✅ 簡単な検索機能
- ✅ シンプルなUI実装

### Phase 2: AI機能（実装済み）

- ✅ 自動キュレーション機能
  - Web記事からのレビュー情報収集
  - YouTube動画からのレビュー情報収集・要約
  - 複数ソースの統合レビュー生成
  - 外部サイトからの自動検索・収集機能

### 今後の実装予定

- [ ] いいね・コメント機能（Phase 3）
- [ ] フォロー機能（Phase 3）
- [ ] ブックマーク機能（Phase 3）

## プロジェクト構成

```
シューズレビューサイト/
├── prisma/              # Prismaスキーマ・マイグレーション
├── public/              # 静的ファイル
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # Reactコンポーネント
│   ├── lib/            # ユーティリティ・ヘルパー
│   ├── types/          # TypeScript型定義
│   ├── hooks/          # カスタムフック
│   ├── styles/         # グローバルスタイル
│   └── constants/     # 定数定義
```

詳細は`directorystructure.md`を参照してください。

## 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# 本番ビルド
pnpm build

# 本番サーバー起動
pnpm start

# リント
pnpm lint

# Prisma Studio（データベースGUI）
pnpm db:studio

# スクレイピングレビューのデータベース統合
pnpm import:reviews [jsonファイルのパス] [オプション]
```

## スクレイピングレビューの統合

スクレイピングで取得したレビューをデータベースに統合するには、`import:reviews`コマンドを使用します。

### 基本的な使用方法

```bash
# 個別モード（各レビューを個別に保存）
pnpm import:reviews scrayping/results_all.json

# 統合モード（同じ靴の複数レビューを1つのレビューに統合）
pnpm import:reviews scrayping/results_all.json --consolidate

# 特定のファイルを処理
pnpm import:reviews scrayping/backup/results_Nike_Pegasus_running_shoe_review.json
```

### 動作説明

- **個別モード（デフォルト）**: 各レビューソースを個別のレビューとして保存します。各レビューは独立して表示されます。
- **統合モード（`--consolidate`）**: 同じ靴の複数のレビューソースを1つのレビューに統合します。複数の情報源が1つのレビューにまとめられ、`sourceCount`フィールドに情報源の数が記録されます。

### 処理の流れ

1. JSONファイルからレビューデータを読み込み
2. 有効なレビューのみを抽出（エラーや失敗したものはスキップ）
3. 靴ごとにグループ化（ブランド名とモデル名でグループ化）
4. データベースに靴を検索または作成
5. レビューとAISourceを保存

### 注意事項

- 同じURLのソースが既に存在する場合はスキップされます
- 靴の検索は大文字小文字を区別しません
- カテゴリーは自動的に正規化されます（例: "Daily Trainer" → "ランニング"）

## テストアカウント

シードデータには以下のテストアカウントが含まれています：

- Email: `test@example.com`
- Password: `password123`

- Email: `demo@example.com`
- Password: `password123`

## 本番環境へのデプロイ

詳細なデプロイ手順は [`DEPLOYMENT.md`](./DEPLOYMENT.md) を参照してください。

### クイックスタート

1. **環境変数の設定**
   - 本番環境のホスティングサービスで環境変数を設定
   - 必要な環境変数は `DEPLOYMENT.md` を参照

2. **データベースのセットアップ**
   ```bash
   # 本番環境のDATABASE_URLを設定してから実行
   npm run db:generate
   npx prisma migrate deploy
   ```

3. **ビルドとデプロイ**
   ```bash
   npm run build
   npm start
   ```

### 推奨ホスティングサービス

- **Vercel**（推奨）: Next.jsに最適化、無料プランあり
- **Railway**: PostgreSQLとアプリを一緒にデプロイ可能
- **Render**: シンプルなデプロイが可能

詳細は [`DEPLOYMENT.md`](./DEPLOYMENT.md) を参照してください。

## ライセンス

MIT

