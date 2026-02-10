/**
 * 音声レビューAI解析機能
 * 音声入力テキストを構造化レビューデータに変換
 */

import type { VoiceReviewResult } from '@/types/ai'

// gemini-2.5-flash を使用
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/**
 * Gemini APIを呼び出す
 */
async function callGeminiAPI(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error('AIアシスト機能は現在利用できません（設定が必要です）')
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2000,
            },
        }),
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Gemini API error:', response.status, errorData)
        throw new Error(`AI処理に失敗しました（エラーコード: ${response.status}）`)
    }

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
        throw new Error('AIからの応答が空でした')
    }

    return text
}

/**
 * JSONをパースする（コードブロック除去）
 */
function parseJSON<T>(text: string): T {
    let cleaned = text.trim()
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
    return JSON.parse(cleaned.trim())
}

/**
 * 音声入力テキストを構造化レビューデータに変換
 */
export async function analyzeVoiceReview(
    voiceText: string,
    shoeBrand?: string,
    shoeModel?: string
): Promise<VoiceReviewResult> {
    const shoeName = shoeBrand && shoeModel ? `${shoeBrand} ${shoeModel}` : 'このシューズ'

    const prompt = `あなたはランニングシューズの専門レビュアーです。
以下はユーザーがシューズについて音声で話した内容の文字起こしです。
この内容を解析して、構造化されたレビューデータをJSON形式で出力してください。

シューズ名: ${shoeName}
音声テキスト:
${voiceText}

以下のJSON形式で出力してください。すべてのフィールドに可能な限り値を付けてください。
音声テキストから読み取れない項目はnullにしてください。

{
  "overallRating": <0-10の数値。音声全体の印象から判断>,
  "comfortRating": <0-10。履き心地に関する言及から判断>,
  "cushioningRating": <0-10。クッション性に関する言及から判断>,
  "stabilityRating": <0-10。安定性に関する言及から判断>,
  "lightnessRating": <0-10。軽さに関する言及から判断>,
  "gripRating": <0-10。グリップ・滑りにくさに関する言及から判断>,
  "responsivenessRating": <0-10。反発力・推進力に関する言及から判断>,
  "designRating": <0-10。デザイン・見た目に関する言及から判断>,
  "durabilityRating": <0-10。耐久性に関する言及から判断>,
  "stepInToeWidth": <1-10。つま先の広さ。5=ちょうど良い, 1=狭い, 10=広い>,
  "stepInInstepHeight": <1-10。甲の高さ。5=ちょうど良い, 1=低い, 10=高い>,
  "stepInHeelHold": <1-10。ヒールホールド。5=ちょうど良い, 1=弱い, 10=強い>,
  "fatigueSole": <1-10。足裏の疲労。10=疲労なし, 1=強く疲労>,
  "fatigueCalf": <1-10。ふくらはぎの張り。10=張りなし, 1=強く張る>,
  "fatigueKnee": <1-10。膝への負担。10=負担なし, 1=強い負担>,
  "title": "<30文字以内のレビュータイトル>",
  "content": "<音声内容を自然な文章に整形した200-500文字のレビュー本文。絵文字不使用>",
  "pros": ["<長所1>", "<長所2>", ...],
  "cons": ["<短所1>", "<短所2>", ...],
  "usagePeriod": "<使用期間（例: 3ヶ月）。言及がなければnull>",
  "onomatopoeia": "<シューズの感触を表すオノマトペ（例: フワモチ）。言及がなければnull>",
  "purchaseSize": "<購入サイズ（例: 26.5cm）。言及がなければnull>"
}

重要なルール:
- 評価値は音声の文脈からニュアンスを読み取って適切な数値に変換してください
- 「すごくいい」→8-9、「まあまあ」→5-6、「ちょっと気になる」→3-4 のように解釈
- 長所・短所はそれぞれ最大5つ、各15文字以内
- レビュー本文は話し言葉を自然な書き言葉に変換してください
- JSONのみを出力してください`

    const result = await callGeminiAPI(prompt)

    try {
        const parsed = parseJSON<VoiceReviewResult>(result)

        // 値のバリデーションとクランプ
        const clamp = (v: number | undefined | null, min: number, max: number) =>
            v != null ? Math.max(min, Math.min(max, Math.round(v * 10) / 10)) : undefined

        return {
            overallRating: clamp(parsed.overallRating, 0, 10) ?? 5,
            comfortRating: clamp(parsed.comfortRating, 0, 10),
            cushioningRating: clamp(parsed.cushioningRating, 0, 10),
            stabilityRating: clamp(parsed.stabilityRating, 0, 10),
            lightnessRating: clamp(parsed.lightnessRating, 0, 10),
            gripRating: clamp(parsed.gripRating, 0, 10),
            responsivenessRating: clamp(parsed.responsivenessRating, 0, 10),
            designRating: clamp(parsed.designRating, 0, 10),
            durabilityRating: clamp(parsed.durabilityRating, 0, 10),
            stepInToeWidth: clamp(parsed.stepInToeWidth, 1, 10),
            stepInInstepHeight: clamp(parsed.stepInInstepHeight, 1, 10),
            stepInHeelHold: clamp(parsed.stepInHeelHold, 1, 10),
            fatigueSole: clamp(parsed.fatigueSole, 1, 10),
            fatigueCalf: clamp(parsed.fatigueCalf, 1, 10),
            fatigueKnee: clamp(parsed.fatigueKnee, 1, 10),
            title: parsed.title || '',
            content: parsed.content || '',
            pros: (parsed.pros || []).slice(0, 5),
            cons: (parsed.cons || []).slice(0, 5),
            usagePeriod: parsed.usagePeriod || undefined,
            onomatopoeia: parsed.onomatopoeia || undefined,
            purchaseSize: parsed.purchaseSize || undefined,
        }
    } catch (error) {
        console.error('音声レビュー解析のパースに失敗:', result)
        throw new Error('AI解析結果の解析に失敗しました。もう一度お試しください。')
    }
}
