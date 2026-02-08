import type { User } from './user'
import type { Shoe } from './shoe'
import type { Review } from './review'

// シューズレコメンド結果
export interface ShoeRecommendation {
    id: string
    userId: string
    shoeId: string
    matchScore: number // 0-100
    reasons: string[]
    similarUserIds: string[]
    createdAt: Date
    updatedAt: Date
    user?: User
    shoe?: Shoe
}

// レコメンドAPIレスポンス
export interface ShoeRecommendationResponse {
    recommendations: {
        shoe: Shoe
        matchScore: number
        reasons: string[]
        similarUserCount: number
        averageRating: number
        sampleReviews?: Review[]
    }[]
    analysisNote: string
    profileCompleteness: number // 0-100: プロフィール完成度
}

// 類似ユーザー検索結果
export interface SimilarUser {
    user: User
    similarityScore: number // 0-100
    matchingCriteria: {
        height: boolean
        weight: boolean
        footShape: boolean
        landingType: boolean
        expertise: boolean
        personalBest: boolean
    }
}

// マッチング基準
export interface MatchingCriteria {
    runnerHeight?: number
    runnerWeight?: number
    runnerFootShape?: string[]
    runnerLandingType?: string
    runnerExpertise?: string[]
    runnerPersonalBest?: string
}

// プロフィール完成度チェック
export interface ProfileCompleteness {
    overall: number // 0-100
    fields: {
        height: boolean
        weight: boolean
        footShape: boolean
        landingType: boolean
        expertise: boolean
        personalBest: boolean
    }
    missingFields: string[]
    isRecommendationReady: boolean
}

// レコメンド生成リクエスト
export interface GenerateRecommendationRequest {
    forceRefresh?: boolean
}
