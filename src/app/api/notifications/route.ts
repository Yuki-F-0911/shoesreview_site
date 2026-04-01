import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

// GET: 通知一覧を取得
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            include: {
                actor: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 30,
        })

        const unreadCount = await prisma.notification.count({
            where: {
                userId: session.user.id,
                isRead: false,
            },
        })

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        console.error('Failed to get notifications:', error)
        return NextResponse.json({ error: '通知の取得に失敗しました' }, { status: 500 })
    }
}

// PATCH: 通知を既読にする
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const body = await request.json()
        const { notificationIds } = body as { notificationIds?: string[] }

        if (notificationIds && notificationIds.length > 0) {
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: session.user.id,
                },
                data: { isRead: true },
            })
        } else {
            // 全件既読
            await prisma.notification.updateMany({
                where: {
                    userId: session.user.id,
                    isRead: false,
                },
                data: { isRead: true },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to mark notifications as read:', error)
        return NextResponse.json({ error: '既読の更新に失敗しました' }, { status: 500 })
    }
}
