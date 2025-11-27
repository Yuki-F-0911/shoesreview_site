# ディレクトリ構成

## プロジェクト: シューズレビューサイト

---

## 全体構成

```
シューズレビューサイト/
├── .github/                    # GitHub設定
│   └── workflows/              # GitHub Actions
├── prisma/                     # Prismaスキーマ・マイグレーション
│   ├── migrations/             # マイグレーションファイル
│   ├── schema.prisma          # データベーススキーマ定義
│   └── seed.ts                # シードデータ
├── public/                     # 静的ファイル
│   ├── images/                # 画像ファイル
│   └── favicon.ico            # ファビコン
├── src/                       # ソースコード
│   ├── app/                   # Next.js App Router
│   ├── components/            # Reactコンポーネント
│   ├── lib/                   # ユーティリティ・ヘルパー
│   ├── types/                 # TypeScript型定義
│   ├── hooks/                 # カスタムフック
│   ├── styles/                # グローバルスタイル
│   └── constants/             # 定数定義
├── .env.example               # 環境変数テンプレート
├── .env.local                 # ローカル環境変数（gitignore）
├── .eslintrc.json            # ESLint設定
├── .gitignore                # Git除外設定
├── .prettierrc               # Prettier設定
├── next.config.js            # Next.js設定
├── package.json              # npm依存関係
├── pnpm-lock.yaml            # pnpmロックファイル
├── postcss.config.js         # PostCSS設定
├── tailwind.config.ts        # Tailwind CSS設定
├── tsconfig.json             # TypeScript設定
├── 要件定義.md               # 要件定義書
├── technologystack.md        # 技術スタック定義
└── directorystructure.md     # このファイル
```

---

## 詳細構成

### `/src/app` - Next.js App Router

```
src/app/
├── (auth)/                    # 認証関連ルート（グループ）
│   ├── login/
│   │   └── page.tsx          # ログインページ
│   ├── register/
│   │   └── page.tsx          # 登録ページ
│   └── layout.tsx            # 認証レイアウト
├── (main)/                    # メインコンテンツ（グループ）
│   ├── reviews/              # レビュー関連
│   │   ├── page.tsx          # レビュー一覧
│   │   ├── [id]/             # 動的ルート
│   │   │   ├── page.tsx      # レビュー詳細
│   │   │   └── edit/
│   │   │       └── page.tsx  # レビュー編集
│   │   └── new/
│   │       └── page.tsx      # 新規レビュー作成
│   ├── shoes/                # シューズ関連
│   │   ├── page.tsx          # シューズ一覧
│   │   └── [id]/
│   │       └── page.tsx      # シューズ詳細
│   ├── profile/              # プロフィール
│   │   ├── page.tsx          # プロフィール表示
│   │   └── edit/
│   │       └── page.tsx      # プロフィール編集
│   ├── search/               # 検索
│   │   └── page.tsx          # 検索結果
│   └── layout.tsx            # メインレイアウト
├── api/                       # API Routes
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts      # NextAuth.js設定
│   ├── reviews/
│   │   ├── route.ts          # GET/POST レビュー
│   │   └── [id]/
│   │       └── route.ts      # GET/PUT/DELETE 個別レビュー
│   ├── shoes/
│   │   ├── route.ts          # GET/POST シューズ
│   │   └── [id]/
│   │       └── route.ts      # GET シューズ詳細
│   ├── upload/
│   │   └── route.ts          # 画像アップロード
│   └── users/
│       ├── route.ts          # ユーザー一覧
│       └── [id]/
│           └── route.ts      # ユーザー詳細
├── layout.tsx                 # ルートレイアウト
├── page.tsx                   # トップページ
├── loading.tsx                # ローディングUI
├── error.tsx                  # エラーUI
└── not-found.tsx              # 404ページ
```

### `/src/components` - Reactコンポーネント

