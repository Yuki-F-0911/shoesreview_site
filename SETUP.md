# データベースセットアップガイド

## 前提条件

- Node.js 20.x LTS がインストールされていること
- PostgreSQL 18.1.1 がインストールされていること

## ステップ1: PostgreSQLのインストールとデータベース作成

### WindowsでのPostgreSQLインストール

1. [PostgreSQL公式サイト](https://www.postgresql.org/download/windows/)からインストーラーをダウンロード
2. インストール時に設定するパスワードをメモしておく（後で使用します）
3. インストール後、PostgreSQLが起動していることを確認

### データベースの作成

以下のいずれかの方法でデータベースを作成します：

#### 方法1: pgAdminを使用（GUI）

1. pgAdminを起動
2. サーバーに接続（インストール時に設定したパスワードを使用）
3. データベースを右クリック → Create → Database
4. データベース名: `shoes_review_db`
5. Owner: `postgres`（デフォルト）
6. Saveをクリック

#### 方法2: コマンドライン（psql）を使用

```powershell
# PostgreSQLのbinディレクトリに移動（例）
# 注意: インストールパスはバージョンによって異なる場合があります
cd "C:\Program Files\PostgreSQL\18\bin"

# psqlに接続
.\psql.exe -U postgres

# パスワードを入力後、以下のSQLを実行
CREATE DATABASE shoes_review_db;

# データベース一覧を確認
\l

# 終了
\q
```

## ステップ2: パッケージマネージャーの準備

### オプション1: npmを使用（推奨 - すぐに使える）

npmはNode.jsと一緒にインストールされているので、そのまま使用できます。

### オプション2: pnpmをインストール（推奨 - 高速）

```powershell
# npmでpnpmをグローバルインストール
npm install -g pnpm

# インストール確認
pnpm --version
```

## ステップ3: プロジェクトの依存関係をインストール

### npmを使用する場合

```powershell
npm install
```

### pnpmを使用する場合

```powershell
pnpm install
```

## ステップ4: 環境変数の設定

プロジェクトのルートディレクトリに `.env.local` ファイルを作成します。

```powershell
# .env.localファイルを作成（PowerShell）
New-Item -Path .env.local -ItemType File
```

`.env.local` ファイルに以下の内容を記述します：

```env
# Database
# 形式: postgresql://ユーザー名:パスワード@ホスト:ポート/データベース名
# 例: postgresql://postgres:yourpassword@localhost:5432/shoes_review_db
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/shoes_review_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"

# Cloudinary (画像アップロード用 - 後で設定可能)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

### NEXTAUTH_SECRETの生成方法

PowerShellで以下のコマンドを実行：

```powershell
# OpenSSLがインストールされている場合
openssl rand -base64 32

# または、Node.jsを使用
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## ステップ5: Prismaのセットアップ

### Prismaクライアントの生成

```powershell
# npmを使用する場合
npm run db:generate

# pnpmを使用する場合
pnpm db:generate
```

### データベースマイグレーション

```powershell
# npmを使用する場合
npm run db:migrate

# pnpmを使用する場合
pnpm db:migrate
```

マイグレーション実行時に、マイグレーション名の入力を求められます。例: `init`

### シードデータの投入（オプション）

テスト用のデータを投入します：

```powershell
# npmを使用する場合
npm run db:seed

# pnpmを使用する場合
pnpm db:seed
```

これで以下のテストアカウントが作成されます：
- Email: `test@example.com` / Password: `password123`
- Email: `demo@example.com` / Password: `password123`

## ステップ6: 開発サーバーの起動

```powershell
# npmを使用する場合
npm run dev

# pnpmを使用する場合
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## トラブルシューティング

### PostgreSQLに接続できない場合

1. PostgreSQLサービスが起動しているか確認
   ```powershell
   # サービス一覧を確認
   Get-Service -Name postgresql*
   
   # サービスを起動（必要に応じて）
   Start-Service postgresql-x64-15
   ```

2. ポート5432が使用可能か確認
   ```powershell
   netstat -an | findstr 5432
   ```

3. `DATABASE_URL`の接続情報を確認
   - ユーザー名、パスワード、ホスト、ポート、データベース名が正しいか

### Prismaマイグレーションエラー

```powershell
# データベースをリセット（注意: データが削除されます）
npm run db:push
# または
pnpm db:push
```

### その他のエラー

- Node.jsのバージョンを確認: `node --version` (20.x推奨)
- 依存関係を再インストール: `rm -rf node_modules && npm install`（または`pnpm install`）

## データベースの確認

Prisma Studioを使用してデータベースの内容を確認できます：

```powershell
# npmを使用する場合
npm run db:studio

# pnpmを使用する場合
pnpm db:studio
```

ブラウザで [http://localhost:5555](http://localhost:5555) が自動的に開きます。

