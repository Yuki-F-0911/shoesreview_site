import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

// GET: いいね状態を取得
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        const reviewId = params.id

        // いいね数を取得
        const likeCount = await prisma.like.count({
            where: { reviewId },
        })

        // ログインユーザーがいいね済みかどうか
        let isLiked = false
        if (session?.user?.id) {
            const existingLike = await prisma.like.findUnique({
                where: {
                    reviewId_userId: {
                        reviewId,
                        userId: session.user.id,
                    },
                },
            })
            isLiked = !!existingLike
        }

        return NextResponse.json({ likeCount, isLiked })
    } catch (error) {
        console.error('Failed to get like status:', error)
        return NextResponse.json({ error: 'いいね状態の取得に失敗しました' }, { status: 500 })
    }
}

// POST: いいねを追加
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const reviewId = params.id

        // レビューの存在確認
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        })

        if (!review) {
            return NextResponse.json({ error: 'レビューが見つかりません' }, { status: 404 })
        }

        // 既にいいね済みかチェック
        const existingLike = await prisma.like.findUnique({
            where: {
                reviewId_userId: {
                    reviewId,
                    userId: session.user.id,
                },
            },
        })

        if (existingLike) {
            return NextResponse.json({ error: '既にいいね済みです' }, { status: 400 })
        }

        // いいねを追加
        await prisma.like.create({
            data: {
                reviewId,
                userId: session.user.id,
            },
        })

        // 新しいいいね数を取得
        const likeCount = await prisma.like.count({
            where: { reviewId },
        })

        return NextResponse.json({ likeCount, isLiked: true })
    } catch (error) {
        console.error('Failed to add like:', error)
        return NextResponse.json({ error: 'いいねの追加に失敗しました' }, { status: 500 })
    }
}

// DELETE: いいねを解除
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const reviewId = params.id

        // いいねを削除
        await prisma.like.delete({
            where: {
                reviewId_userId: {
                    reviewId,
                    userId: session.user.id,
                },
            },
        })

        // 新しいいいね数を取得
        const likeCount = await prisma.like.count({
            where: { reviewId },
        })

        return NextResponse.json({ likeCount, isLiked: false })
    } catch (error) {
        console.error('Failed to remove like:', error)
        return NextResponse.json({ error: 'いいねの解除に失敗しました' }, { status: 500 })
    }
}
