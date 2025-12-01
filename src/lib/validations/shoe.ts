import { z } from 'zod'

export const createShoeSchema = z.object({
    brand: z.string().min(1, 'ブランド名を入力してください'),
    modelName: z.string().min(1, 'モデル名を入力してください'),
    category: z.string().min(1, 'カテゴリーを入力してください'),
    releaseYear: z.number().optional(),
    officialPrice: z.number().optional(),
    imageUrls: z.array(z.string().url()).optional().default([]),
    description: z.string().optional(),
})

export type CreateShoeInput = z.infer<typeof createShoeSchema>
