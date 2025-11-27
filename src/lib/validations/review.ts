import { z } from 'zod'

export const reviewSchema = z.object({
  shoeId: z.string().min(1, 'シューズを選択してください'),
  overallRating: z.number().min(0).max(10),
  comfortRating: z.number().min(0).max(10).optional(),
  designRating: z.number().min(0).max(10).optional(),
  durabilityRating: z.number().min(0).max(10).optional(),
  title: z.string().min(1, 'タイトルを入力してください').max(200, 'タイトルは200文字以内で入力してください'),
  content: z.string().min(10, 'レビュー本文は10文字以上で入力してください').max(5000, 'レビュー本文は5000文字以内で入力してください'),
  imageUrls: z.array(z.string().url()).optional().default([]),
  usagePeriod: z.string().optional(),
  usageScene: z.array(z.string()).default([]),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  isDraft: z.boolean().default(false),
})

export type ReviewInput = z.infer<typeof reviewSchema>

