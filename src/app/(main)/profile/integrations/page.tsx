import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { StravaConnectButton } from '@/components/integrations/StravaConnectButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export const metadata = {
    title: '外部サービス連携 | Stride',
    description: 'Stravaなどの外部サービスとの連携を管理します',
}

async function getIntegrations(userId: string) {
    const integrations = await prisma.userIntegration.findMany({
        where: { userId },
    })

    return {
        strava: integrations.find((i) => i.provider === 'strava') || null,
        garmin: integrations.find((i) => i.provider === 'garmin') || null,
    }
}

async function getStravaSummary(userId: string) {
    const activityCount = await prisma.runningActivity.count({
        where: {
            userId,
            source: 'strava',
        },
    })

    const shoeCount = await prisma.userShoe.count({
        where: {
            userId,
            stravaGearId: { not: null },
        },
    })

    const totalDistance = await prisma.runningActivity.aggregate({
        where: {
            userId,
            source: 'strava',
        },
        _sum: {
            distance: true,
        },
    })

    return {
        activityCount,
        shoeCount,
        totalDistance: totalDistance._sum.distance || 0,
    }
}

export default async function IntegrationsPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string; error?: string }>
}) {
    const session = await auth()
    const params = await searchParams

    if (!session?.user?.id) {
        redirect('/login')
    }

    const integrations = await getIntegrations(session.user.id)
    const stravaSummary = integrations.strava
        ? await getStravaSummary(session.user.id)
        : null

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <h1 className="mb-8 text-2xl font-bold">外部サービス連携</h1>

            {/* 成功・エラーメッセージ */}
            {params.success === 'strava_connected' && (
                <div className="mb-6 rounded-md bg-green-50 p-4 text-green-800">
                    Stravaとの連携が完了しました！
                </div>
            )}
            {params.error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800">
                    {params.error === 'strava_denied'
                        ? 'Stravaでの認証がキャンセルされました'
                        : params.error === 'strava_failed'
                            ? 'Stravaとの連携に失敗しました'
                            : 'エラーが発生しました'}
                </div>
            )}

            <div className="space-y-6">
                {/* Strava連携 */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <svg
                                className="h-8 w-8 text-[#FC4C02]"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                            </svg>
                            <CardTitle>Strava</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Stravaと連携することで、ランニングアクティビティとシューズの使用距離を自動で同期できます。
                            </p>

                            <StravaConnectButton
                                isConnected={integrations.strava !== null}
                            />

                            {stravaSummary && (
                                <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#FC4C02]">
                                            {stravaSummary.activityCount}
                                        </div>
                                        <div className="text-sm text-gray-500">アクティビティ</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#FC4C02]">
                                            {stravaSummary.shoeCount}
                                        </div>
                                        <div className="text-sm text-gray-500">シューズ</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#FC4C02]">
                                            {stravaSummary.totalDistance.toFixed(0)}
                                        </div>
                                        <div className="text-sm text-gray-500">総距離 (km)</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Garmin Connect（今後対応予定） */}
                <Card className="opacity-60">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-black">
                                <span className="text-xs font-bold text-white">G</span>
                            </div>
                            <CardTitle>Garmin Connect</CardTitle>
                            <span className="rounded bg-gray-200 px-2 py-1 text-xs">
                                近日対応予定
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-500">
                            Garmin Connectとの連携は近日対応予定です。
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
