/**
 * SEOメタデータ生成ユーティリティ
 */

import type { Metadata, Viewport } from 'next'

const SITE_NAME = 'シューズレビューサイト'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shoe-review.jp'
const DEFAULT_DESCRIPTION = 'ランニングシューズの専門レビューサイト。AIが厳選した情報源からレビューを収集・統合し、最適なシューズ選びをサポートします。'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`

/**
 * 基本のViewport設定
 */
export const baseViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
}

/**
 * 基本のメタデータ設定
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'ランニングシューズ',
    'レビュー',
    'シューズレビュー',
    'ランニング',
    'マラソン',
    'ジョギング',
    'Nike',
    'Adidas',
    'ASICS',
    'New Balance',
    'Hoka',
    'On',
    'running shoes',
    'shoe review',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
    // creator: '@your_twitter_handle',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'ja-JP': SITE_URL,
      // 'en-US': `${SITE_URL}/en`,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  other: {
    'msapplication-TileColor': '#2563eb',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
}

/**
 * シューズ詳細ページのメタデータ生成
 */
export function generateShoeMetadata(shoe: {
  id: string
  brand: string
  modelName: string
  category: string
  description?: string | null
  imageUrls?: string[]
  officialPrice?: number | null
}): Metadata {
  const title = `${shoe.brand} ${shoe.modelName}のレビュー・評価`
  const description = shoe.description
    ? shoe.description.substring(0, 155) + '...'
    : `${shoe.brand} ${shoe.modelName}（${shoe.category}）の詳細レビューと評価。実際のユーザーの声やAI統合レビューで、あなたに最適なシューズを見つけましょう。`

  const images = shoe.imageUrls && shoe.imageUrls.length > 0
    ? shoe.imageUrls
    : [DEFAULT_OG_IMAGE]

  return {
    title,
    description,
    keywords: [
      shoe.brand,
      shoe.modelName,
      `${shoe.brand} ${shoe.modelName} レビュー`,
      `${shoe.brand} ${shoe.modelName} 評価`,
      shoe.category,
      'ランニングシューズ',
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/shoes/${shoe.id}`,
      images: images.map(url => ({
        url,
        width: 800,
        height: 600,
        alt: `${shoe.brand} ${shoe.modelName}`,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
    alternates: {
      canonical: `${SITE_URL}/shoes/${shoe.id}`,
    },
  }
}

/**
 * レビュー詳細ページのメタデータ生成
 */
export function generateReviewMetadata(review: {
  id: string
  title: string | null
  content: string | null
  type: string
  shoe?: {
    brand: string
    modelName: string
  } | null
  user?: {
    displayName: string
  } | null
  imageUrls?: string[]
}): Metadata {
  const shoeInfo = review.shoe
    ? `${review.shoe.brand} ${review.shoe.modelName}`
    : ''

  const title = review.title || `${shoeInfo}のレビュー`
  const description = review.content
    ? review.content.substring(0, 155) + '...'
    : `${shoeInfo}のレビューです。`

  const authorName = review.type === 'AI_SUMMARY'
    ? 'AI統合レビュー'
    : review.user?.displayName || '匿名ユーザー'

  const images = review.imageUrls && review.imageUrls.length > 0
    ? review.imageUrls
    : [DEFAULT_OG_IMAGE]

  return {
    title,
    description,
    keywords: shoeInfo
      ? [
        shoeInfo,
        `${shoeInfo} レビュー`,
        `${shoeInfo} 評価`,
        `${shoeInfo} 口コミ`,
      ]
      : ['シューズレビュー', 'ランニングシューズ'],
    authors: [{ name: authorName }],
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/reviews/${review.id}`,
      images: images.map(url => ({
        url,
        width: 800,
        height: 600,
        alt: title,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
    alternates: {
      canonical: `${SITE_URL}/reviews/${review.id}`,
    },
  }
}

/**
 * 検索ページのメタデータ生成
 */
export function generateSearchMetadata(query?: string): Metadata {
  const title = query
    ? `「${query}」の検索結果`
    : 'シューズを検索'

  const description = query
    ? `「${query}」に関連するランニングシューズのレビューと評価を検索。`
    : 'ブランド、モデル名、カテゴリーでランニングシューズを検索。詳細なレビューと評価を確認できます。'

  return {
    title,
    description,
    robots: {
      index: !query, // 検索結果ページはインデックスしない
      follow: true,
    },
  }
}

/**
 * シューズ一覧ページのメタデータ
 */
export const shoesListMetadata: Metadata = {
  title: 'シューズ一覧',
  description: 'ランニングシューズの一覧ページ。Nike、Adidas、ASICS、New Balance、Hokaなど主要ブランドのシューズを網羅。レビューと評価を確認して最適なシューズを見つけましょう。',
  openGraph: {
    title: 'シューズ一覧 | シューズレビューサイト',
    description: 'ランニングシューズの一覧ページ。主要ブランドのシューズを網羅。',
    url: `${SITE_URL}/shoes`,
  },
  alternates: {
    canonical: `${SITE_URL}/shoes`,
  },
}

/**
 * レビュー一覧ページのメタデータ
 */
export const reviewsListMetadata: Metadata = {
  title: 'レビュー一覧',
  description: 'ランニングシューズの最新レビュー一覧。実際のユーザーレビューとAI統合レビューで、シューズの詳細な評価を確認できます。',
  openGraph: {
    title: 'レビュー一覧 | シューズレビューサイト',
    description: 'ランニングシューズの最新レビュー一覧。',
    url: `${SITE_URL}/reviews`,
  },
  alternates: {
    canonical: `${SITE_URL}/reviews`,
  },
}

