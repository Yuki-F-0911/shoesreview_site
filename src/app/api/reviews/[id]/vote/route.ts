import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { auth } from '@/lib/auth/auth'

// POST: レビューに投票
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'ログインが必要です' },
                { status: 401 }
            )
        }

        const reviewId = params.id
        const userId = session.user.id
        const body = await request.json()
        const { isHelpful } = body

        if (typeof isHelpful !== 'boolean') {
            return NextResponse.json(
                { error: 'isHelpful は boolean である必要があります' },
                { status: 400 }
            )
        }

        // レビューが存在するか確認
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        })

        if (!review) {
            return NextResponse.json(
                { error: 'レビューが見つかりません' },
                { status: 404 }
            )
        }

        // 自分のレビューには投票できない
        if (review.userId === userId) {
            return NextResponse.json(
                { error: '自分のレビューには投票できません' },
                { status: 400 }
            )
        }

        // 既存の投票を確認
        const existingVote = await prisma.reviewVote.findUnique({
            where: {
                reviewId_userId: {
                    reviewId,
                    userId,
                },
            },
        })

        let vote
        let helpfulDelta = 0
        let notHelpfulDelta = 0

        if (existingVote) {
            // 投票を更新
            if (existingVote.isHelpful !== isHelpful) {
                vote = await prisma.reviewVote.update({
                    where: { id: existingVote.id },
                    data: { isHelpful },
                })
                helpfulDelta = isHelpful ? 1 : -1
                notHelpfulDelta = isHelpful ? -1 : 1
            } else {
                vote = existingVote
            }
        } else {
            // 新規投票
            vote = await prisma.reviewVote.create({
                data: {
                    reviewId,
                    userId,
                    isHelpful,
                },
            })
            helpfulDelta = isHelpful ? 1 : 0
            notHelpfulDelta = isHelpful ? 0 : 1
        }

        // レビューのカウントを更新
        if (helpfulDelta !== 0 || notHelpfulDelta !== 0) {
            await prisma.review.update({
                where: { id: reviewId },
                data: {
                    helpfulCount: { increment: helpfulDelta },
                    notHelpfulCount: { increment: notHelpfulDelta },
                },
            })

            // レビュー投稿者の貢献度スコアを更新
            if (review.userId && helpfulDelta > 0) {
                await prisma.user.update({
                    where: { id: review.userId },
                    data: {
                        helpfulVoteCount: { increment: 1 },
                        contributionScore: { increment: 5 },
                    },
                })
            }
        }

        return NextResponse.json({
            success: true,
            vote,
        })
    } catch (error) {
        console.error('Vote error:', error)
        return NextResponse.json(
            { error: '投票に失敗しました' },
            { status: 500 }
        )
    }
}

// DELETE: 投票を取り消し
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'ログインが必要です' },
                { status: 401 }
            )
        }

        const reviewId = params.id
        const userId = session.user.id

        // 既存の投票を確認
        const existingVote = await prisma.reviewVote.findUnique({
            where: {
                reviewId_userId: {
                    reviewId,
                    userId,
                },
            },
        })

        if (!existingVote) {
            return NextResponse.json(
                { error: '投票が見つかりません' },
                { status: 404 }
            )
        }

        // 投票を削除
        await prisma.reviewVote.delete({
            where: { id: existingVote.id },
        })

        // レビューのカウントを更新
        await prisma.review.update({
            where: { id: reviewId },
            data: {
                helpfulCount: { decrement: existingVote.isHelpful ? 1 : 0 },
                notHelpfulCount: { decrement: existingVote.isHelpful ? 0 : 1 },
            },
        })

        return NextResponse.json({
            success: true,
            message: '投票を取り消しました',
        })
    } catch (error) {
        console.error('Delete vote error:', error)
        return NextResponse.json(
            { error: '投票の取り消しに失敗しました' },
            { status: 500 }
        )
    }
}

// GET: 自分の投票状態を取得
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ vote: null })
        }

        const reviewId = params.id
        const userId = session.user.id

        const vote = await prisma.reviewVote.findUnique({
            where: {
                reviewId_userId: {
                    reviewId,
                    userId,
                },
            },
        })

        return NextResponse.json({ vote })
    } catch (error) {
        console.error('Get vote error:', error)
        return NextResponse.json(
            { error: '投票状態の取得に失敗しました' },
            { status: 500 }
        )
    }
}
