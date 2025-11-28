import type { MediaStatus, ShoeMediaSource } from '@prisma/client'

export interface ShoeMedia {
  id: string
  shoeId: string
  storagePath: string
  publicUrl: string
  altText?: string | null
  sourceType: ShoeMediaSource
  status: MediaStatus
  width?: number | null
  height?: number | null
  fileSize?: number | null
  dominantColor?: string | null
  tags: string[]
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}


