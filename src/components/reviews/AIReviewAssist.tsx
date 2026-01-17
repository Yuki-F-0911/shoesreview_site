'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import type { ReviewAssistOutput } from '@/types/ai'

interface AIReviewAssistProps {
    shoeBrand?: string
    shoeModel?: string
    onUseDraft: (draft: string) => void
    onUseProsCons: (pros: string[], cons: string[]) => void
    onUseTitle: (title: string) => void
}

type AIMode = 'draft' | 'pros_cons' | 'title' | null

export function AIReviewAssist({
    shoeBrand,
    shoeModel,
    onUseDraft,
    onUseProsCons,
    onUseTitle,
}: AIReviewAssistProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [mode, setMode] = useState<AIMode>(null)
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<ReviewAssistOutput | null>(null)

    const handleGenerate = async () => {
        if (!mode || !input.trim()) return

        setIsLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/ai/review-assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: mode,
                    input,
                    shoeBrand,
                    shoeModel,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'エラーが発生しました')
                return
            }

            setResult(data.data)
        } catch {
            setError('通信エラーが発生しました')
        } finally {
            setIsLoading(false)
        }
    }

    const handleUseDraft = () => {
        if (result?.draft) {
            onUseDraft(result.draft)
            handleClose()
        }
    }

    const handleUseProsCons = () => {
        if (result?.pros || result?.cons) {
            onUseProsCons(result.pros || [], result.cons || [])
            handleClose()
        }
    }

    const handleUseTitle = (title: string) => {
        onUseTitle(title)
        handleClose()
    }

    const handleClose = () => {
        setIsOpen(false)
        setMode(null)
        setInput('')
        setResult(null)
        setError(null)
    }

    if (!isOpen) {
        return (
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                    AIアシスト
                </Button>
                <span className="text-xs text-gray-400">（オプション）</span>
            </div>
        )
    }

    return (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-purple-800">
                    AIアシスタント
                </h3>
                <button
                    type="button"
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    ×
                </button>
            </div>

            {!mode && (
                <div className="space-y-2">
                    <p className="text-sm text-gray-600">何をお手伝いしますか？</p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMode('draft')}
                        >
                            下書き生成
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMode('pros_cons')}
                        >
                            長所・短所提案
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMode('title')}
                        >
                            タイトル提案
                        </Button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        ※ AIは補助ツールです。生成された内容は自由に編集できます。
                    </p>
                </div>
            )}

            {mode === 'draft' && !result && (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                        シューズの感想をキーワードや箇条書きで入力してください：
                    </p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="例：
・軽くて走りやすい
・クッションが柔らかい
・少し幅が狭い
・マラソン練習に最適"
                        rows={5}
                        disabled={isLoading}
                    />
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleGenerate}
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? '生成中...' : '下書きを生成'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode(null)}
                            disabled={isLoading}
                        >
                            戻る
                        </Button>
                    </div>
                </div>
            )}

            {mode === 'pros_cons' && !result && (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                        レビュー本文を入力してください（長所・短所を自動抽出します）：
                    </p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="レビュー本文を入力..."
                        rows={5}
                        disabled={isLoading}
                    />
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleGenerate}
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? '抽出中...' : '長所・短所を抽出'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode(null)}
                            disabled={isLoading}
                        >
                            戻る
                        </Button>
                    </div>
                </div>
            )}

            {mode === 'title' && !result && (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                        レビュー本文を入力してください（タイトルを提案します）：
                    </p>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="レビュー本文を入力..."
                        rows={5}
                        disabled={isLoading}
                    />
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleGenerate}
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? '提案中...' : 'タイトルを提案'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode(null)}
                            disabled={isLoading}
                        >
                            戻る
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-3 rounded bg-red-100 p-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* 結果表示: 下書き */}
            {result?.draft && (
                <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">生成された下書き：</p>
                    <div className="rounded bg-white p-3 text-sm">
                        {result.draft}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleUseDraft}>
                            この内容を使用
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => { setResult(null); handleGenerate() }}
                        >
                            再生成
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                        >
                            キャンセル
                        </Button>
                    </div>
                </div>
            )}

            {/* 結果表示: 長所・短所 */}
            {(result?.pros || result?.cons) && (
                <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">抽出された長所・短所：</p>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded bg-green-50 p-3">
                            <p className="mb-2 text-sm font-medium text-green-700">長所</p>
                            <ul className="space-y-1 text-sm">
                                {result.pros?.map((pro, i) => (
                                    <li key={i}>• {pro}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded bg-red-50 p-3">
                            <p className="mb-2 text-sm font-medium text-red-700">短所</p>
                            <ul className="space-y-1 text-sm">
                                {result.cons?.map((con, i) => (
                                    <li key={i}>• {con}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleUseProsCons}>
                            この内容を使用
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                        >
                            キャンセル
                        </Button>
                    </div>
                </div>
            )}

            {/* 結果表示: タイトル */}
            {result?.titles && (
                <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">タイトル候補：</p>
                    <div className="space-y-2">
                        {result.titles.map((title, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between rounded bg-white p-2"
                            >
                                <span className="text-sm">{title}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUseTitle(title)}
                                >
                                    使用
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                    >
                        キャンセル
                    </Button>
                </div>
            )}
        </div>
    )
}
