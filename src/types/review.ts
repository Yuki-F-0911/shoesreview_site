import type { User } from './user'
import type { Shoe } from './shoe'

export interface Review {
  id: string
  shoeId: string
  userId: string | null // AI要約の場合はnull
  type: string // Prismaから返される型に合わせてstring型に変更
  overallRating: number
  comfortRating?: number | null
  designRating?: number | null
  durabilityRating?: number | null
  title: string
  content: string
  imageUrls: string[]
  usagePeriod?: string | null
  usageScene: string[]
  pros: string[]
  cons: string[]
  recommendedFor?: string | null // AI要約の場合の推奨ランナータイプ
  sourceCount?: number // 情報源の数（AI要約の場合）
  // isPublished, isDraft removed
  createdAt: Date
  updatedAt: Date
  shoe?: Shoe
  user?: User | null // nullableに修正
  _count?: {
    likes: number
    comments: number
  }
}

export interface CreateReviewInput {
  shoeId: string
  overallRating: number
  comfortRating?: number
  designRating?: number
  durabilityRating?: number
  title: string
  content: string
  imageUrls?: string[]
  usagePeriod?: string
  usageScene?: string[]
  pros?: string[]
  cons?: string[]
  // isDraft removed
}

export interface UpdateReviewInput {
  overallRating?: number
  comfortRating?: number
  designRating?: number
  durabilityRating?: number
  title?: string
  content?: string
  imageUrls?: string[]
  usagePeriod?: string
  usageScene?: string[]
  pros?: string[]
  cons?: string[]
  // isPublished, isDraft removed
}

export interface AISource {
  id: string
  reviewId: string
  sourceType: string
  sourceUrl: string
  scrapedAt: Date
  reliability: number
}

