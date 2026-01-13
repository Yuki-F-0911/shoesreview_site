/**
 * Strava アクティビティ同期ロジック
 */

import { prisma } from '@/lib/prisma/client'
import { StravaClient } from './client'
import { getStravaIntegration } from './auth'
import type { StravaActivity } from '@/types/strava'

/**
 * Stravaからアクティビティを同期
 */
export async function syncStravaActivities(userId: string): Promise<{
    synced: number
    total: number
}> {
    // Strava連携情報を取得
    const integration = await getStravaIntegration(userId)
    if (!integration) {
        throw new Error('Stravaと連携されていません')
    }

    const client = new StravaClient(integration.accessToken)

    // 最後に同期したアクティビティの日時を取得
    const lastActivity = await prisma.runningActivity.findFirst({
        where: {
            userId,
            source: 'strava',
        },
        orderBy: {
            activityDate: 'desc',
        },
    })

    // 最後の同期以降のアクティビティを取得
    const afterTimestamp = lastActivity
        ? Math.floor(lastActivity.activityDate.getTime() / 1000)
        : undefined

    // ランニングアクティビティを取得（最大200件）
    const activities = await client.getRunningActivities({
        perPage: 200,
        after: afterTimestamp,
    })

    let synced = 0

    for (const activity of activities) {
        // 既に同期済みかチェック
        const existing = await prisma.runningActivity.findUnique({
            where: {
                stravaActivityId: String(activity.id),
            },
        })

        if (existing) {
            continue
        }

        // シューズを紐付け（gear_idがある場合）
        let userShoeId: string | null = null
        if (activity.gear_id) {
            const userShoe = await prisma.userShoe.findFirst({
                where: {
                    userId,
                    stravaGearId: activity.gear_id,
                },
            })
            userShoeId = userShoe?.id || null
        }

        // アクティビティを保存
        await prisma.runningActivity.create({
            data: {
                userId,
                userShoeId,
                stravaActivityId: String(activity.id),
                name: activity.name,
                distance: activity.distance / 1000, // m -> km
                duration: activity.moving_time,
                pace: calculatePace(activity.distance, activity.moving_time),
                elevationGain: activity.total_elevation_gain,
                activityDate: new Date(activity.start_date),
                source: 'strava',
            },
        })

        // シューズの総距離を更新
        if (userShoeId) {
            await updateShoeDistance(userShoeId)
        }

        synced++
    }

    return {
        synced,
        total: activities.length,
    }
}

/**
 * Stravaからシューズ（ギア）を同期
 */
export async function syncStravaGear(userId: string): Promise<{
    synced: number
}> {
    const integration = await getStravaIntegration(userId)
    if (!integration) {
        throw new Error('Stravaと連携されていません')
    }

    const client = new StravaClient(integration.accessToken)

    // アスリート情報からシューズのリストを取得するには
    // 各アクティビティのgear_idを集めて、それぞれのギア情報を取得する必要がある
    // ここでは最新100件のアクティビティからギアIDを収集

    const activities = await client.getRunningActivities({ perPage: 100 })
    const gearIds = new Set<string>()

    for (const activity of activities) {
        if (activity.gear_id) {
            gearIds.add(activity.gear_id)
        }
    }

    let synced = 0

    for (const gearId of gearIds) {
        // 既に登録済みかチェック
        const existing = await prisma.userShoe.findFirst({
            where: {
                userId,
                stravaGearId: gearId,
            },
        })

        if (existing) {
            // 距離を更新
            const gear = await client.getGear(gearId)
            await prisma.userShoe.update({
                where: { id: existing.id },
                data: {
                    totalDistance: gear.distance / 1000, // m -> km
                    retiredAt: gear.retired ? new Date() : null,
                },
            })
            continue
        }

        // 新しいシューズを登録
        const gear = await client.getGear(gearId)
        await prisma.userShoe.create({
            data: {
                userId,
                stravaGearId: gearId,
                name: gear.name,
                brand: gear.brand_name || 'Unknown',
                model: gear.model_name || gear.name,
                totalDistance: gear.distance / 1000, // m -> km
                retiredAt: gear.retired ? new Date() : null,
            },
        })

        synced++
    }

    return { synced }
}

/**
 * シューズの総距離を再計算
 */
export async function updateShoeDistance(userShoeId: string): Promise<void> {
    const result = await prisma.runningActivity.aggregate({
        where: {
            userShoeId,
        },
        _sum: {
            distance: true,
        },
    })

    await prisma.userShoe.update({
        where: { id: userShoeId },
        data: {
            totalDistance: result._sum.distance || 0,
        },
    })
}

/**
 * ペースを計算（min/km）
 */
function calculatePace(distanceMeters: number, durationSeconds: number): number | null {
    if (distanceMeters === 0) return null
    const distanceKm = distanceMeters / 1000
    const durationMinutes = durationSeconds / 60
    return durationMinutes / distanceKm
}

/**
 * 全シューズの距離を再計算
 */
export async function recalculateAllShoeDistances(userId: string): Promise<void> {
    const userShoes = await prisma.userShoe.findMany({
        where: { userId },
    })

    for (const shoe of userShoes) {
        await updateShoeDistance(shoe.id)
    }
}

/**
 * 同期結果のサマリーを取得
 */
export async function getSyncSummary(userId: string) {
    const integration = await prisma.userIntegration.findUnique({
        where: {
            userId_provider: {
                userId,
                provider: 'strava',
            },
        },
    })

    const totalActivities = await prisma.runningActivity.count({
        where: {
            userId,
            source: 'strava',
        },
    })

    const totalShoes = await prisma.userShoe.count({
        where: {
            userId,
        },
    })

    const lastSync = await prisma.runningActivity.findFirst({
        where: {
            userId,
            source: 'strava',
        },
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            createdAt: true,
        },
    })

    return {
        isConnected: integration !== null,
        totalActivities,
        totalShoes,
        lastSyncAt: lastSync?.createdAt || null,
    }
}
