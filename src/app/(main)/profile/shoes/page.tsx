'use client'

import { useState, useEffect } from 'react'
import { UserShoeList } from '@/components/user/UserShoeList'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface UserShoe {
    id: string
    name: string
    brand: string
    model: string
    totalDistance: number
    maxDistance: number
    progressPercent: number
    isNearReplacement: boolean
    needsReplacement: boolean
    retiredAt: string | null
    imageUrl: string | null
    shoe?: {
        id: string
        brand: string
        modelName: string
        imageUrls: string[]
    } | null
    _count: {
        activities: number
    }
}

export default function ShoesPage() {
    const [shoes, setShoes] = useState<UserShoe[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchShoes = async () => {
        try {
            const response = await fetch('/api/user/shoes?includeRetired=true')
            const result = await response.json()

            if (result.success) {
                setShoes(result.data)
            } else {
                setError(result.error)
            }
        } catch {
            setError('シューズの取得に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSync = async () => {
        setIsSyncing(true)
        setError(null)

        try {
            const response = await fetch('/api/integrations/strava/sync', {
                method: 'POST',
            })
            const result = await response.json()

            if (result.success) {
                await fetchShoes()
            } else {
                setError(result.error)
            }
        } catch {
            setError('同期に失敗しました')
        } finally {
            setIsSyncing(false)
        }
    }

    useEffect(() => {
        fetchShoes()
    }, [])

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <div className="text-center text-gray-500">読み込み中...</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">マイシューズ</h1>
                <div className="flex gap-2">
                    <Link href="/profile/integrations">
                        <Button variant="outline" size="sm">
                            外部サービス連携
                        </Button>
                    </Link>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800">
                    {error}
                </div>
            )}

            <UserShoeList
                shoes={shoes}
                onSync={handleSync}
                isSyncing={isSyncing}
            />

            <div className="mt-8 rounded-lg bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-800">シューズの距離追跡について</h3>
                <p className="text-sm text-blue-700">
                    Stravaと連携すると、ランニングアクティビティとシューズの使用距離が自動で同期されます。
                    シューズの交換目安（デフォルト800km）に近づくと通知されます。
                </p>
                <Link
                    href="/profile/integrations"
                    className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                >
                    連携設定を確認 →
                </Link>
            </div>
        </div>
    )
}
