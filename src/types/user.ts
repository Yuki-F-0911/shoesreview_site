export interface User {
    id: string
    email: string
    username: string
    displayName: string
    avatarUrl?: string | null
    bio?: string | null
    createdAt: Date
    updatedAt: Date

    // ランナープロフィール
    runnerAge?: number | null
    runnerGender?: string | null
    runnerGenderPublic?: boolean
    runnerHeight?: number | null
    runnerWeight?: number | null
    runnerWeeklyDistance?: number | null
    runnerPersonalBest?: string | null
    runnerExpertise?: string[]
    runnerFootShape?: string[]
    runnerLandingType?: string | null

    // プロピッカー・認証バッジ
    isVerified?: boolean
    verifiedAt?: Date | null
    expertiseLevel?: string | null // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    verificationNote?: string | null

    // 貢献度・活動統計
    contributionScore?: number
    reviewCount?: number
    helpfulVoteCount?: number

    // カウント（リレーション集計）
    _count?: {
        followers?: number
        following?: number
        reviews?: number
    }
}

export interface UserWithFollowStatus extends User {
    isFollowing?: boolean
}

export interface CreateUserInput {
    email: string
    username: string
    displayName: string
    password: string
}

export interface UpdateUserInput {
    displayName?: string
    bio?: string
    avatarUrl?: string
    runnerAge?: number
    runnerGender?: string
    runnerGenderPublic?: boolean
    runnerHeight?: number
    runnerWeight?: number
    runnerWeeklyDistance?: number
    runnerPersonalBest?: string
    runnerExpertise?: string[]
    runnerFootShape?: string[]
    runnerLandingType?: string
}

export interface Follow {
    id: string
    followerId: string
    followingId: string
    createdAt: Date
    follower?: User
    following?: User
}

export type ExpertiseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
