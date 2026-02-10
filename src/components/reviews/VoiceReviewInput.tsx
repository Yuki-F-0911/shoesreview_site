'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import type { VoiceReviewResult } from '@/types/ai'

interface VoiceReviewInputProps {
    shoeBrand?: string
    shoeModel?: string
    onApplyResult: (result: VoiceReviewResult) => void
    disabled?: boolean
}

type VoiceState = 'idle' | 'recording' | 'recorded' | 'analyzing' | 'done' | 'error'

// Web Speech API の型定義
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface SpeechRecognitionResultList {
    length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
    length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
    isFinal: boolean
}

interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
}

interface SpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    start(): void
    stop(): void
    abort(): void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
    onstart: (() => void) | null
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition
        webkitSpeechRecognition: new () => SpeechRecognition
    }
}

export function VoiceReviewInput({
    shoeBrand,
    shoeModel,
    onApplyResult,
    disabled = false,
}: VoiceReviewInputProps) {
    const [state, setState] = useState<VoiceState>('idle')
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [result, setResult] = useState<VoiceReviewResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isSupported, setIsSupported] = useState(true)
    const recognitionRef = useRef<SpeechRecognition | null>(null)

    // ブラウザの音声認識サポートを確認
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
            setIsSupported(!!SpeechRecognitionAPI)
        }
    }, [])

    // 録音開始
    const startRecording = useCallback(() => {
        setError(null)
        setTranscript('')
        setInterimTranscript('')
        setResult(null)

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognitionAPI) {
            setError('お使いのブラウザは音声入力に対応していません')
            return
        }

        const recognition = new SpeechRecognitionAPI()
        recognition.lang = 'ja-JP'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
            setState('recording')
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalText = ''
            let interimText = ''

            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i]
                if (result.isFinal) {
                    finalText += result[0].transcript
                } else {
                    interimText += result[0].transcript
                }
            }

            setTranscript(finalText)
            setInterimTranscript(interimText)
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error)
            if (event.error !== 'aborted') {
                setError(`音声認識エラー: ${event.error}`)
                setState('idle')
            }
        }

        recognition.onend = () => {
            // continuous modeでも予期せず終了することがある
            if (state === 'recording') {
                setState('recorded')
            }
        }

        recognitionRef.current = recognition
        recognition.start()
    }, [state])

    // 録音停止
    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            recognitionRef.current = null
        }
        setState('recorded')
    }, [])

    // AI解析
    const analyzeWithAI = useCallback(async () => {
        const textToAnalyze = transcript + interimTranscript
        if (!textToAnalyze.trim()) {
            setError('音声テキストが空です')
            return
        }

        setState('analyzing')
        setError(null)

        try {
            const response = await fetch('/api/ai/voice-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voiceText: textToAnalyze,
                    shoeBrand,
                    shoeModel,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'AI解析に失敗しました')
            }

            setResult(data.data)
            setState('done')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'AI解析に失敗しました')
            setState('recorded')
        }
    }, [transcript, interimTranscript, shoeBrand, shoeModel])

    // 結果をフォームに適用
    const handleApply = useCallback(() => {
        if (result) {
            onApplyResult(result)
            // リセット
            setState('idle')
            setTranscript('')
            setInterimTranscript('')
            setResult(null)
        }
    }, [result, onApplyResult])

    // リセット
    const handleReset = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.abort()
            recognitionRef.current = null
        }
        setState('idle')
        setTranscript('')
        setInterimTranscript('')
        setResult(null)
        setError(null)
    }, [])

    if (!isSupported) {
        return null
    }

    const fullTranscript = transcript + interimTranscript

    return (
        <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-purple-800">音声入力でレビュー</h3>
                    <span className="text-xs text-purple-500">— シューズの感想を話すだけでAIが自動入力</span>
                </div>

                {error && (
                    <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>
                )}

                {/* 録音待機状態 */}
                {state === 'idle' && (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-600 mb-3">
                            マイクボタンを押して、シューズの感想を自由に話してください。
                            <br />
                            <span className="text-xs text-gray-400">
                                例: 「クッションがすごく柔らかくて長距離でも疲れにくい。ただちょっと重いかな...」
                            </span>
                        </p>
                        <Button
                            type="button"
                            onClick={startRecording}
                            disabled={disabled}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-3"
                        >
                            <svg className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                            </svg>
                            音声入力を開始
                        </Button>
                    </div>
                )}

                {/* 録音中 */}
                {state === 'recording' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 py-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <span className="text-sm font-medium text-red-600">録音中...</span>
                        </div>

                        {fullTranscript && (
                            <div className="rounded-md bg-white p-3 text-sm text-gray-700 border border-gray-200 min-h-[60px]">
                                <span>{transcript}</span>
                                <span className="text-gray-400">{interimTranscript}</span>
                            </div>
                        )}

                        <div className="flex justify-center gap-2">
                            <Button
                                type="button"
                                onClick={stopRecording}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                録音を停止
                            </Button>
                        </div>
                    </div>
                )}

                {/* 録音完了・解析待ち */}
                {state === 'recorded' && (
                    <div className="space-y-3">
                        <div className="rounded-md bg-white p-3 text-sm text-gray-700 border border-gray-200 min-h-[60px]">
                            {fullTranscript || <span className="text-gray-400">（音声が認識されませんでした）</span>}
                        </div>

                        <div className="flex justify-center gap-2">
                            <Button type="button" variant="outline" onClick={handleReset}>
                                やり直す
                            </Button>
                            <Button
                                type="button"
                                onClick={analyzeWithAI}
                                disabled={!fullTranscript.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                <svg className="h-4 w-4 mr-2 inline" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                                </svg>
                                AIで解析する
                            </Button>
                        </div>
                    </div>
                )}

                {/* AI解析中 */}
                {state === 'analyzing' && (
                    <div className="text-center py-6">
                        <div className="inline-flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm font-medium text-indigo-700">AIが解析中...</span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">評価項目・長所短所・レビュー本文を自動生成しています</p>
                    </div>
                )}

                {/* 解析完了・プレビュー */}
                {state === 'done' && result && (
                    <div className="space-y-3">
                        <div className="rounded-md bg-white p-4 border border-green-200">
                            <h4 className="text-sm font-medium text-green-800 mb-2">✅ AI解析完了</h4>

                            {/* タイトル */}
                            <div className="mb-2">
                                <span className="text-xs text-gray-500">タイトル: </span>
                                <span className="text-sm font-medium">{result.title}</span>
                            </div>

                            {/* 評価値サマリー */}
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 mb-2">
                                <RatingBadge label="総合" value={result.overallRating} />
                                {result.comfortRating != null && <RatingBadge label="履き心地" value={result.comfortRating} />}
                                {result.cushioningRating != null && <RatingBadge label="クッション" value={result.cushioningRating} />}
                                {result.stabilityRating != null && <RatingBadge label="安定性" value={result.stabilityRating} />}
                                {result.lightnessRating != null && <RatingBadge label="軽さ" value={result.lightnessRating} />}
                                {result.gripRating != null && <RatingBadge label="グリップ" value={result.gripRating} />}
                                {result.responsivenessRating != null && <RatingBadge label="反発" value={result.responsivenessRating} />}
                                {result.designRating != null && <RatingBadge label="デザイン" value={result.designRating} />}
                                {result.durabilityRating != null && <RatingBadge label="耐久性" value={result.durabilityRating} />}
                            </div>

                            {/* 長所・短所 */}
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {result.pros.length > 0 && (
                                    <div>
                                        <span className="text-xs text-green-600 font-medium">長所</span>
                                        <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                                            {result.pros.map((p, i) => <li key={i}>+ {p}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {result.cons.length > 0 && (
                                    <div>
                                        <span className="text-xs text-red-600 font-medium">短所</span>
                                        <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                                            {result.cons.map((c, i) => <li key={i}>- {c}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* 本文プレビュー */}
                            <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 max-h-24 overflow-y-auto">
                                {result.content}
                            </div>
                        </div>

                        <div className="flex justify-center gap-2">
                            <Button type="button" variant="outline" onClick={handleReset}>
                                やり直す
                            </Button>
                            <Button
                                type="button"
                                onClick={handleApply}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                この内容でフォームに反映
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function RatingBadge({ label, value }: { label: string; value: number }) {
    const color = value >= 7 ? 'text-green-700 bg-green-50' : value >= 4 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'
    return (
        <div className={`text-center rounded px-1 py-0.5 ${color}`}>
            <div className="text-[10px] leading-tight">{label}</div>
            <div className="text-sm font-bold">{value}</div>
        </div>
    )
}
