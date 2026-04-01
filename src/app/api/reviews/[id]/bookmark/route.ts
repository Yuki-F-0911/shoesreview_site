import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

// GET: ブックマーク状態を取得
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        const reviewId = params.id

        let isBookmarked = false
        if (session?.user?.id) {
            const existing = await prisma.bookmark.findUnique({
                where: {
                    reviewId_userId: {
                        reviewId,
                        userId: session.user.id,
                    },
                },
            })
            isBookmarked = !!existing
        }

        return NextResponse.json({ isBookmarked })
    } catch (error) {
        console.error('Failed to get bookmark status:', error)
        return NextResponse.json({ error: 'ブックマーク状態の取得に失敗しました' }, { status: 500 })
    }
}

// POST: ブックマークを追加
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

        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        })

        if (!review) {
            return NextResponse.json({ error: 'レビューが見つかりません' }, { status: 404 })
        }

        const existing = await prisma.bookmark.findUnique({
            where: {
                reviewId_userId: {
                    reviewId,
                    userId: session.user.id,
                },
            },
        })

        if (existing) {
            return NextResponse.json({ error: '既にブックマーク済みです' }, { status: 400 })
        }

        await prisma.bookmark.create({
            data: {
                reviewId,
                userId: session.user.id,
            },
        })

        return NextResponse.json({ isBookmarked: true })
    } catch (error) {
        console.error('Failed to add bookmark:', error)
        return NextResponse.json({ error: 'ブックマークの追加に失敗しました' }, { status: 500 })
    }
}

// DELETE: ブックマークを解除
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

        await prisma.bookmark.delete({
            where: {
                reviewId_userId: {
                    reviewId,
                    userId: session.user.id,
                },
            },
        })

        return NextResponse.json({ isBookmarked: false })
    } catch (error) {
        console.error('Failed to remove bookmark:', error)
        return NextResponse.json({ error: 'ブックマークの解除に失敗しました' }, { status: 500 })
    }
}
