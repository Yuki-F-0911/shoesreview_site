/**
 * Strava OAuth認証ヘルパー
 */

import { prisma } from '@/lib/prisma/client'
import { refreshAccessToken } from './client'

/**
 * ユーザーのStrava連携情報を取得
 * トークンが期限切れの場合は自動的にリフレッシュ
 */
export async function getStravaIntegration(userId: string) {
    const integration = await prisma.userIntegration.findUnique({
        where: {
            userId_provider: {
                userId,
                provider: 'strava',
            },
        },
    })

    if (!integration) {
        return null
    }

    // トークンが期限切れかチェック（5分のマージンを持たせる）
    const now = new Date()
    const expiresAt = new Date(integration.expiresAt)
    const fiveMinutes = 5 * 60 * 1000

    if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
        // トークンをリフレッシュ
        try {
            const newTokens = await refreshAccessToken(integration.refreshToken)

            // DBを更新
            const updated = await prisma.userIntegration.update({
                where: {
                    userId_provider: {
                        userId,
                        provider: 'strava',
                    },
                },
                data: {
                    accessToken: newTokens.access_token,
                    refreshToken: newTokens.refresh_token,
                    expiresAt: new Date(newTokens.expires_at * 1000),
                },
            })

            return updated
        } catch (error) {
            console.error('Stravaトークンリフレッシュエラー:', error)
            // リフレッシュに失敗した場合は連携を削除
            await prisma.userIntegration.delete({
                where: {
                    userId_provider: {
                        userId,
                        provider: 'strava',
                    },
                },
            })
            return null
        }
    }

    return integration
}

/**
 * Strava連携を保存
 */
export async function saveStravaIntegration(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
    providerUserId?: string,
    scope?: string
) {
    return prisma.userIntegration.upsert({
        where: {
            userId_provider: {
                userId,
                provider: 'strava',
            },
        },
        create: {
            userId,
            provider: 'strava',
            accessToken,
            refreshToken,
            expiresAt,
            providerUserId,
            scope,
        },
        update: {
            accessToken,
            refreshToken,
            expiresAt,
            providerUserId,
            scope,
        },
    })
}

/**
 * Strava連携を削除
 */
export async function deleteStravaIntegration(userId: string) {
    return prisma.userIntegration.delete({
        where: {
            userId_provider: {
                userId,
                provider: 'strava',
            },
        },
    })
}

/**
 * ユーザーがStravaと連携しているかチェック
 */
export async function isStravaConnected(userId: string): Promise<boolean> {
    const integration = await prisma.userIntegration.findUnique({
        where: {
            userId_provider: {
                userId,
                provider: 'strava',
            },
        },
    })

    return integration !== null
}
