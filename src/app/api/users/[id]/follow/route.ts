import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { auth } from '@/lib/auth/auth'

// POST: ユーザーをフォロー
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

        const followingId = params.id
        const followerId = session.user.id

        // 自分自身をフォローしようとした場合
        if (followerId === followingId) {
            return NextResponse.json(
                { error: '自分自身をフォローすることはできません' },
                { status: 400 }
            )
        }

        // フォロー対象のユーザーが存在するか確認
        const targetUser = await prisma.user.findUnique({
            where: { id: followingId },
        })

        if (!targetUser) {
            return NextResponse.json(
                { error: 'ユーザーが見つかりません' },
                { status: 404 }
            )
        }

        // 既にフォローしているか確認
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        })

        if (existingFollow) {
            return NextResponse.json(
                { error: '既にフォローしています' },
                { status: 400 }
            )
        }

        // フォローを作成
        const follow = await prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
        })

        return NextResponse.json({
            success: true,
            follow,
        })
    } catch (error) {
        console.error('Follow error:', error)
        return NextResponse.json(
            { error: 'フォローに失敗しました' },
            { status: 500 }
        )
    }
}

// DELETE: フォロー解除
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

        const followingId = params.id
        const followerId = session.user.id

        // フォロー関係を削除
        const deleted = await prisma.follow.deleteMany({
            where: {
                followerId,
                followingId,
            },
        })

        if (deleted.count === 0) {
            return NextResponse.json(
                { error: 'フォローしていません' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'フォローを解除しました',
        })
    } catch (error) {
        console.error('Unfollow error:', error)
        return NextResponse.json(
            { error: 'フォロー解除に失敗しました' },
            { status: 500 }
        )
    }
}
