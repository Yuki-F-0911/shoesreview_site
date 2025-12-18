import { z } from 'zod'

export const profileSchema = z.object({
    // ランナープロフィール
    runnerAge: z.number().min(10).max(100).optional().nullable(),
    runnerGender: z.string().optional().nullable(),
    runnerGenderPublic: z.boolean().default(true),
    runnerHeight: z.number().optional().nullable(),
    runnerWeight: z.number().optional().nullable(),
    runnerWeeklyDistance: z.number().optional().nullable(),
    runnerPersonalBest: z.string().optional().nullable(),
    runnerExpertise: z.array(z.string()).default([]),
    runnerFootShape: z.array(z.string()).default([]),
    runnerLandingType: z.string().optional().nullable(),
})

export type ProfileInput = z.infer<typeof profileSchema>
