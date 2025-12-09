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
  // 詳細評価項目
  stepInToeWidth: z.number().min(1).max(5).optional(),
  stepInInstepHeight: z.number().min(1).max(5).optional(),
  stepInHeelHold: z.number().min(1).max(5).optional(),
  runLightness: z.number().min(1).max(5).optional(),
  runSinkDepth: z.number().min(1).max(5).optional(),
  runStability: z.number().min(1).max(5).optional(),
  runTransition: z.number().min(1).max(5).optional(),
  runResponse: z.number().min(1).max(5).optional(),
  fatigueSole: z.string().optional(),
  fatigueCalf: z.string().optional(),
  fatigueKnee: z.string().optional(),
  fatigueOther: z.string().optional(),
  sdLanding: z.number().min(1).max(5).optional(),
  sdResponse: z.number().min(1).max(5).optional(),
  sdStability: z.number().min(1).max(5).optional(),
  sdWidth: z.number().min(1).max(5).optional(),
  sdDesign: z.number().min(1).max(5).optional(),
  onomatopoeia: z.string().optional(),
  purchaseSize: z.string().optional(),
  // レビュアー属性
  reviewerGender: z.string().optional(),
  reviewerHeight: z.number().optional(),
  reviewerWeight: z.number().optional(),
  reviewerWeeklyDistance: z.number().optional(),
  reviewerPersonalBest: z.string().optional(),
  reviewerExpertise: z.string().optional(),
  reviewerFootShape: z.string().optional(),
  reviewerLandingType: z.string().optional(),
})

export type ReviewInput = z.infer<typeof reviewSchema>

