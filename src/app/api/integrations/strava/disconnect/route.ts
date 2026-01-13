/**
 * Strava連携解除エンドポイント
 * DELETE /api/integrations/strava/disconnect
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { getStravaIntegration, deleteStravaIntegration } from '@/lib/strava/auth'
import { deauthorize } from '@/lib/strava/client'

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'ログインが必要です' },
                { status: 401 }
            )
        }

        // 連携情報を取得
        const integration = await getStravaIntegration(session.user.id)

        if (!integration) {
            return NextResponse.json(
                { error: 'Stravaと連携されていません' },
                { status: 400 }
            )
        }

        // Strava側でトークンを無効化
        try {
            await deauthorize(integration.accessToken)
        } catch (error) {
            console.error('Stravaトークン無効化エラー:', error)
            // Strava側のエラーは無視して続行（ローカルの連携は解除する）
        }

        // ローカルの連携情報を削除
        await deleteStravaIntegration(session.user.id)

        return NextResponse.json({
            success: true,
            message: 'Strava連携を解除しました',
        })
    } catch (error) {
        console.error('Strava連携解除エラー:', error)
        return NextResponse.json(
            { error: 'Strava連携の解除に失敗しました' },
            { status: 500 }
        )
    }
}
