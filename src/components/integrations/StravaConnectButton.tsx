'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface StravaConnectButtonProps {
    isConnected: boolean
    onDisconnect?: () => void
}

export function StravaConnectButton({
    isConnected,
    onDisconnect,
}: StravaConnectButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleConnect = () => {
        // OAuth認証開始エンドポイントにリダイレクト
        window.location.href = '/api/integrations/strava/authorize'
    }

    const handleDisconnect = async () => {
        if (!confirm('Strava連携を解除しますか？\n同期したアクティビティは保持されます。')) {
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/integrations/strava/disconnect', {
                method: 'DELETE',
            })

            const result = await response.json()

            if (!response.ok) {
                setError(result.error || '連携解除に失敗しました')
                return
            }

            onDisconnect?.()
            window.location.reload()
        } catch {
            setError('エラーが発生しました')
        } finally {
            setIsLoading(false)
        }
    }

    if (isConnected) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-600">Stravaと連携中</span>
                </div>
                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isLoading}
                >
                    {isLoading ? '解除中...' : '連携を解除'}
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Button
                onClick={handleConnect}
                className="bg-[#FC4C02] hover:bg-[#E34402] text-white"
            >
                <svg
                    className="mr-2 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Stravaと連携
            </Button>
            <p className="text-xs text-gray-500">
                ランニングアクティビティを自動で同期します
            </p>
        </div>
    )
}
