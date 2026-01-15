/**
 * AIレビューアシストAPIエンドポイント
 * POST /api/ai/review-assist
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { generateReviewAssist } from '@/lib/ai/review-assist'
import { z } from 'zod'

const requestSchema = z.object({
    type: z.enum(['draft', 'pros_cons', 'title']),
    input: z.string().min(1, '入力が必要です').max(5000, '入力が長すぎます'),
    shoeBrand: z.string().optional(),
    shoeModel: z.string().optional(),
})

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'ログインが必要です' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const validated = requestSchema.parse(body)

        console.log('[AI Assist] Request received:', {
            type: validated.type,
            inputLength: validated.input.length,
            userId: session.user.id
        })

        const result = await generateReviewAssist({
            type: validated.type,
            input: validated.input,
            shoeBrand: validated.shoeBrand,
            shoeModel: validated.shoeModel,
        })

        console.log('[AI Assist] Success:', { type: validated.type })

        return NextResponse.json({
            success: true,
            data: result,
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'バリデーションエラー', details: error.errors },
                { status: 400 }
            )
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[AI Assist] Error:', errorMessage)

        // エラーメッセージをそのままクライアントに返す
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
}
