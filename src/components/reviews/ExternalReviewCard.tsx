'use client'

import { ExternalLink, Globe, MessageSquare } from 'lucide-react'

interface ExternalReviewData {
    id: string
    platform: string
    sourceUrl: string
    sourceTitle: string | null
    authorName: string | null
    snippet: string
    aiSummary: string | null
    language: string
    sentiment: string | null
    keyPoints: string[]
    publishedAt: string | null
    collectedAt: string
}

// プラットフォームアイコンと色の設定
const platformConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    reddit: { label: 'Reddit', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    twitter: { label: 'X/Twitter', color: 'text-sky-500', bgColor: 'bg-sky-50' },
    youtube: { label: 'YouTube', color: 'text-red-600', bgColor: 'bg-red-50' },
    blog: { label: 'Blog', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    strava: { label: 'Strava', color: 'text-orange-500', bgColor: 'bg-orange-50' },
    instagram: { label: 'Instagram', color: 'text-pink-600', bgColor: 'bg-pink-50' },
    threads: { label: 'Threads', color: 'text-gray-800', bgColor: 'bg-gray-50' },
}

const sentimentConfig: Record<string, { label: string; color: string; emoji: string }> = {
    positive: { label: 'ポジティブ', color: 'text-emerald-600', emoji: '👍' },
    negative: { label: 'ネガティブ', color: 'text-red-500', emoji: '👎' },
    neutral: { label: '中立', color: 'text-slate-500', emoji: '➖' },
    mixed: { label: '賛否あり', color: 'text-amber-500', emoji: '🤔' },
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
    const sentiment = review.sentiment ? sentimentConfig[review.sentiment] || sentimentConfig.neutral : null
    const langFlag = languageFlags[review.language] || '🌐'

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            {/* ヘッダー: プラットフォーム + 言語 + センチメント */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${platform.bgColor} ${platform.color}`}>
                        {platform.label}
                    </span>
                    <span className="text-sm" title={review.language === 'ja' ? '日本語' : '英語'}>
                        {langFlag}
                    </span>
                </div>
                {sentiment && (
                    <span className={`text-xs ${sentiment.color} flex items-center gap-1`}>
                        <span>{sentiment.emoji}</span>
                        <span>{sentiment.label}</span>
                    </span>
                )}
            </div>

            {/* AI要約 */}
            {review.aiSummary && (
                <div className="mb-3">
                    <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {review.aiSummary}
                        </p>
                    </div>
                </div>
            )}

            {/* キーポイント */}
            {review.keyPoints.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {review.keyPoints.map((point, i) => (
                        <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full"
                        >
                            {point}
                        </span>
                    ))}
                </div>
            )}

            {/* 著者情報 */}
            {review.authorName && (
                <p className="text-xs text-slate-400 mb-2">
                    by {review.authorName}
                </p>
            )}

            {/* 元記事リンク（最も重要な要素） */}
            <a
                href={review.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium truncate group-hover:underline">
                    {review.sourceTitle || '元の記事を読む'}
                </span>
                <Globe className="w-3 h-3 text-slate-300 flex-shrink-0" />
            </a>
        </div>
    )
}

// 外部レビューセクション（シューズ詳細ページ用）
export function ExternalReviewSection({ reviews }: { reviews: ExternalReviewData[] }) {
    if (reviews.length === 0) return null

    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                    世界のランナーの声
                    <span className="text-lg font-normal text-slate-500 ml-2">
                        ({reviews.length}件)
                    </span>
                </h2>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span>外部レビュー</span>
                </div>
            </div>

            <p className="text-sm text-slate-500 mb-4">
                世界中のブログ・SNSから収集した個人レビューです。各リンクから元の記事をお読みいただけます。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((review) => (
                    <ExternalReviewCard key={review.id} review={review} />
                ))}
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center">
                ※ 出典元の著者に帰属する内容です。AI による独自要約を含みます。
            </p>
        </section>
    )
}
