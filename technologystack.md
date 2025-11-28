# 技術スタック定義書

## プロジェクト: シューズレビューサイト

### バージョン管理
- **Git**: 最新版
- **GitHub**: リポジトリ管理

---

## フロントエンド

### コアフレームワーク
- **Next.js**: 14.2.0
  - App Router使用
  - Server Components / Client Components
  - Server Actions
- **React**: 18.3.0
- **TypeScript**: 5.3.3

### スタイリング
- **Tailwind CSS**: 3.4.0
  - JIT (Just-In-Time) モード
- **PostCSS**: 8.4.0
- **Autoprefixer**: 10.4.0

### UIコンポーネント
- **Radix UI**: 最新版
  - アクセシブルなヘッドレスコンポーネント
  - Dialog, Dropdown, Select等
- **Lucide React**: 最新版
  - アイコンライブラリ
- **class-variance-authority (CVA)**: 最新版
  - バリアント管理
- **clsx**: 最新版
  - 条件付きクラス名

### フォーム管理
- **React Hook Form**: 7.51.0
  - フォーム状態管理
  - バリデーション
- **Zod**: 3.22.0
  - スキーマバリデーション
  - TypeScript型推論

### 状態管理
- **React Context**: 組み込み
  - グローバル状態管理（軽量な用途）
- **Zustand**: 4.5.0（必要に応じて）
  - シンプルな状態管理

### データフェッチング
- **TanStack Query (React Query)**: 5.28.0
  - サーバー状態管理
  - キャッシング
  - 再取得戦略

---

## バックエンド

### API
- **Next.js API Routes**: 14.2.0
  - RESTful API
  - Route Handlers (App Router)

### データベース
- **PostgreSQL**: 18.1.1
  - リレーショナルデータベース
  - JSON型サポート

### ORM
- **Prisma**: 5.11.0
  - Prisma Client
  - Prisma Migrate
  - Prisma Studio

### 認証
- **NextAuth.js (Auth.js)**: 5.0.0-beta
  - 認証プロバイダー
    - Credentials (メール/パスワード)
    - Google OAuth（将来的に）
  - セッション管理
  - JWT

### ファイルストレージ
- **Cloudinary**: Node SDK 2.0.0
  - 画像アップロード（既存互換用）
  - 画像変換・最適化
  - CDN配信
- **Supabase Storage**: 最新版
  - PNG画像の一次保存
  - 管理者/ユーザー投稿での利用
  - 公開URL + バケットACL管理

---

## バリデーション

### サーバーサイド
- **Zod**: 3.22.0
  - APIリクエストバリデーション
  - 型安全性

### クライアントサイド
- **Zod**: 3.22.0
  - フォームバリデーション
  - React Hook Formとの統合

---

## 開発ツール

### リンター・フォーマッター
- **ESLint**: 8.57.0
  - Next.js推奨設定
  - TypeScript対応
- **Prettier**: 3.2.0
  - コードフォーマット
  - Tailwind CSS Plugin

### 型チェック
- **TypeScript**: 5.3.3
  - strict モード有効
  - Prisma型生成

### Git Hooks
- **Husky**: 9.0.0
  - pre-commit hooks
- **lint-staged**: 15.2.0
  - ステージングファイルのリント

---

## テスト（将来的に実装）

### ユニットテスト
- **Vitest**: 最新版
  - 高速なユニットテスト
- **React Testing Library**: 最新版
  - コンポーネントテスト

### E2Eテスト
- **Playwright**: 最新版
  - エンドツーエンドテスト

---

## デプロイ・インフラ

### ホスティング
- **Vercel**: 最新版
  - Next.js最適化
  - 自動デプロイ
  - プレビュー環境
  - Edge Functions

### データベースホスティング
- **Vercel Postgres**: または
- **Supabase**: または
- **Neon**: PostgreSQLマネージドサービス

### 環境変数管理
- **.env.local**: 開発環境
- **Vercel Environment Variables**: 本番環境

---

## AI機能（Phase 2以降）

### LLM API
- **OpenAI API**: GPT-4
  - テキスト生成
  - 要約・分析
- **Anthropic Claude API**: Claude 3（代替案）

### AI統合
- **LangChain.js**: 最新版
  - LLM統合フレームワーク
  - プロンプト管理

### Webスクレイピング
- **Puppeteer**: 最新版
  - ヘッドレスブラウザ
  - 動的コンテンツ取得
- **Cheerio**: 最新版
  - HTMLパース

### ベクトルデータベース（将来的に）
- **Pinecone**: または
- **Supabase Vector**: 
  - セマンティック検索
  - 類似レビュー検索

---

## 監視・分析

### エラートラッキング
- **Sentry**: 最新版（Phase 2以降）
  - エラー監視
  - パフォーマンス監視

### アナリティクス
- **Vercel Analytics**: 組み込み
  - Web Vitals
  - ページビュー分析

---

## パッケージマネージャー

- **npm**: 10.x または
- **pnpm**: 8.x（推奨）
  - 高速インストール
  - ディスク容量節約

---

## 開発環境

### 必須ソフトウェア
- **Node.js**: 20.x LTS
- **PostgreSQL**: 18.1.1（ローカル開発）

### 推奨エディタ
- **Visual Studio Code**
  - 推奨拡張機能:
    - ESLint
    - Prettier
    - Tailwind CSS IntelliSense
    - Prisma
    - TypeScript

### ブラウザ対応
- **Chrome**: 最新版（開発推奨）
- **Firefox**: 最新版
- **Safari**: 最新版
- **Edge**: 最新版

---

## セキュリティ

### パッケージセキュリティ
- **npm audit**: 定期実行
- **Dependabot**: GitHub自動更新

### 環境変数
- **.gitignore**: .env ファイル除外
- **暗号化**: 本番環境での秘密鍵管理

---

## パフォーマンス最適化

### 画像最適化
- **Next.js Image**: next/image
  - 自動最適化
  - WebP変換
  - 遅延読み込み

### バンドル最適化
- **Next.js**: 自動コード分割
- **Dynamic Import**: 動的インポート

### キャッシング
- **React Query**: クライアントキャッシュ
- **Next.js**: ISR/SSG

---

## API・外部サービス

### 認証
- **NextAuth.js**: セッション管理

### 画像管理
- **Cloudinary**: 画像ホスティング

### メール送信（将来的に）
- **Resend**: または
- **SendGrid**: トランザクションメール

---

## バージョン管理ポリシー

### メジャーバージョン更新
- 影響範囲を確認後、チーム承認必要
- 段階的な移行計画

### マイナー・パッチ更新
- 定期的に適用
- セキュリティパッチは即座に適用

---

## 変更履歴

| 日付 | バージョン | 変更内容 | 変更者 |
|------|-----------|---------|--------|
| 2025-11-17 | 1.0 | 初版作成（MVP向け） | - |

---

## 注意事項

⚠️ **このドキュメントで定義されたバージョンは、明示的な承認なしに変更しないでください。**

バージョン変更が必要な場合は：
1. 変更理由を明確にする
2. 影響範囲を調査する
3. チーム・プロジェクトオーナーに承認を得る
4. このドキュメントを更新する

