
import { Review } from '@prisma/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Ruler, Weight, User, Activity } from 'lucide-react'

interface ReviewDetailedStatsProps {
    review: Review
}

export function ReviewDetailedStats({ review }: ReviewDetailedStatsProps) {
    // Cast to any to avoid stale type errors for new schema fields
    const r = review as any;

    const renderRatingBar = (label: string, value: number | null, max = 5) => {
        if (value === null || value === undefined) return null
        return (
            <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium">{value} / {max}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(value / max) * 100}%` }}
                    />
                </div>
            </div>
        )
    }

    const renderSDRating = (label: string, value: number | null, leftLabel: string, rightLabel: string) => {
        if (value === null || value === undefined) return null
        return (
            <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
                <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span className="w-16 text-right whitespace-nowrap">{leftLabel}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full relative">
                        <div
                            className="absolute w-3 h-3 bg-blue-600 rounded-full top-1/2 transform -translate-y-1/2 -ml-1.5 border border-white shadow-sm"
                            style={{ left: `${((value - 1) / 4) * 100}%` }}
                        />
                    </div>
                    <span className="w-16 whitespace-nowrap">{rightLabel}</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 mt-8">

            {/* 履き心地・走行性能 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-50 border-gray-200 shadow-sm">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            ステップイン・走行感
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">ステップイン</h4>
                                {renderRatingBar('つま先の広さ', r.stepInToeWidth)}
                                {renderRatingBar('甲の高さ', r.stepInInstepHeight)}
                                {renderRatingBar('ヒールのホールド', r.stepInHeelHold)}
                            </div>
                            <div className="pt-2 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-900 mb-2 mt-2">走行性能</h4>
                                {renderRatingBar('軽さの実感', r.runLightness)}
                                {renderRatingBar('沈み込み (クッション)', r.runSinkDepth)}
                                {renderRatingBar('反発性', r.runResponse)}
                                {renderRatingBar('安定性', r.runStability)}
                                {renderRatingBar('トランジション', r.runTransition)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-50 border-gray-200 shadow-sm">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-gray-900 mb-4">詳細特性 (SD法)</h3>
                        <div className="space-y-2">
                            {renderSDRating('着地感', r.sdLanding, '柔らかい', '硬い/路面')}
                            {renderSDRating('反発性', r.sdResponse, '少ない', '強い')}
                            {renderSDRating('安定性', r.sdStability, '自然', '矯正的')}
                            {renderSDRating('足幅感', r.sdWidth, 'タイト', 'ゆとり')}
                            {renderSDRating('デザイン', r.sdDesign, '競技的', 'カジュアル')}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 疲労感 */}
            {(r.fatigueSole || r.fatigueCalf || r.fatigueKnee) && (
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-gray-900 mb-4">走行後の疲労感</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {r.fatigueSole && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs text-gray-500">足裏</div>
                                    <div className="font-medium text-gray-900">{r.fatigueSole}</div>
                                </div>
                            )}
                            {r.fatigueCalf && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs text-gray-500">ふくらはぎ</div>
                                    <div className="font-medium text-gray-900">{r.fatigueCalf}</div>
                                </div>
                            )}
                            {r.fatigueKnee && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs text-gray-500">膝</div>
                                    <div className="font-medium text-gray-900">{r.fatigueKnee}</div>
                                </div>
                            )}
                        </div>
                        {r.fatigueOther && (
                            <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                <span className="font-medium">その他:</span> {r.fatigueOther}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* レビュアー情報 */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    レビュアー情報 (投稿時)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    {r.reviewerGender && (
                        <div>
                            <span className="block text-blue-600 text-xs">性別</span>
                            <span className="font-medium text-blue-900">{r.reviewerGender}</span>
                        </div>
                    )}
                    {r.reviewerHeight && (
                        <div>
                            <span className="block text-blue-600 text-xs">身長</span>
                            <span className="font-medium text-blue-900 flex items-center">
                                <Ruler className="w-3 h-3 mr-1" />
                                {r.reviewerHeight}cm
                            </span>
                        </div>
                    )}
                    {r.reviewerWeight && (
                        <div>
                            <span className="block text-blue-600 text-xs">体重</span>
                            <span className="font-medium text-blue-900 flex items-center">
                                <Weight className="w-3 h-3 mr-1" />
                                {r.reviewerWeight}kg
                            </span>
                        </div>
                    )}
                    {r.reviewerWeeklyDistance && (
                        <div>
                            <span className="block text-blue-600 text-xs">週間走行距離</span>
                            <span className="font-medium text-blue-900">{r.reviewerWeeklyDistance}km/週</span>
                        </div>
                    )}
                    {r.reviewerPersonalBest && (
                        <div className="col-span-2">
                            <span className="block text-blue-600 text-xs">自己ベスト</span>
                            <span className="font-medium text-blue-900">{r.reviewerPersonalBest}</span>
                        </div>
                    )}
                    {r.reviewerFootShape && (
                        <div>
                            <span className="block text-blue-600 text-xs">足の形状</span>
                            <span className="font-medium text-blue-900">{r.reviewerFootShape}</span>
                        </div>
                    )}
                    {r.reviewerLandingType && (
                        <div>
                            <span className="block text-blue-600 text-xs">接地タイプ</span>
                            <span className="font-medium text-blue-900">{r.reviewerLandingType}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* その他情報 */}
            {(r.onomatopoeia || r.purchaseSize) && (
                <div className="flex gap-4">
                    {r.onomatopoeia && (
                        <Badge variant="secondary" className="text-base py-1 px-3">
                            感覚: &quot;{r.onomatopoeia}&quot;
                        </Badge>
                    )}
                    {r.purchaseSize && (
                        <Badge variant="outline" className="text-base py-1 px-3">
                            購入サイズ: {r.purchaseSize}cm
                        </Badge>
                    )}
                </div>
            )}

        </div>
    )
}
