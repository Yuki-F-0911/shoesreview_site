/**
 * 音声レビューAI解析APIエンドポイント
 * POST /api/ai/voice-review
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { analyzeVoiceReview } from '@/lib/ai/voice-review'
import { z } from 'zod'

const requestSchema = z.object({
    voiceText: z.string().min(10, '音声テキストが短すぎます').max(10000, '音声テキストが長すぎます'),
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

        console.log('[Voice Review] Request received:', {
            textLength: validated.voiceText.length,
            userId: session.user.id,
            shoe: validated.shoeBrand && validated.shoeModel
                ? `${validated.shoeBrand} ${validated.shoeModel}`
                : 'not specified',
        })

        const result = await analyzeVoiceReview(
            validated.voiceText,
            validated.shoeBrand,
            validated.shoeModel,
        )

        console.log('[Voice Review] Success')

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
        console.error('[Voice Review] Error:', errorMessage)

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
}
