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
}

export interface CreateShoeInput {
  brand: string
  modelName: string
  category: string
  releaseYear?: number
  officialPrice?: number
  imageUrls?: string[]
  description?: string
}

export interface UpdateShoeInput {
  brand?: string
  modelName?: string
  category?: string
  releaseYear?: number
  officialPrice?: number
  imageUrls?: string[]
  description?: string
}