```
src/components/
├── ui/                        # 基本UIコンポーネント（再利用可能）
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Select.tsx
│   ├── Dialog.tsx
│   ├── Dropdown.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── Spinner.tsx
│   └── Toast.tsx
├── layout/                    # レイアウトコンポーネント
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Sidebar.tsx
│   └── Navigation.tsx
├── reviews/                   # レビュー関連コンポーネント
│   ├── ReviewCard.tsx        # レビューカード
│   ├── ReviewList.tsx        # レビューリスト
│   ├── ReviewDetail.tsx      # レビュー詳細
│   ├── ReviewForm.tsx        # レビューフォーム
│   ├── ReviewRating.tsx      # 評価表示
│   └── ReviewFilter.tsx      # フィルター
├── shoes/                     # シューズ関連コンポーネント
│   ├── ShoeCard.tsx
│   ├── ShoeList.tsx
│   └── ShoeDetail.tsx
├── auth/                      # 認証関連コンポーネント
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── AuthGuard.tsx
├── forms/                     # フォーム関連
│   ├── ImageUpload.tsx
│   ├── RatingInput.tsx
│   └── FormField.tsx
├── search/                    # 検索関連
│   ├── SearchBar.tsx
│   └── SearchResults.tsx
└── common/                    # 共通コンポーネント
    ├── Pagination.tsx
    ├── LoadingSpinner.tsx
    ├── ErrorMessage.tsx
    └── EmptyState.tsx
```

### `/src/lib` - ライブラリ・ユーティリティ

```
src/lib/
├── auth/                      # 認証関連
│   ├── next-auth.ts          # NextAuth設定
│   ├── auth-options.ts       # 認証オプション
│   └── session.ts            # セッション管理
├── prisma/                    # Prisma関連
│   ├── client.ts             # Prismaクライアント
│   └── queries/              # データベースクエリ
│       ├── reviews.ts
│       ├── shoes.ts
│       └── users.ts
├── api/                       # API関連
│   ├── client.ts             # APIクライアント
│   └── endpoints.ts          # エンドポイント定義
├── validations/               # バリデーションスキーマ
│   ├── review.ts             # レビューバリデーション
│   ├── shoe.ts               # シューズバリデーション
│   └── user.ts               # ユーザーバリデーション
├── utils/                     # ユーティリティ関数
│   ├── format.ts             # フォーマット関数
│   ├── date.ts               # 日付処理
│   ├── image.ts              # 画像処理
│   └── string.ts             # 文字列処理
├── cloudinary/                # Cloudinary関連
│   ├── config.ts             # 設定
│   └── upload.ts             # アップロード処理
└── config/                    # 設定ファイル
    ├── site.ts               # サイト設定
    └── constants.ts          # 定数
```

### `/src/types` - TypeScript型定義

```
src/types/
├── index.ts                   # 型エクスポート
├── review.ts                  # レビュー型
├── shoe.ts                    # シューズ型
├── user.ts                    # ユーザー型
├── api.ts                     # APIレスポンス型
└── next-auth.d.ts            # NextAuth型拡張
```

### `/src/hooks` - カスタムフック

```
src/hooks/
├── useAuth.ts                 # 認証フック
├── useReviews.ts              # レビューデータフック
├── useShoes.ts                # シューズデータフック
├── useImageUpload.ts          # 画像アップロードフック
├── useDebounce.ts             # デバウンスフック
└── useToast.ts                # トースト通知フック
```

### `/src/styles` - スタイル

```
src/styles/
├── globals.css                # グローバルCSS
└── tailwind.css              # Tailwind imports
```

### `/src/constants` - 定数

```
src/constants/
├── routes.ts                  # ルート定義
├── messages.ts                # メッセージ定義
└── options.ts                 # オプション（カテゴリー等）
```

### `/prisma` - Prismaスキーマ

