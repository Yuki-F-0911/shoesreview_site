import type { CuratedSourceStatus, CuratedSourceType } from '@prisma/client'

export interface CuratedSource {
  id: string
  shoeId: string
  type: CuratedSourceType
  platform: string
  title: string
  excerpt?: string | null
  url: string
  author?: string | null
  language: string
  country?: string | null
  publishedAt?: Date | null
  thumbnailUrl?: string | null
  tags?: string[]
  reliability: number
  status: CuratedSourceStatus
  createdAt: Date
  updatedAt: Date
}


