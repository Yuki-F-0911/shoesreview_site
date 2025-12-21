import { z } from 'zod'

export const reviewSchema = z.object({
  shoeId: z.string().min(1, 'シューズを選択してください'),
  overallRating: z.number().min(0).max(10),
  comfortRating: z.number().min(0).max(10).optional(),
  designRating: z.number().min(0).max(10).optional(),
  durabilityRating: z.number().min(0).max(10).optional(),
  lightnessRating: z.number().min(0).max(10).optional(),
  stabilityRating: z.number().min(0).max(10).optional(),
  cushioningRating: z.number().min(0).max(10).optional(),
  gripRating: z.number().min(0).max(10).optional(),
  responsivenessRating: z.number().min(0).max(10).optional(),
  // 簡易入力モードではtitle/contentは任意（空の場合はquickCommentから生成）
  title: z.string().max(200, 'タイトルは200文字以内で入力してください').optional().default(''),
  content: z.string().max(5000, 'レビュー本文は5000文字以内で入力してください').optional().default(''),
  imageUrls: z.array(z.string().url()).optional().default([]),
  usagePeriod: z.string().optional(),
  usageScene: z.array(z.string()).default([]),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  // 簡易レビュー用のコメント（どんな時に使っているか）
  quickComment: z.string().optional(),
  // 詳細評価項目（1-10スケール）
  stepInToeWidth: z.number().min(1).max(10).optional(),
  stepInInstepHeight: z.number().min(1).max(10).optional(),
  stepInHeelHold: z.number().min(1).max(10).optional(),
  // 疲労感（数値：1=強く感じる, 10=感じない）
  fatigueSole: z.number().min(1).max(10).optional(),
  fatigueCalf: z.number().min(1).max(10).optional(),
  fatigueKnee: z.number().min(1).max(10).optional(),
  fatigueOther: z.string().optional(),
  onomatopoeia: z.string().optional(),
  purchaseSize: z.string().optional(),
  // レビュアー属性
  reviewerAge: z.number().min(10).max(100).optional(),
  reviewerGender: z.string().optional(),
  // 身長・体重は範囲選択（プライバシー保護）
  reviewerHeightRange: z.string().optional(),
  reviewerWeightRange: z.string().optional(),
  reviewerWeeklyDistance: z.number().optional(),
  // 自己ベストは範囲選択（プライバシー保護）
  reviewerPersonalBestLevel: z.string().optional(),
  reviewerExpertise: z.array(z.string()).default([]),
  reviewerFootShape: z.array(z.string()).default([]),
  reviewerFootShapeDetail: z.string().optional(),
  reviewerLandingType: z.string().optional(),
  reviewerLandingTypeDetail: z.string().optional(),
})


export type ReviewInput = z.infer<typeof reviewSchema>

