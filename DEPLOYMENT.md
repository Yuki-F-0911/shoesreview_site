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

### 2. マイグレーションの実行

本番環境のデータベースにマイグレーションを適用します：

```bash
# 本番環境のDATABASE_URLを設定
export DATABASE_URL="postgresql://user:password@host:5432/database_name?sslmode=require"

# Prismaクライアントの生成
npm run db:generate

# マイグレーションの適用（本番環境用）
npx prisma migrate deploy
```

**注意**: `prisma migrate deploy`は本番環境専用のコマンドです。開発環境では`prisma migrate dev`を使用してください。

### 3. データのインポート（オプション）

開発環境からレビューデータをインポートする場合：

```bash
# 本番環境のDATABASE_URLを設定してから実行
npm run import:backup
```

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

