/**
 * Strava OAuthコールバックエンドポイント
 * GET /api/integrations/strava/callback
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { exchangeCodeForToken } from '@/lib/strava/client'
import { saveStravaIntegration } from '@/lib/strava/auth'
import { syncStravaGear } from '@/lib/strava/sync'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        // エラーチェック
        if (error) {
            console.error('Stravaコールバックエラー:', error)
            return NextResponse.redirect(
                new URL('/profile/integrations?error=strava_denied', request.url)
            )
        }

        if (!code) {
            return NextResponse.redirect(
                new URL('/profile/integrations?error=no_code', request.url)
            )
        }

        // セッションからユーザーIDを取得
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.redirect(
                new URL('/login?callbackUrl=/profile/integrations', request.url)
            )
        }

        // stateの検証（オプション）
        if (state) {
            try {
                const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
                if (stateData.userId !== session.user.id) {
                    console.warn('State mismatch - possible CSRF attack')
                }
            } catch {
                console.warn('Invalid state parameter')
            }
        }

        // 認証コードをトークンに交換
        const tokens = await exchangeCodeForToken(code)

        // アスリート情報をログ出力（デバッグ用）
        console.log('Strava連携成功 - アスリート情報:', {
            id: tokens.athlete.id,
            firstname: tokens.athlete.firstname,
            lastname: tokens.athlete.lastname,
            email: tokens.athlete.email || '(メール取得には再認証が必要)',
            username: tokens.athlete.username,
        })

        // 連携情報を保存
        await saveStravaIntegration(
            session.user.id,
            tokens.access_token,
            tokens.refresh_token,
            new Date(tokens.expires_at * 1000),
            String(tokens.athlete.id),
            'read,profile:read_all,activity:read_all'
        )

        // シューズ情報を初期同期（バックグラウンドで）
        try {
            await syncStravaGear(session.user.id)
        } catch (syncError) {
            console.error('シューズ同期エラー:', syncError)
            // 同期エラーは無視して続行
        }

        return NextResponse.redirect(
            new URL('/profile/integrations?success=strava_connected', request.url)
        )
    } catch (error) {
        console.error('Stravaコールバック処理エラー:', error)
        return NextResponse.redirect(
            new URL('/profile/integrations?error=strava_failed', request.url)
        )
    }
}
