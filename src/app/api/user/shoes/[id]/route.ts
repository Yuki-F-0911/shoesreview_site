/**
 * 個別シューズ管理API
 * GET /api/user/shoes/[id] - シューズ詳細取得
 * PUT /api/user/shoes/[id] - シューズ更新
 * DELETE /api/user/shoes/[id] - シューズ削除（論理削除）
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const updateShoeSchema = z.object({
    name: z.string().min(1).optional(),
    brand: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    shoeId: z.string().nullable().optional(),
    maxDistance: z.number().min(0).optional(),
    purchaseDate: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    retired: z.boolean().optional(),
})

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * シューズ詳細を取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        const { id } = await params

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'ログインが必要です' },
                { status: 401 }
            )
        }

        const shoe = await prisma.userShoe.findFirst({
            where: {
                id,
                userId: session.user.id,
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
                activities: {
                    orderBy: {
                        activityDate: 'desc',
                    },
                    take: 10,
                },
                _count: {
                    select: {
                        activities: true,
                    },
                },
            },
        })

        if (!shoe) {
            return NextResponse.json(
                { error: 'シューズが見つかりません' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                ...shoe,
                progressPercent: Math.min(100, (shoe.totalDistance / shoe.maxDistance) * 100),
                isNearReplacement: shoe.totalDistance >= shoe.maxDistance * 0.8,
                needsReplacement: shoe.totalDistance >= shoe.maxDistance,
            },
        })
    } catch (error) {
        console.error('シューズ詳細取得エラー:', error)
        return NextResponse.json(
            { error: 'シューズ詳細の取得に失敗しました' },
            { status: 500 }
        )
    }
}

/**
 * シューズを更新
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        const { id } = await params

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'ログインが必要です' },
                { status: 401 }
            )
        }

        // 所有者チェック
        const existing = await prisma.userShoe.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        })

        if (!existing) {
            return NextResponse.json(
                { error: 'シューズが見つかりません' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const validated = updateShoeSchema.parse(body)

        const updateData: Record<string, unknown> = {}

        if (validated.name !== undefined) updateData.name = validated.name
        if (validated.brand !== undefined) updateData.brand = validated.brand
        if (validated.model !== undefined) updateData.model = validated.model
        if (validated.shoeId !== undefined) updateData.shoeId = validated.shoeId
        if (validated.maxDistance !== undefined) updateData.maxDistance = validated.maxDistance
        if (validated.imageUrl !== undefined) updateData.imageUrl = validated.imageUrl
        if (validated.notes !== undefined) updateData.notes = validated.notes

        if (validated.purchaseDate !== undefined) {
            updateData.purchaseDate = validated.purchaseDate
                ? new Date(validated.purchaseDate)
                : null
        }

        if (validated.retired !== undefined) {
            updateData.retiredAt = validated.retired ? new Date() : null
        }

        const shoe = await prisma.userShoe.update({
            where: { id },
            data: updateData,
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

        console.error('シューズ更新エラー:', error)
        return NextResponse.json(
            { error: 'シューズの更新に失敗しました' },
            { status: 500 }
        )
    }
}

/**
 * シューズを削除（論理削除 = 引退）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        const { id } = await params

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'ログインが必要です' },
                { status: 401 }
            )
        }

        // 所有者チェック
        const existing = await prisma.userShoe.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        })

        if (!existing) {
            return NextResponse.json(
                { error: 'シューズが見つかりません' },
                { status: 404 }
            )
        }

        // 論理削除（引退フラグを設定）
        await prisma.userShoe.update({
            where: { id },
            data: {
                retiredAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            message: 'シューズを引退させました',
        })
    } catch (error) {
        console.error('シューズ削除エラー:', error)
        return NextResponse.json(
            { error: 'シューズの削除に失敗しました' },
            { status: 500 }
        )
    }
}
