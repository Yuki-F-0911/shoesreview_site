'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

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

interface UserShoeListProps {
    shoes: UserShoe[]
    onSync?: () => void
    isSyncing?: boolean
}

export function UserShoeList({ shoes, onSync, isSyncing }: UserShoeListProps) {
    const [showRetired, setShowRetired] = useState(false)

    const activeShoes = shoes.filter((s) => !s.retiredAt)
    const retiredShoes = shoes.filter((s) => s.retiredAt)

    const displayShoes = showRetired ? shoes : activeShoes

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">マイシューズ</h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRetired(!showRetired)}
                    >
                        {showRetired ? '現役のみ表示' : `引退済みも表示 (${retiredShoes.length})`}
                    </Button>
                    {onSync && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onSync}
                            disabled={isSyncing}
                        >
                            {isSyncing ? '同期中...' : 'Stravaと同期'}
                        </Button>
                    )}
                </div>
            </div>

            {displayShoes.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                        シューズが登録されていません
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayShoes.map((shoe) => (
                        <ShoeCard key={shoe.id} shoe={shoe} />
                    ))}
                </div>
            )}
        </div>
    )
}

function ShoeCard({ shoe }: { shoe: UserShoe }) {
    const imageUrl =
        shoe.imageUrl || shoe.shoe?.imageUrls?.[0] || '/images/shoe-placeholder.png'

    return (
        <Card className={shoe.retiredAt ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{shoe.name}</CardTitle>
                        <p className="text-sm text-gray-500">
                            {shoe.brand} {shoe.model}
                        </p>
                    </div>
                    {shoe.retiredAt && (
                        <span className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-600">
                            引退
                        </span>
                    )}
                    {shoe.needsReplacement && !shoe.retiredAt && (
                        <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-600">
                            交換推奨
                        </span>
                    )}
                    {shoe.isNearReplacement && !shoe.needsReplacement && !shoe.retiredAt && (
                        <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
                            交換まもなく
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* 距離プログレスバー */}
                    <div>
                        <div className="mb-1 flex justify-between text-sm">
                            <span className="font-medium">
                                {shoe.totalDistance.toFixed(1)} km
                            </span>
                            <span className="text-gray-500">
                                / {shoe.maxDistance} km
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                                className={`h-full transition-all ${shoe.needsReplacement
                                        ? 'bg-red-500'
                                        : shoe.isNearReplacement
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                    }`}
                                style={{ width: `${Math.min(100, shoe.progressPercent)}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{shoe._count.activities} アクティビティ</span>
                        <span>{shoe.progressPercent.toFixed(0)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
