/**
 * Strava同期エンドポイント
 * POST /api/integrations/strava/sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { syncStravaActivities, syncStravaGear, getSyncSummary } from '@/lib/strava/sync'
import { isStravaConnected } from '@/lib/strava/auth'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'ログインが必要です' },
                { status: 401 }
            )
        }

        // 連携チェック
        const connected = await isStravaConnected(session.user.id)
        if (!connected) {
            return NextResponse.json(
                { error: 'Stravaと連携されていません' },
                { status: 400 }
            )
        }

        // アクティビティを同期
        const activityResult = await syncStravaActivities(session.user.id)

        // シューズ情報を同期
        const gearResult = await syncStravaGear(session.user.id)

        // サマリーを取得
        const summary = await getSyncSummary(session.user.id)

        return NextResponse.json({
            success: true,
            message: '同期が完了しました',
            data: {
                activitiesSynced: activityResult.synced,
                activitiesTotal: activityResult.total,
                gearSynced: gearResult.synced,
                summary,
            },
        })
    } catch (error) {
        console.error('Strava同期エラー:', error)
        return NextResponse.json(
            { error: 'Stravaデータの同期に失敗しました' },
            { status: 500 }
        )
    }
}

/**
 * 同期状態を取得
 * GET /api/integrations/strava/sync
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'ログインが必要です' },
                { status: 401 }
            )
        }

        const summary = await getSyncSummary(session.user.id)

        return NextResponse.json({
            success: true,
            data: summary,
        })
    } catch (error) {
        console.error('Strava同期状態取得エラー:', error)
        return NextResponse.json(
            { error: '同期状態の取得に失敗しました' },
            { status: 500 }
        )
    }
}
