import { prisma } from '@/lib/prisma/client'

type NotificationType = 'like' | 'comment' | 'follow'

export async function createNotification({
    type,
    userId,
    actorId,
    reviewId,
    message,
}: {
    type: NotificationType
    userId: string
    actorId: string
    reviewId?: string
    message: string
}) {
    // 自分自身への通知は作成しない
    if (userId === actorId) return

    await prisma.notification.create({
        data: {
            type,
            userId,
            actorId,
            reviewId,
            message,
        },
    })
}
