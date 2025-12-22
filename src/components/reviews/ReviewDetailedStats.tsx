'use client'

import { Review } from '@prisma/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Ruler, Weight, User, Activity, Target } from 'lucide-react'

interface ReviewDetailedStatsProps {
    review: Review
}

// CSSベースのシンプルなレーダーチャート
function RadarChart({ data }: { data: { label: string; value: number | null; max: number }[] }) {
    const validData = data.filter(d => d.value !== null && d.value !== undefined)
    if (validData.length === 0) return null

    const size = 200
    const center = size / 2
    const maxRadius = 80
    const labelRadius = 95

    // 多角形の頂点を計算
    const points = validData.map((d, i) => {
        const angle = (2 * Math.PI * i) / validData.length - Math.PI / 2
        const radius = ((d.value || 0) / d.max) * maxRadius
        return {
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle),
            labelX: center + labelRadius * Math.cos(angle),
            labelY: center + labelRadius * Math.sin(angle),
            label: d.label,
            value: d.value
        }
    })

    // 背景のグリッド線
    const gridLevels = [0.25, 0.5, 0.75, 1]
    const gridPolygons = gridLevels.map(level => {
        return validData.map((_, i) => {
            const angle = (2 * Math.PI * i) / validData.length - Math.PI / 2
            const radius = level * maxRadius
            return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`
        }).join(' ')
    })

    // データ多角形
    const dataPolygon = points.map(p => `${p.x},${p.y}`).join(' ')

    return (
        <div className="flex justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* グリッド背景 */}
                {gridPolygons.map((polygon, i) => (
                    <polygon
                        key={i}
                        points={polygon}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="1"
                    />
                ))}

                {/* 軸線 */}
                {points.map((p, i) => (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={center + maxRadius * Math.cos((2 * Math.PI * i) / validData.length - Math.PI / 2)}
                        y2={center + maxRadius * Math.sin((2 * Math.PI * i) / validData.length - Math.PI / 2)}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                    />
                ))}

                {/* データ領域 */}
                <polygon
                    points={dataPolygon}
                    fill="rgba(59, 130, 246, 0.3)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                />

                {/* データポイント */}
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
                ))}

                {/* ラベル */}
                {points.map((p, i) => (
                    <text
                        key={i}
                        x={p.labelX}
                        y={p.labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs fill-gray-600"
                        fontSize="10"
                    >
                        {p.label}
                    </text>
                ))}
            </svg>
        </div>
    )
}

export function ReviewDetailedStats({ review }: ReviewDetailedStatsProps) {
    const r = review as any

    const renderRatingBar = (label: string, value: number | null, leftLabel: string, rightLabel: string, max = 10) => {
        if (value === null || value === undefined) return null
        return (
            <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{leftLabel}</span>
                    <span className="font-medium text-gray-700">{label}</span>
                    <span>{rightLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${(value / max) * 100}%` }}
                        />
                    </div>
                    <span className="text-sm font-medium text-blue-600 w-8 text-right">{value}</span>
                </div>
            </div>
        )
    }

    const renderFatigueRating = (label: string, value: number | null) => {
        if (value === null || value === undefined) return null
        // 10=疲労なし、1=強く感じる
        const fatigueLevel = value >= 8 ? '少ない' : value >= 5 ? '普通' : '多い'
        const bgColor = value >= 8 ? 'bg-green-100 text-green-800' : value >= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
        return (
            <div className={`p-3 rounded-lg ${bgColor}`}>
                <div className="text-xs opacity-75">{label}</div>
                <div className="font-medium">{value}/10 ({fatigueLevel})</div>
            </div>
        )
    }

    // レーダーチャート用データ
    const radarData = [
        { label: '履き心地', value: r.comfortRating, max: 10 },
        { label: '軽量性', value: r.lightnessRating, max: 10 },
        { label: 'クッション', value: r.cushioningRating, max: 10 },
        { label: '安定性', value: r.stabilityRating, max: 10 },
        { label: '反発力', value: r.responsivenessRating, max: 10 },
        { label: 'グリップ', value: r.gripRating, max: 10 },
        { label: 'デザイン', value: r.designRating, max: 10 },
        { label: '耐久性', value: r.durabilityRating, max: 10 },
    ]

    const hasRadarData = radarData.some(d => d.value !== null && d.value !== undefined)

    return (
        <div className="space-y-6 mt-8">

            {/* 走行・機能評価（レーダーチャート） */}
            {hasRadarData && (
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            走行・機能評価
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <RadarChart data={radarData} />
                            <div className="space-y-2">
                                {renderRatingBar('履き心地', r.comfortRating, '悪い', '良い')}
                                {renderRatingBar('軽量性', r.lightnessRating, '重い', '軽い')}
                                {renderRatingBar('クッション性', r.cushioningRating, '硬い', '柔らかい')}
                                {renderRatingBar('安定性', r.stabilityRating, '不安定', '安定')}
                                {renderRatingBar('反発力', r.responsivenessRating, '弱い', '強い')}
                                {renderRatingBar('グリップ力', r.gripRating, '滑る', 'グリップ強')}
                                {renderRatingBar('デザイン', r.designRating, '地味', '派手')}
                                {renderRatingBar('耐久性', r.durabilityRating, '弱い', '強い')}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ステップイン（足入れ感） */}
            {(r.stepInToeWidth || r.stepInInstepHeight || r.stepInHeelHold) && (
                <Card className="bg-gray-50 border-gray-200 shadow-sm">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            ステップイン（足入れ感）
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderRatingBar('つま先の広さ', r.stepInToeWidth, '狭い', '広い')}
                            {renderRatingBar('甲の高さ', r.stepInInstepHeight, '低い', '高い')}
                            {renderRatingBar('ヒールホールド', r.stepInHeelHold, '弱い', '強い')}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 疲労感 */}
            {(r.fatigueSole || r.fatigueCalf || r.fatigueKnee) && (
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-gray-900 mb-4">疲労感（使用後）</h3>
                        <p className="text-xs text-gray-500 mb-3">10に近いほど疲労が少ない（良い）評価</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {renderFatigueRating('足裏の疲労', r.fatigueSole)}
                            {renderFatigueRating('ふくらはぎの張り', r.fatigueCalf)}
                            {renderFatigueRating('膝への負担', r.fatigueKnee)}
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
                    {r.reviewerGender && r.reviewerGender !== '' && (
                        <div>
                            <span className="block text-blue-600 text-xs">性別</span>
                            <span className="font-medium text-blue-900">{r.reviewerGender}</span>
                        </div>
                    )}
                    {r.reviewerAge && (
                        <div>
                            <span className="block text-blue-600 text-xs">年齢</span>
                            <span className="font-medium text-blue-900">{r.reviewerAge}歳</span>
                        </div>
                    )}
                    {(r.reviewerHeightRange || r.reviewerHeight) && (
                        <div>
                            <span className="block text-blue-600 text-xs">身長</span>
                            <span className="font-medium text-blue-900 flex items-center">
                                <Ruler className="w-3 h-3 mr-1" />
                                {r.reviewerHeightRange || `${r.reviewerHeight}cm`}
                            </span>
                        </div>
                    )}
                    {(r.reviewerWeightRange || r.reviewerWeight) && (
                        <div>
                            <span className="block text-blue-600 text-xs">体重</span>
                            <span className="font-medium text-blue-900 flex items-center">
                                <Weight className="w-3 h-3 mr-1" />
                                {r.reviewerWeightRange || `${r.reviewerWeight}kg`}
                            </span>
                        </div>
                    )}
                    {r.reviewerWeeklyDistance && (
                        <div>
                            <span className="block text-blue-600 text-xs">週間走行距離</span>
                            <span className="font-medium text-blue-900">{r.reviewerWeeklyDistance}km/週</span>
                        </div>
                    )}
                    {(r.reviewerPersonalBestLevel || r.reviewerPersonalBest) && (
                        <div className="col-span-2">
                            <span className="block text-blue-600 text-xs">走力レベル</span>
                            <span className="font-medium text-blue-900">{r.reviewerPersonalBestLevel || r.reviewerPersonalBest}</span>
                        </div>
                    )}
                    {r.reviewerFootShape && r.reviewerFootShape.length > 0 && (
                        <div>
                            <span className="block text-blue-600 text-xs">足の形状</span>
                            <span className="font-medium text-blue-900">
                                {Array.isArray(r.reviewerFootShape) ? r.reviewerFootShape.join(', ') : r.reviewerFootShape}
                            </span>
                        </div>
                    )}
                    {r.reviewerLandingType && r.reviewerLandingType !== '' && (
                        <div>
                            <span className="block text-blue-600 text-xs">接地タイプ</span>
                            <span className="font-medium text-blue-900">{r.reviewerLandingType}</span>
                        </div>
                    )}
                    {r.reviewerExpertise && r.reviewerExpertise.length > 0 && (
                        <div className="col-span-2">
                            <span className="block text-blue-600 text-xs">専門種目</span>
                            <span className="font-medium text-blue-900">
                                {Array.isArray(r.reviewerExpertise) ? r.reviewerExpertise.join(', ') : r.reviewerExpertise}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* その他情報 */}
            {(r.onomatopoeia || r.purchaseSize) && (
                <div className="flex flex-wrap gap-4">
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
