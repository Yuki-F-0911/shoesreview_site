/**
 * キュレーション機能の型定義
 */

export type SourceType = 
  | 'AMAZON'
  | 'RAKUTEN'
  | 'YAHOO_SHOPPING'
  | 'KAKAKU'
  | 'REDDIT'
  | 'TWITTER'
  | 'INSTAGRAM'
  | 'YOUTUBE'
  | 'WEB_ARTICLE'
  | 'OFFICIAL'

export interface CuratedReview {
  id: string
  sourceType: SourceType
  sourceUrl: string
  sourceTitle?: string
  sourceAuthor?: string
  content: string
  rating?: number // 1-5 or 1-10 depending on source
  ratingScale: number // 5 or 10
  normalizedRating: number // 0-10 scale
  reviewerName?: string
  reviewDate?: Date
  helpfulCount?: number
  imageUrls: string[]
  pros: string[]
  cons: string[]
  verifiedPurchase?: boolean
  locale: string // 'ja', 'en', etc.
  sentiment?: 'positive' | 'neutral' | 'negative'
  relevanceScore: number // 0-1
  collectedAt: Date
}

export interface ProductInfo {
  asin?: string // Amazon
  jan?: string // JAN code
  itemCode?: string // 楽天、Yahoo等
  brand: string
  modelName: string
  price?: number
  currency: string
  availability?: 'in_stock' | 'out_of_stock' | 'preorder'
  imageUrl?: string
  productUrl: string
  sourceType: SourceType
}

export interface AggregatedReviewData {
  shoeId: string
  brand: string
  modelName: string
  totalReviews: number
  averageRating: number // 0-10 scale
  ratingDistribution: {
    rating: number
    count: number
    percentage: number
  }[]
  commonPros: string[]
  commonCons: string[]
  recommendedFor: string[]
  sources: {
    type: SourceType
    count: number
    avgRating: number
    url?: string
  }[]
  priceRange: {
    min: number
    max: number
    currency: string
    sources: {
      type: SourceType
      price: number
      url: string
    }[]
  }
  reviews: CuratedReview[]
  lastUpdated: Date
}

export interface CurationSearchParams {
  brand: string
  modelName: string
  maxResults?: number
  sources?: SourceType[]
  locale?: string
  includeImages?: boolean
}

export interface CurationResult {
  success: boolean
  data?: AggregatedReviewData
  errors?: string[]
  warnings?: string[]
}

// API設定
export interface APIConfig {
  rakuten?: {
    applicationId: string
    affiliateId?: string
  }
  amazon?: {
    accessKeyId: string
    secretAccessKey: string
    partnerTag: string
    region: string
  }
  reddit?: {
    clientId: string
    clientSecret: string
    userAgent: string
  }
  twitter?: {
    bearerToken: string
  }
  youtube?: {
    apiKey: string
  }
}

