import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { auth } from '@/lib/auth/auth'

// GET: フォロー中のユーザー一覧を取得
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id
        const session = await auth()
        const currentUserId = session?.user?.id

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        // ユーザーが存在するか確認
        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'ユーザーが見つかりません' },
                { status: 404 }
            )
        }

        // フォロー中のユーザーを取得
        const [following, total] = await Promise.all([
            prisma.follow.findMany({
                where: { followerId: userId },
                include: {
                    following: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatarUrl: true,
                            bio: true,
                            isVerified: true,
                            expertiseLevel: true,
                            runnerExpertise: true,
                            _count: {
                                select: {
                                    reviews: true,
                                    followers: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.follow.count({
                where: { followerId: userId },
            }),
        ])

        // 現在のユーザーがフォローしているか確認（自分以外を見ている場合）
        let followingIds: string[] = []
        if (currentUserId && currentUserId !== userId) {
            const myFollowing = await prisma.follow.findMany({
                where: {
                    followerId: currentUserId,
                    followingId: {
                        in: following.map((f) => f.following.id),
                    },
                },
                select: { followingId: true },
            })
            followingIds = myFollowing.map((f) => f.followingId)
        }

        const followingWithStatus = following.map((f) => ({
            ...f.following,
            isFollowing:
                currentUserId === userId ? true : followingIds.includes(f.following.id),
            followedAt: f.createdAt,
        }))

        return NextResponse.json({
            following: followingWithStatus,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Get following error:', error)
        return NextResponse.json(
            { error: 'フォロー中ユーザーの取得に失敗しました' },
            { status: 500 }
        )
    }
}
