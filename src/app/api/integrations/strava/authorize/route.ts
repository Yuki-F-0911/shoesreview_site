/**
 * Strava OAuth認証開始エンドポイント
 * GET /api/integrations/strava/authorize
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { getStravaAuthUrl } from '@/lib/strava/client'
import { isStravaConnected } from '@/lib/strava/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'ログインが必要です' },
                { status: 401 }
            )
        }

        // 既に連携済みかチェック
        const connected = await isStravaConnected(session.user.id)
        if (connected) {
            return NextResponse.json(
                { error: '既にStravaと連携しています' },
                { status: 400 }
            )
        }

        // 認証URLを生成（stateにユーザーIDを含める）
        const state = Buffer.from(
            JSON.stringify({ userId: session.user.id })
        ).toString('base64')

        const authUrl = getStravaAuthUrl(state)

        return NextResponse.redirect(authUrl)
    } catch (error) {
        console.error('Strava認証開始エラー:', error)
        return NextResponse.json(
            { error: 'Strava認証の開始に失敗しました' },
            { status: 500 }
        )
    }
}
