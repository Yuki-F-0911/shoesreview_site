'use client'

/**
 * CitationBox - AIによる引用を促進するコンポーネント
 * 
 * GEO (Generative Engine Optimization) に基づき、
 * AIが情報を抽出・引用しやすい形式で要約を表示します。
 * 
 * 特徴:
 * - 結論を冒頭に配置（逆ピラミッド構造）
 * - 定量データ（数値）を明示
 * - 情報源を明記
 * - セマンティックHTMLで構造化
 */

import { Info, Star, MessageSquare, ExternalLink } from 'lucide-react'

interface CitationBoxProps {
    /** 引用される主要な結論・サマリー */
    summary: string
    /** 定量データ（オプション） */
    stats?: {
        rating?: number
        maxRating?: number
        reviewCount?: number
    }
    /** 情報源の説明（オプション） */
    source?: string
    /** 外部ソースへのリンク（オプション） */
    sourceUrl?: string
    /** バリアント */
    variant?: 'default' | 'highlight' | 'compact'
}

export function CitationBox({
    summary,
    stats,
    source,
    sourceUrl,
    variant = 'default',
}: CitationBoxProps) {
    const baseClasses = 'border rounded-xl p-4'
    const variantClasses = {
        default: 'bg-slate-50 border-slate-200',
        highlight: 'bg-indigo-50 border-indigo-200',
        compact: 'bg-white border-slate-200 p-3',
    }

    return (
        <aside
            className={`${baseClasses} ${variantClasses[variant]}`}
            role="complementary"
            aria-label="要約情報"
        >
            {/* 主要な結論（AIが最初に抽出しやすい位置） */}
            <p className="text-slate-800 font-medium leading-relaxed mb-3">
                {summary}
            </p>

            {/* 定量データ */}
            {stats && (
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                    {stats.rating !== undefined && (
                        <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <strong>{stats.rating}</strong>
                            {stats.maxRating && <span>/ {stats.maxRating}</span>}
                        </span>
                    )}
                    {stats.reviewCount !== undefined && (
                        <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4 text-slate-400" />
                            <span>{stats.reviewCount}件のレビュー</span>
                        </span>
                    )}
                </div>
            )}

            {/* 情報源 */}
            {source && (
                <div className="flex items-start gap-2 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                        {source}
                        {sourceUrl && (
                            <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 ml-1 text-indigo-600 hover:underline"
                            >
                                詳細
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </span>
                </div>
            )}
        </aside>
    )
}

/**
 * KeyTakeaway - 重要ポイントを強調するコンポーネント
 * AIが「結論」として抽出しやすい形式
 */
interface KeyTakeawayProps {
    /** タイトル */
    title?: string
    /** 重要ポイントのリスト */
    points: string[]
}

export function KeyTakeaway({ title = '重要ポイント', points }: KeyTakeawayProps) {
    if (points.length === 0) return null

    return (
        <aside
            className="bg-amber-50 border border-amber-200 rounded-xl p-4"
            role="complementary"
            aria-label={title}
        >
            <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-amber-500 rounded-full" />
                {title}
            </h3>
            <ul className="space-y-1.5">
                {points.map((point, index) => (
                    <li
                        key={index}
                        className="text-sm text-amber-900 flex items-start gap-2"
                    >
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{point}</span>
                    </li>
                ))}
            </ul>
        </aside>
    )
}

/**
 * QuickAnswer - Q&A形式の回答ボックス
 * FAQスキーマと組み合わせてAI検索に最適
 */
interface QuickAnswerProps {
    question: string
    answer: string
}

export function QuickAnswer({ question, answer }: QuickAnswerProps) {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-bold text-blue-800 mb-2">
                Q: {question}
            </p>
            <p className="text-sm text-blue-900">
                A: {answer}
            </p>
        </div>
    )
}
