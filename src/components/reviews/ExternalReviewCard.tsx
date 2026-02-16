'use client'

import { ExternalLink, Globe } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export interface ExternalReviewData {
    id: string
    platform: string
    sourceUrl: string
    sourceTitle: string | null
    authorName: string | null
    snippet: string | null
    aiSummary: string | null
    language: string
    sentiment: string | null
    keyPoints: string[]
    publishedAt: string | null
    collectedAt: string
    shoe?: {
        brand: string
        modelName: string
        imageUrls?: string[]
    }
}

// プラットフォーム設定
const platformConfig: Record<string, { label: string; color: string; bgColor: string; initial: string }> = {
    reddit: { label: 'Reddit', color: 'text-orange-600', bgColor: 'bg-orange-50', initial: 'R' },
    twitter: { label: 'X', color: 'text-neutral-800', bgColor: 'bg-neutral-100', initial: 'X' },
    youtube: { label: 'YouTube', color: 'text-red-600', bgColor: 'bg-red-50', initial: '▶' },
    blog: { label: 'Blog', color: 'text-emerald-600', bgColor: 'bg-emerald-50', initial: 'B' },
    strava: { label: 'Strava', color: 'text-orange-500', bgColor: 'bg-orange-50', initial: 'S' },
    instagram: { label: 'Instagram', color: 'text-pink-600', bgColor: 'bg-pink-50', initial: 'I' },
    threads: { label: 'Threads', color: 'text-neutral-800', bgColor: 'bg-neutral-100', initial: '@' },
}

const sentimentConfig: Record<string, { label: string; color: string }> = {
    positive: { label: '好評', color: 'text-emerald-600' },
    negative: { label: '不評', color: 'text-red-500' },
    neutral: { label: '中立', color: 'text-neutral-400' },
    mixed: { label: '賛否', color: 'text-amber-500' },
}

const languageFlags: Record<string, string> = {
    ja: '🇯🇵',
    en: '🇺🇸',
    ko: '🇰🇷',
    zh: '🇨🇳',
    de: '🇩🇪',
    fr: '🇫🇷',
}

export function ExternalReviewCard({ review, showShoeInfo = false }: { review: ExternalReviewData; showShoeInfo?: boolean }) {
    const platform = platformConfig[review.platform] || platformConfig.blog
    const sentiment = review.sentiment ? sentimentConfig[review.sentiment] : null
    const langFlag = languageFlags[review.language] || '🌐'

    // 表示するテキスト: AI要約 > スニペット
    const displayText = review.aiSummary || review.snippet || ''
    const contentPreview = displayText.length > 120
        ? displayText.slice(0, 120) + '...'
        : displayText

    // 著者名の整形
    const authorDisplay = review.authorName && review.authorName !== '不明'
        ? review.authorName
        : null

    const shoeImage = review.shoe?.imageUrls?.[0] || null

    return (
        <a
            href={review.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block group h-full"
        >
            <Card className="overflow-hidden card-hover h-full flex flex-col">
                {/* シューズ情報（オプション表示） */}
                {showShoeInfo && review.shoe && (
                    <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-100 flex items-center gap-3">
                        {shoeImage ? (
                            <div className="h-10 w-10 relative flex-shrink-0 bg-white rounded border border-neutral-100 overflow-hidden">
                                <img src={shoeImage} alt={review.shoe.modelName} className="object-contain w-full h-full p-0.5" />
                            </div>
                        ) : (
                            <div className="h-10 w-10 flex-shrink-0 bg-neutral-200 rounded flex items-center justify-center text-xs text-neutral-500">
                                No
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-neutral-500 leading-none mb-1 uppercase tracking-wider">{review.shoe.brand}</p>
                            <p className="text-sm font-bold text-neutral-800 truncate leading-tight group-hover:text-indigo-600 transition-colors">
                                {review.shoe.modelName}
                            </p>
                        </div>
                    </div>
                )}

                {/* ヘッダー: プラットフォームアバター + 著者名 */}
                <div className="flex items-center p-4 pb-2">
                    <div className={`h-8 w-8 ${platform.bgColor} flex items-center justify-center text-xs font-bold ${platform.color} rounded-full`}>
                        {platform.initial}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                                {authorDisplay || platform.label}
                            </p>
                            <span className="text-[10px] text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded leading-none">
                                外部
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <span className="flex items-center gap-0.5">
                                {langFlag} {platform.label}
                            </span>
                            {sentiment && (
                                <>
                                    <span>•</span>
                                    <span className={sentiment.color}>{sentiment.label}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 意見・感想（メインコンテンツ） */}
                <div className="px-4 pb-3 flex-grow">
                    {review.aiSummary ? (
                        <>
                            {/* AI抽出された意見をquoteスタイルで表示 */}
                            <div className="border-l-2 border-neutral-300 pl-3 mb-2">
                                <p className="text-sm text-neutral-800 leading-relaxed line-clamp-3 font-medium">
                                    {review.aiSummary}
                                </p>
                            </div>
                            {/* 元のスニペット（補足として薄く） */}
                            {review.snippet && (
                                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-1 mt-1">
                                    {review.snippet}
                                </p>
                            )}
                        </>
                    ) : review.snippet ? (
                        <div className="border-l-2 border-neutral-200 pl-3">
                            <p className="text-sm text-neutral-700 leading-relaxed line-clamp-3">
                                {contentPreview}
                            </p>
                        </div>
                    ) : null}
                </div>

                {/* キーポイント（あれば） */}
                {review.keyPoints.length > 0 && (
                    <div className="px-4 pb-3 flex flex-wrap gap-1 mt-auto">
                        {review.keyPoints.slice(0, 3).map((point, i) => (
                            <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 bg-neutral-50 text-neutral-500 border border-neutral-100 rounded"
                            >
                                {point.length > 20 ? point.slice(0, 20) + '…' : point}
                            </span>
                        ))}
                    </div>
                )}

                {/* フッター: 元記事リンク */}
                <div className="flex items-center px-4 py-3 border-t border-neutral-50 bg-neutral-50/50">
                    <ExternalLink className="w-3 h-3 text-neutral-400 mr-2 flex-shrink-0" />
                    <span className="text-xs text-neutral-500 truncate group-hover:text-indigo-600 group-hover:underline transition-colors">
                        {review.sourceTitle || '元の記事を読む'}
                    </span>
                    <Globe className="w-3 h-3 text-neutral-300 ml-auto flex-shrink-0" />
                </div>
            </Card>
        </a>
    )
}

// 外部レビューセクション（シューズ詳細ページ用）
export function ExternalReviewSection({ reviews }: { reviews: ExternalReviewData[] }) {
    if (reviews.length === 0) return null

    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-500" />
                    世界のランナーの声
                    <span className="text-sm font-normal text-neutral-500 ml-1">
                        ({reviews.length}件)
                    </span>
                </h2>
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span>外部レビュー</span>
                </div>
            </div>

            <p className="text-sm text-neutral-600 mb-6 bg-neutral-50 p-3 rounded border border-neutral-100">
                世界中のブログ・SNSから収集した個人レビューです。AI分析による要約を表示しています。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((review) => (
                    <ExternalReviewCard key={review.id} review={review} showShoeInfo={false} />
                ))}
            </div>

            <p className="text-xs text-neutral-400 mt-4 text-center">
                ※ 各レビューの権利は出典元の著者に帰属します。
            </p>
        </section>
    )
}
