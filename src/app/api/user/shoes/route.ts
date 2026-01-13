/**
 * ユーザーシューズ管理API
 * GET /api/user/shoes - シューズ一覧取得
 * POST /api/user/shoes - シューズ登録
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const createShoeSchema = z.object({
    name: z.string().min(1, 'シューズ名を入力してください'),
    brand: z.string().min(1, 'ブランドを入力してください'),
    model: z.string().min(1, 'モデル名を入力してください'),
    shoeId: z.string().optional(),
    maxDistance: z.number().min(0).default(800),
    purchaseDate: z.string().optional(),
    imageUrl: z.string().optional(),
    notes: z.string().optional(),
})

/**
 * ユーザーのシューズ一覧を取得
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'ログインが必要です' },
                { status: 401 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const includeRetired = searchParams.get('includeRetired') === 'true'

        const shoes = await prisma.userShoe.findMany({
            where: {
                userId: session.user.id,
                ...(includeRetired ? {} : { retiredAt: null }),
            },
            include: {
                shoe: {
                    select: {
                        id: true,
                        brand: true,
                        modelName: true,
                        imageUrls: true,
                    },
                },
                _count: {
                    select: {
                        activities: true,
                    },
                },
            },
            orderBy: [
                { retiredAt: 'asc' },
                { totalDistance: 'desc' },
            ],
        })

        // 交換目安に対する進捗率を計算
        const shoesWithProgress = shoes.map((shoe) => ({
            ...shoe,
            progressPercent: Math.min(100, (shoe.totalDistance / shoe.maxDistance) * 100),
            isNearReplacement: shoe.totalDistance >= shoe.maxDistance * 0.8,
            needsReplacement: shoe.totalDistance >= shoe.maxDistance,
        }))

        return NextResponse.json({
            success: true,
            data: shoesWithProgress,
        })
    } catch (error) {
        console.error('シューズ一覧取得エラー:', error)
        return NextResponse.json(
            { error: 'シューズ一覧の取得に失敗しました' },
            { status: 500 }
        )
    }
}

/**
 * シューズを登録
 */
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
        const validated = createShoeSchema.parse(body)

        const shoe = await prisma.userShoe.create({
            data: {
                userId: session.user.id,
                name: validated.name,
                brand: validated.brand,
                model: validated.model,
                shoeId: validated.shoeId,
                maxDistance: validated.maxDistance,
                purchaseDate: validated.purchaseDate
                    ? new Date(validated.purchaseDate)
                    : null,
                imageUrl: validated.imageUrl,
                notes: validated.notes,
            },
        })

        return NextResponse.json({
            success: true,
            data: shoe,
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'バリデーションエラー', details: error.errors },
                { status: 400 }
            )
        }

        console.error('シューズ登録エラー:', error)
        return NextResponse.json(
            { error: 'シューズの登録に失敗しました' },
            { status: 500 }
        )
    }
}
