import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const commentSchema = z.object({
    content: z.string().min(1, 'コメントを入力してください').max(1000, 'コメントは1000文字以内で入力してください'),
})

// GET: コメント一覧を取得
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const reviewId = params.id

        const comments = await prisma.comment.findMany({
            where: { reviewId },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        })

        return NextResponse.json({ comments })
    } catch (error) {
        console.error('Failed to get comments:', error)
        return NextResponse.json({ error: 'コメントの取得に失敗しました' }, { status: 500 })
    }
}

// POST: コメントを投稿
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
        const body = await request.json()

        // バリデーション
        const validated = commentSchema.parse(body)

        // レビューの存在確認
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        })

        if (!review) {
            return NextResponse.json({ error: 'レビューが見つかりません' }, { status: 404 })
        }

        // コメントを作成
        const comment = await prisma.comment.create({
            data: {
                reviewId,
                userId: session.user.id,
                content: validated.content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        })

        return NextResponse.json({ comment })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        console.error('Failed to create comment:', error)
        return NextResponse.json({ error: 'コメントの投稿に失敗しました' }, { status: 500 })
    }
}
