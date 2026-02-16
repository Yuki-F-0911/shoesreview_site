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

export function ExternalReviewCard({ review }: { review: ExternalReviewData }) {
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

    return (
        <a
            href={review.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
        >
            <Card className="overflow-hidden card-hover h-full">
                {/* ヘッダー: プラットフォームアバター + 著者名 */}
                <div className="flex items-center p-4 pb-3">
                    <div className={`h-9 w-9 ${platform.bgColor} flex items-center justify-center text-sm font-bold ${platform.color}`}>
                        {platform.initial}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                            {authorDisplay || platform.label}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                            <span>{langFlag}</span>
                            <span>{platform.label}</span>
                            {sentiment && (
                                <>
                                    <span>·</span>
                                    <span className={sentiment.color}>{sentiment.label}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <span className="text-xs text-neutral-300 border border-neutral-200 px-2 py-0.5">
                        外部
                    </span>
                </div>

                {/* 意見・感想（メインコンテンツ） */}
                <div className="px-4 pb-3">
                    {review.aiSummary ? (
                        <>
                            {/* AI抽出された意見をquoteスタイルで表示 */}
                            <div className="border-l-2 border-neutral-300 pl-3 mb-2">
                                <p className="text-sm text-neutral-800 leading-relaxed line-clamp-3">
                                    {review.aiSummary}
                                </p>
                            </div>
                            {/* 元のスニペット（補足として薄く） */}
                            {review.snippet && (
                                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 mt-1">
                                    {review.snippet.length > 80 ? review.snippet.slice(0, 80) + '...' : review.snippet}
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
                    <div className="px-4 pb-3 flex flex-wrap gap-1">
                        {review.keyPoints.slice(0, 3).map((point, i) => (
                            <span
                                key={i}
                                className="text-xs px-2 py-0.5 bg-neutral-50 text-neutral-500 border border-neutral-100"
                            >
                                {point.length > 20 ? point.slice(0, 20) + '…' : point}
                            </span>
                        ))}
                    </div>
                )}

                {/* フッター: 元記事リンク */}
                <div className="flex items-center px-4 pb-4 pt-2 border-t border-neutral-100">
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-300 mr-2 flex-shrink-0" />
                    <span className="text-xs text-neutral-400 truncate group-hover:text-neutral-600 group-hover:underline transition-colors">
                        {review.sourceTitle || '元の記事を読む'}
                    </span>
                    <Globe className="w-3 h-3 text-neutral-200 ml-auto flex-shrink-0" />
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
                <h2 className="text-2xl font-bold text-neutral-800">
                    世界のランナーの声
                    <span className="text-lg font-normal text-neutral-400 ml-2">
                        ({reviews.length}件)
                    </span>
                </h2>
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span>外部レビュー</span>
                </div>
            </div>

            <p className="text-sm text-neutral-500 mb-4">
                世界中のブログ・SNSから収集した個人レビューです。各リンクから元の記事をお読みいただけます。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((review) => (
                    <ExternalReviewCard key={review.id} review={review} />
                ))}
            </div>

            <p className="text-xs text-neutral-400 mt-4 text-center">
                ※ 出典元の著者に帰属する内容です。AI による独自要約を含みます。
            </p>
        </section>
    )
}
