import type { User } from './user'
import type { Shoe } from './shoe'

export interface Review {
    id: string
    shoeId: string
    userId: string | null // AI要約の場合はnull
    type: string // Prismaから返される型に合わせてstring型に変更
    postedAt?: Date
    overallRating: number
    comfortRating?: number | null
    designRating?: number | null
    durabilityRating?: number | null
    lightnessRating?: number | null
    stabilityRating?: number | null
    cushioningRating?: number | null
    gripRating?: number | null
    responsivenessRating?: number | null
    title?: string | null
    content?: string | null
    quickComment?: string | null
    imageUrls: string[]
    usagePeriod?: string | null
    usageScene: string[]
    pros: string[]
    cons: string[]
    recommendedFor?: string | null // AI要約の場合の推奨ランナータイプ
    sourceCount?: number // 情報源の数（AI要約の場合）

    // 使用条件の詳細メタデータ
    totalDistanceKm?: number | null
    usageMonths?: number | null
    terrainType?: string[]
    weatherConditions?: string[]

    // レビューの有用性スコア
    helpfulCount?: number
    notHelpfulCount?: number

    createdAt: Date
    updatedAt: Date
    shoe?: Shoe
    user?: User | null // nullableに修正
    _count?: {
        likes: number
        comments: number
        reviewVotes?: number
    }
}

export interface CreateReviewInput {
    shoeId: string
    overallRating: number
    comfortRating?: number
    designRating?: number
    durabilityRating?: number
    lightnessRating?: number
    stabilityRating?: number
    cushioningRating?: number
    gripRating?: number
    responsivenessRating?: number
    title?: string
    content?: string
    quickComment?: string
    imageUrls?: string[]
    usagePeriod?: string
    usageScene?: string[]
    pros?: string[]
    cons?: string[]
    totalDistanceKm?: number
    usageMonths?: number
    terrainType?: string[]
    weatherConditions?: string[]
}

export interface UpdateReviewInput {
    overallRating?: number
    comfortRating?: number
    designRating?: number
    durabilityRating?: number
    lightnessRating?: number
    stabilityRating?: number
    cushioningRating?: number
    gripRating?: number
    responsivenessRating?: number
    title?: string
    content?: string
    quickComment?: string
    imageUrls?: string[]
    usagePeriod?: string
    usageScene?: string[]
    pros?: string[]
    cons?: string[]
    totalDistanceKm?: number
    usageMonths?: number
    terrainType?: string[]
    weatherConditions?: string[]
}

export interface AISource {
    id: string
    reviewId: string
    sourceType: string
    sourceUrl: string
    sourceTitle?: string | null
    sourceAuthor?: string | null
    youtubeVideoId?: string | null
    summary?: string | null
    scrapedAt: Date
    reliability: number
}

export interface ReviewVote {
    id: string
    reviewId: string
    userId: string
    isHelpful: boolean
    createdAt: Date
    user?: User
}

export interface ReviewWithVoteStatus extends Review {
    userVote?: ReviewVote | null
}