```
prisma/
├── migrations/                # マイグレーションファイル
│   └── 20231117000000_init/
│       └── migration.sql
├── schema.prisma             # データベーススキーマ
└── seed.ts                   # シードデータ
```

### `/public` - 静的ファイル

```
public/
├── images/                    # 画像
│   ├── logo.svg
│   ├── hero.jpg
│   └── placeholders/
└── favicon.ico               # ファビコン
```

---

## 命名規則

### ファイル名
- **コンポーネント**: PascalCase（例: `ReviewCard.tsx`）
- **ユーティリティ**: camelCase（例: `formatDate.ts`）
- **定数**: kebab-case（例: `api-endpoints.ts`）
- **ページ**: Next.js規約に従う（`page.tsx`, `layout.tsx`）

### フォルダ名
- **kebab-case**: 基本的にケバブケース（例: `custom-hooks/`）
- **Next.js規約**: App Routerの特殊フォルダは規約に従う

### コンポーネント名
- **PascalCase**: すべてのReactコンポーネント
- **接頭辞/接尾辞**:
  - `use` - カスタムフック（例: `useAuth`）
  - `...Provider` - Contextプロバイダー
  - `...Form` - フォームコンポーネント
  - `...Card` - カード表示コンポーネント
  - `...List` - リスト表示コンポーネント

---

## インポート順序

推奨されるインポート順序：

```typescript
// 1. React / Next.js
import React from 'react'
import { useRouter } from 'next/navigation'

// 2. 外部ライブラリ
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// 3. 内部モジュール（絶対パス）
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { reviewSchema } from '@/lib/validations/review'

// 4. 型定義
import type { Review } from '@/types/review'

// 5. スタイル
import styles from './styles.module.css'
```

---

## パスエイリアス

`tsconfig.json`で設定：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/styles/*": ["./src/styles/*"]
    }
  }
}
```

使用例：
```typescript
import { Button } from '@/components/ui/Button'
import { prisma } from '@/lib/prisma/client'
import { useAuth } from '@/hooks/useAuth'
```

---

## ファイル配置ルール

### コンポーネント
- **再利用可能**: `/src/components/ui/`
- **機能特化**: `/src/components/{feature}/`
- **レイアウト**: `/src/components/layout/`

### ロジック
- **データアクセス**: `/src/lib/prisma/queries/`
- **バリデーション**: `/src/lib/validations/`
- **ユーティリティ**: `/src/lib/utils/`

### API
- **RESTful**: `/src/app/api/{resource}/route.ts`
- **ネストリソース**: `/src/app/api/{resource}/[id]/{sub-resource}/route.ts`

---

## 環境変数

### `.env.example`
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# OpenAI (Phase 2)
OPENAI_API_KEY="your-openai-key"
```

---

## .gitignore 重要項目

```gitignore
# 環境変数
.env
.env.local
.env*.local

# 依存関係
node_modules/

# Next.js
.next/
out/

# データベース
*.db
*.sqlite

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## 注意事項

### 必須ルール
1. **コンポーネントの配置**: 機能ごとにフォルダを分ける
2. **型定義の分離**: ビジネスロジックと型を分離
3. **絶対パスの使用**: `@/`エイリアスを使用
4. **適切な粒度**: コンポーネントは単一責任の原則に従う

### 禁止事項
1. **深いネスト**: 3階層以上のフォルダネストは避ける
2. **巨大ファイル**: 1ファイル500行を超える場合は分割を検討
3. **循環参照**: モジュール間の循環依存を避ける

---

## 変更履歴

| 日付 | バージョン | 変更内容 | 変更者 |
|------|-----------|---------|--------|
| 2025-11-17 | 1.0 | 初版作成 | - |

---

## 今後の拡張予定

- `/src/lib/ai/` - AI機能（Phase 2）
- `/src/lib/scraping/` - スクレイピング（Phase 2）
- `/tests/` - テストファイル
- `/docs/` - 技術ドキュメント

