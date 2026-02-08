export interface Shoe {
    id: string
    brand: string
    modelName: string
    category: string
    releaseYear?: number | null
    officialPrice?: number | null
    imageUrls: string[]
    keywords?: string[]
    locale?: string
    region?: string
    description?: string | null
    createdAt: Date
    updatedAt: Date

    // マスタデータ拡張
    isOfficialData?: boolean
    officialDescription?: string | null
    specifications?: unknown // 詳細スペック - Prisma JsonValue互換
    targetRunner?: string[]
    releaseDate?: Date | null
    isMinorModel?: boolean
    registeredByUserId?: string | null
    registrationStatus?: string // pending, approved, rejected

    // カウント（リレーション集計）
    _count?: {
        reviews?: number
    }
}

export interface CreateShoeInput {
    brand: string
    modelName: string
    category: string
    releaseYear?: number
    officialPrice?: number
    imageUrls?: string[]
    description?: string
    targetRunner?: string[]
    isMinorModel?: boolean
}

export interface UpdateShoeInput {
    brand?: string
    modelName?: string
    category?: string
    releaseYear?: number
    officialPrice?: number
    imageUrls?: string[]
    description?: string
    targetRunner?: string[]
    isMinorModel?: boolean
    specifications?: Record<string, unknown>
}

export interface ShoeSpecifications {
    weight?: number // グラム
    drop?: number // ミリ
    stackHeight?: {
        forefoot?: number
        heel?: number
    }
    upperMaterial?: string
    midsoleMaterial?: string
    outsoleMaterial?: string
}
