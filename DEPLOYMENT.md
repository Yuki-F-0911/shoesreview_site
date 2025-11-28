# 本番環境デプロイガイド

このドキュメントでは、シューズレビューサイトを本番環境にデプロイする手順を説明します。

## 目次

1. [前提条件](#前提条件)
2. [環境変数の設定](#環境変数の設定)
3. [データベースのセットアップ](#データベースのセットアップ)
4. [ビルドとデプロイ](#ビルドとデプロイ)
5. [デプロイ後の確認](#デプロイ後の確認)
6. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### 必要な環境

- Node.js 20.x LTS
- PostgreSQL 18.1.1 以上（本番環境用）
- 本番環境用のホスティングサービス（Vercel、AWS、Railway等）

### 推奨ホスティングサービス

- **Vercel**（推奨）: Next.jsに最適化されたホスティング
- **Railway**: PostgreSQLとアプリケーションを一緒にデプロイ可能
- **AWS**: より高度なカスタマイズが必要な場合
- **Render**: シンプルなデプロイが可能

---

## 環境変数の設定

### 本番環境で必要な環境変数

本番環境のホスティングサービスの環境変数設定画面で、以下の変数を設定してください：

```env
# Database（本番環境のPostgreSQL接続URL）
DATABASE_URL="postgresql://user:password@host:5432/database_name?sslmode=require"

# NextAuth（必須）
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret-key-minimum-32-characters"

# Cloudinary（画像アップロード用）
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# AI機能（自動キュレーション用）
OPENAI_API_KEY="your-openai-api-key"
# または
GEMINI_API_KEY="your-gemini-api-key"

# 外部キュレーション機能（オプション）
YOUTUBE_API_KEY="your-youtube-api-key"
SERPER_API_KEY="your-serper-api-key"
# または
GOOGLE_SEARCH_API_KEY="your-google-search-api-key"
GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id"
```

### NEXTAUTH_SECRETの生成

本番環境用の強力なシークレットキーを生成してください：

```bash
# OpenSSLを使用
openssl rand -base64 32

# または Node.jsを使用
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**重要**: 本番環境では必ず強力なシークレットキーを使用してください。

---

## データベースのセットアップ

### 1. 本番データベースの作成

ホスティングサービスでPostgreSQLデータベースを作成し、接続URLを取得してください。

**推奨データベースサービス**:
- **Vercel Postgres**: Vercelと統合されたPostgreSQL（推奨・設定不要）
- **Supabase**: 無料プランあり、PostgreSQLを提供
- **Neon**: Serverless PostgreSQL
- **Railway**: PostgreSQLを簡単にセットアップ可能
- **AWS RDS**: エンタープライズ向け

#### Vercel Postgresを使用する場合（推奨・設定不要）

**PostgreSQL側の設定は不要です**。Vercel Postgresは自動的に設定されます：

1. **VercelダッシュボードでPostgresを追加**
   - Vercelダッシュボード → プロジェクト → Storage → Create Database → Postgres
   - データベース名を入力して作成

2. **環境変数の自動設定**
   - `DATABASE_URL`が自動的に設定されます
   - `POSTGRES_URL`、`POSTGRES_PRISMA_URL`も自動設定されます

3. **マイグレーションを実行**
   ```powershell
   # VercelダッシュボードからDATABASE_URLをコピー
   # Settings → Environment Variables → DATABASE_URL
   
   # 環境変数を設定してマイグレーションを実行
   $env:DATABASE_URL="postgresql://user:password@host:5432/database_name?sslmode=require"
   pnpm db:migrate:deploy
   ```

#### 外部のPostgreSQLサービスを使用する場合

**PostgreSQL側の設定が必要です**：

##### Supabaseを使用する場合（推奨・無料プランあり）

**ステップ1: Supabaseでプロジェクトを作成**

1. **Supabaseにアクセス**
   - https://supabase.com にアクセス
   - GitHubアカウントまたはメールアドレスでサインアップ/ログイン

2. **新しいプロジェクトを作成**
   - 「New Project」をクリック
   - Organizationを選択（または新規作成）
   - プロジェクト名を入力（例: `shoes-review-site`）
   - データベースパスワードを設定（**重要**: このパスワードを忘れないように保存）
   - リージョンを選択（例: `Northeast Asia (Tokyo)`）
   - 「Create new project」をクリック

3. **プロジェクトの作成完了を待つ**（1-2分かかります）

**ステップ2: 接続情報を取得**

1. **プロジェクトダッシュボードに移動**
   - 作成したプロジェクトをクリック

2. **接続文字列を取得**
   - 左メニュー → 「Project Settings」（歯車アイコン）
   - 「Database」をクリック
   - 「Connection string」セクションを開く
   - 「URI」タブを選択
   - 接続文字列をコピー（形式: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`）

3. **接続文字列を修正（マイグレーション用）**
   - Supabaseの接続文字列には`[YOUR-PASSWORD]`が含まれているので、実際のパスワードに置き換える
   - **重要**: マイグレーション実行時は、ポート番号を`6543`から`5432`に変更してください
   - 変更前: `postgresql://postgres.abcdefghijklmnop:your-actual-password@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres`
   - 変更後: `postgresql://postgres.abcdefghijklmnop:your-actual-password@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres`
   - **重要**: 末尾に`?sslmode=require`を追加する必要はありません（Supabaseは自動的にSSLを使用）

**ステップ3: Vercelに環境変数を設定**

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com にアクセス
   - プロジェクトを選択

2. **環境変数を設定**
   - 「Settings」→「Environment Variables」をクリック
   - 「Add New」をクリック
   - Key: `DATABASE_URL`
   - Value: Supabaseから取得した接続文字列（パスワードを置き換えたもの）
   - Environment: 「Production」を選択
   - 「Save」をクリック

**ステップ4: ローカルでマイグレーションを実行**

```powershell
# Supabaseから取得した接続文字列を設定
# [YOUR-PASSWORD]を実際のパスワードに置き換える
# ポート番号を6543から5432に変更（マイグレーション用の直接接続）
$env:DATABASE_URL="postgresql://postgres.abcdefghijklmnop:your-actual-password@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Prismaクライアントの生成
pnpm db:generate

# マイグレーションを実行（スキーマを同期）
pnpm db:migrate:deploy

# シードデータを投入（開発者アカウントなど）
pnpm db:seed
```

**注意事項**:
- Supabaseの接続文字列には`[YOUR-PASSWORD]`が含まれているので、必ず実際のパスワードに置き換えてください
- Supabaseは自動的にSSL接続を使用するため、`?sslmode=require`は不要です
- **マイグレーション実行時は、直接接続（port 5432）を使用してください**
  - Supabaseダッシュボードで表示される接続文字列は通常`6543`（Connection Pooling）になっています
  - マイグレーション実行時は、接続文字列のポート番号を`6543`から`5432`に手動で変更してください
  - Connection Pooling（port 6543）は長時間実行されるマイグレーション操作で接続が切断される可能性があります（P1017エラー）
- アプリケーション実行時は、Connection Pooling（port 6543）を使用できます

##### Neonを使用する場合

1. **Neonでプロジェクトを作成**
   - https://neon.tech にアクセス
   - 「Create Project」をクリック
   - プロジェクト名を設定

2. **接続文字列を取得**
   - Dashboard → Connection Details → Connection string
   - 接続文字列をコピー（`?sslmode=require`が含まれています）

3. **Vercelに環境変数を設定**
   - Vercelダッシュボード → プロジェクト → Settings → Environment Variables
   - `DATABASE_URL`に接続文字列を設定

4. **マイグレーションを実行**
   ```powershell
   $env:DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   pnpm db:migrate:deploy
   ```

##### Railwayを使用する場合

1. **RailwayでPostgreSQLを追加**
   - Railwayダッシュボード → New Project → Add PostgreSQL
   - データベースが自動的に作成されます

2. **接続情報を取得**
   - PostgreSQL → Variables → `DATABASE_URL`をコピー

3. **Vercelに環境変数を設定**
   - Vercelダッシュボード → プロジェクト → Settings → Environment Variables
   - `DATABASE_URL`に接続文字列を設定

4. **マイグレーションを実行**
   ```powershell
   $env:DATABASE_URL="postgresql://postgres:password@host:5432/railway?sslmode=require"
   pnpm db:migrate:deploy
   ```

**重要**: 外部のPostgreSQLサービスを使用する場合、SSL接続が必要なため`?sslmode=require`を必ず追加してください。

#### ローカルのPostgreSQLを本番環境で使用する場合

**注意**: ローカルのPostgreSQLはVercelの本番環境から直接接続できません。理由：
- ローカルのPostgreSQLはインターネットからアクセスできない（プライベートネットワーク内）
- Vercelのサーバーはクラウド上にあり、ローカルマシンに直接接続できない
- セキュリティ上の理由で、ローカルネットワークへの外部アクセスは推奨されない

**代替案**:
1. **ローカルのデータを本番環境のデータベースに同期する**
   - ローカルでマイグレーションを実行してスキーマを同期
   - 必要に応じてデータをエクスポート/インポート

2. **開発環境としてローカルPostgreSQLを使用**
   - 本番環境には別のPostgreSQLサービス（Supabase、Neonなど）を使用
   - ローカルは開発・テスト用として使用

**ローカルのデータを本番環境に同期する手順**:

1. **本番環境のPostgreSQLサービスを作成**（Supabase、Neon、Railwayなど）

2. **ローカルのスキーマを本番環境に同期**
   ```powershell
   # 本番環境のDATABASE_URLを設定
   $env:DATABASE_URL="postgresql://user:password@production-host:5432/database_name?sslmode=require"
   
   # マイグレーションを実行（スキーマを同期）
   pnpm db:migrate:deploy
   ```

3. **ローカルのデータを本番環境にインポート（オプション）**
   ```powershell
   # 本番環境のDATABASE_URLを設定
   $env:DATABASE_URL="postgresql://user:password@production-host:5432/database_name?sslmode=require"
   
   # シードデータを投入
   pnpm db:seed
   
   # または、バックアップデータをインポート
   pnpm import:backup
   ```

### 2. Vercelへのデータベース同期方法

#### 方法A: Vercel CLIを使用（推奨）

1. **Vercel CLIのインストール**
   ```bash
   npm install -g vercel
   ```

2. **Vercelにログイン**
   ```bash
   vercel login
   ```

3. **プロジェクトにリンク**
   ```bash
   vercel link
   ```

4. **環境変数をプル（本番環境のDATABASE_URLを取得）**
   ```bash
   vercel env pull .env.production
   ```

5. **本番環境のDATABASE_URLを設定してマイグレーションを実行**
   ```bash
   # Windows PowerShellの場合
   $env:DATABASE_URL="postgresql://user:password@host:5432/database_name?sslmode=require"
   
   # または .env.production ファイルから読み込む
   # .env.production ファイルに DATABASE_URL を設定
   
   # Prismaクライアントの生成
   pnpm db:generate
   
   # マイグレーションの適用（本番環境用）
   pnpm db:migrate:deploy
   ```

#### 方法B: 環境変数を直接設定して実行

1. **VercelダッシュボードからDATABASE_URLを取得**
   - Vercelダッシュボード → プロジェクト → Settings → Environment Variables
   - `DATABASE_URL`の値をコピー

2. **ローカルで環境変数を設定してマイグレーションを実行**
   ```bash
   # Windows PowerShellの場合
   $env:DATABASE_URL="postgresql://user:password@host:5432/database_name?sslmode=require"
   pnpm db:migrate:deploy
   
   # または一時的に環境変数を設定
   $env:DATABASE_URL="your-production-database-url"; pnpm db:migrate:deploy
   ```

#### 方法C: Vercel Postgresを使用する場合

Vercel Postgresを使用している場合、環境変数は自動的に設定されます：

1. **VercelダッシュボードでPostgresを追加**
   - プロジェクト → Storage → Create Database → Postgres

2. **マイグレーションを実行**
   ```bash
   # Vercel CLIを使用して環境変数を取得
   vercel env pull .env.production
   
   # .env.production から DATABASE_URL を読み込んで実行
   pnpm db:migrate:deploy
   ```

**注意**: `prisma migrate deploy`は本番環境専用のコマンドです。開発環境では`prisma migrate dev`を使用してください。

### 3. データのインポート（オプション）

開発環境からレビューデータをインポートする場合：

```powershell
# 本番環境のDATABASE_URLを設定（Supabase - ポート5432で直接接続）
$env:DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

# バックアップファイルからレビューをインポート
pnpm import:backup
```

**レビューがサイトに表示されない場合の確認方法**:

```powershell
# レビューの状態を確認
pnpm check:reviews
```

このコマンドで、以下の情報が表示されます：
- 総レビュー数
- 公開されているレビュー数
- 非公開のレビュー数と詳細

**非公開のレビューを公開状態に更新する場合**:

```powershell
# すべてのレビューを公開状態に更新
pnpm update:reviews-publish
```

このコマンドで、`isPublished: false`または`isDraft: true`のレビューをすべて公開状態（`isPublished: true`、`isDraft: false`）に更新します。

### 4. シードデータの投入（オプション）

開発者アカウントなどのシードデータを投入する場合：

```bash
# 本番環境のDATABASE_URLを設定してから実行
$env:DATABASE_URL="your-production-database-url"
pnpm db:seed
```

**注意**: 本番環境でシードデータを投入する場合は、既存のデータが上書きされる可能性があります。

---

## ビルドとデプロイ

### Vercelへのデプロイ（推奨）

1. **Vercelアカウントの作成**
   - https://vercel.com にアクセス
   - GitHubアカウントでログイン

2. **プロジェクトのインポート**
   - Vercelダッシュボードで「New Project」をクリック
   - GitHubリポジトリを選択
   - プロジェクトをインポート

3. **環境変数の設定**
   - プロジェクト設定の「Environment Variables」で環境変数を設定
   - 上記の「環境変数の設定」セクションを参照

4. **ビルド設定**
   - Framework Preset: Next.js
   - Build Command: `npm run build`（自動検出）
   - Output Directory: `.next`（自動検出）
   - Install Command: `npm install`

5. **デプロイ**
   - 「Deploy」ボタンをクリック
   - ビルドが完了するまで待機

### Railwayへのデプロイ

1. **Railwayアカウントの作成**
   - https://railway.app にアクセス
   - GitHubアカウントでログイン

2. **プロジェクトの作成**
   - 「New Project」→「Deploy from GitHub repo」
   - リポジトリを選択

3. **PostgreSQLの追加**
   - 「New」→「Database」→「PostgreSQL」を選択
   - データベースが自動的に作成される

4. **環境変数の設定**
   - プロジェクトの「Variables」タブで環境変数を設定
   - `DATABASE_URL`は自動的に設定される

5. **デプロイ**
   - 自動的にデプロイが開始される
   - デプロイ完了後、マイグレーションを実行：
    ```bash
    railway run npx prisma migrate deploy
    ```

### Renderへのデプロイ

1. **Renderアカウントの作成**
   - https://render.com にアクセス
   - GitHubアカウントでログイン

2. **Webサービスの作成**
   - 「New」→「Web Service」
   - リポジトリを選択

3. **設定**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

4. **PostgreSQLの追加**
   - 「New」→「PostgreSQL」を選択
   - データベースを作成

5. **環境変数の設定**
   - サービスの「Environment」タブで環境変数を設定

6. **デプロイ**
   - 「Manual Deploy」→「Deploy latest commit」
   - デプロイ完了後、マイグレーションを実行

---

## デプロイ後の確認

### 1. アプリケーションの動作確認

- [ ] トップページが表示される
- [ ] レビュー一覧が表示される
- [ ] ユーザー登録・ログインが動作する
- [ ] レビュー投稿が動作する
- [ ] 画像アップロードが動作する（Cloudinary設定時）

### 2. データベースの確認

```bash
# Prisma Studioでデータベースを確認（開発環境から）
DATABASE_URL="your-production-database-url" npx prisma studio
```

### 3. パフォーマンスの確認

- [ ] ページの読み込み速度
- [ ] APIレスポンス時間
- [ ] 画像の最適化

### 4. セキュリティの確認

- [ ] HTTPSが有効になっている
- [ ] 環境変数が正しく設定されている
- [ ] 認証が正しく動作している

---

## トラブルシューティング

### ビルドエラー

**問題**: ビルドが失敗する

**解決策**:
1. ローカルでビルドを実行してエラーを確認：
   ```bash
   npm run build
   ```
2. TypeScriptのエラーを修正
3. 依存関係を再インストール：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### データベース接続エラー

**問題**: データベースに接続できない

**解決策**:
1. `DATABASE_URL`が正しく設定されているか確認
2. SSL接続が必要な場合は`?sslmode=require`を追加
3. ファイアウォール設定を確認

### 環境変数が読み込まれない

**問題**: 環境変数が正しく読み込まれない

**解決策**:
1. ホスティングサービスの環境変数設定を確認
2. 変数名のタイポがないか確認
3. デプロイ後に環境変数を再設定して再デプロイ

### 画像が表示されない

**問題**: Cloudinaryの画像が表示されない

**解決策**:
1. `next.config.js`の`remotePatterns`を確認
2. Cloudinaryの設定が正しいか確認
3. 画像URLが正しい形式か確認

---

## 本番環境でのベストプラクティス

### 1. セキュリティ

- ✅ 強力な`NEXTAUTH_SECRET`を使用
- ✅ HTTPSを有効化
- ✅ 環境変数を適切に管理
- ✅ 定期的なセキュリティアップデート

### 2. パフォーマンス

- ✅ Next.jsの画像最適化を活用
- ✅ データベースクエリの最適化
- ✅ CDNの活用（Vercelは自動的に提供）

### 3. モニタリング

- ✅ エラーログの監視
- ✅ パフォーマンスメトリクスの監視
- ✅ データベースの監視

### 4. バックアップ

- ✅ データベースの定期的なバックアップ
- ✅ 環境変数のバックアップ
- ✅ コードのバージョン管理（Git）

---

## 継続的なデプロイ（CI/CD）

### GitHub Actionsの設定例

`.github/workflows/deploy.yml`を作成：

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
```

---

## サポート

問題が発生した場合は、以下を確認してください：

1. ログファイルの確認
2. ホスティングサービスのドキュメント
3. Next.jsのドキュメント: https://nextjs.org/docs
4. Prismaのドキュメント: https://www.prisma.io/docs

