export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SearchParams {
  query?: string
  brand?: string
  category?: string
  minRating?: number
  maxPrice?: number
  minPrice?: number
  sortBy?: 'newest' | 'rating' | 'popular'
  page?: number
  pageSize?: number
}

