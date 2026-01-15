/**
 * AIレビューアシスト機能
 * ユーザーのレビュー執筆を補助するAI機能
 * ※ AIはオプションとして提供し、ユーザーが選択して使用
 */

import type { ReviewAssistInput, ReviewAssistOutput } from '@/types/ai'

// gemini-2.5-flash を使用（ドキュメント: https://ai.google.dev/gemini-api/docs）
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/**
 * Gemini APIを呼び出す共通関数
 */
async function callGeminiAPI(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.error('GEMINI_API_KEY is not set')
        throw new Error('AIアシスト機能は現在利用できません（設定が必要です）')
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                },
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Gemini API error response:', response.status, errorData)
            throw new Error(`AI処理に失敗しました（エラーコード: ${response.status}）`)
        }

        const result = await response.json()
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
            console.error('Gemini API returned empty response:', result)
            throw new Error('AIからの応答が空でした')
        }

        return text
    } catch (error) {
        if (error instanceof Error && error.message.includes('AI')) {
            throw error
        }
        console.error('Gemini API call failed:', error)
        throw new Error('AI処理中にエラーが発生しました')
    }
}

/**
 * JSONをパースする（コードブロックを除去）
 */
function parseJSON<T>(text: string): T {
    let cleaned = text.trim()

    // JSONコードブロックを除去
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7)
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3)
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3)
    }
    cleaned = cleaned.trim()

    return JSON.parse(cleaned)
}

/**
 * キーワードからレビュー下書きを生成
 */
export async function generateReviewDraft(
    keywords: string,
    shoeBrand?: string,
    shoeModel?: string
): Promise<string> {
    const shoeName = shoeBrand && shoeModel ? `${shoeBrand} ${shoeModel}` : 'このシューズ'

    const prompt = `あなたはランニングシューズのレビューライターです。
以下のキーワードや箇条書きを基に、自然な日本語のレビュー文を生成してください。

シューズ名: ${shoeName}
キーワード/箇条書き:
${keywords}

要件:
- 200〜400文字程度で書いてください
- 実際にシューズを使用した体験談のような文体で書いてください
- キーワードの内容を自然に盛り込んでください
- 良い点だけでなく、気になる点も含まれている場合はバランスよく書いてください
- 絵文字は使わないでください

レビュー文のみを出力してください（説明や前置きは不要です）:`

    return callGeminiAPI(prompt)
}

/**
 * レビュー本文から長所・短所を抽出
 */
export async function extractProsCons(
    content: string,
    shoeBrand?: string,
    shoeModel?: string
): Promise<{ pros: string[]; cons: string[] }> {
    const shoeName = shoeBrand && shoeModel ? `${shoeBrand} ${shoeModel}` : 'このシューズ'

    const prompt = `あなたはランニングシューズの専門家です。
以下のレビュー文から、シューズの長所と短所を抽出してください。

シューズ名: ${shoeName}
レビュー文:
${content}

要件:
- 長所と短所をそれぞれ最大5つまで抽出してください
- 各項目は15文字以内の簡潔な表現にしてください
- レビュー文に明示されていない内容は推測しないでください
- JSON形式で出力してください

出力形式:
{
  "pros": ["長所1", "長所2", ...],
  "cons": ["短所1", "短所2", ...]
}

JSONのみを出力してください:`

    const result = await callGeminiAPI(prompt)

    try {
        const parsed = parseJSON<{ pros: string[]; cons: string[] }>(result)
        return {
            pros: parsed.pros?.slice(0, 5) || [],
            cons: parsed.cons?.slice(0, 5) || [],
        }
    } catch {
        console.error('長所短所のパースに失敗:', result)
        return { pros: [], cons: [] }
    }
}

/**
 * レビュー本文からタイトルを提案
 */
export async function suggestTitles(
    content: string,
    shoeBrand?: string,
    shoeModel?: string
): Promise<string[]> {
    const shoeName = shoeBrand && shoeModel ? `${shoeBrand} ${shoeModel}` : 'このシューズ'

    const prompt = `あなたはコピーライターです。
以下のレビュー文に対して、魅力的なタイトルを3つ提案してください。

シューズ名: ${shoeName}
レビュー文:
${content}

要件:
- 各タイトルは30文字以内にしてください
- レビューの核心を捉えたタイトルにしてください
- 1つ目は率直なタイトル、2つ目は特徴を強調したタイトル、3つ目はキャッチーなタイトルにしてください
- JSON配列形式で出力してください

出力形式:
["タイトル1", "タイトル2", "タイトル3"]

JSON配列のみを出力してください:`

    const result = await callGeminiAPI(prompt)

    try {
        const parsed = parseJSON<string[]>(result)
        return parsed?.slice(0, 3) || []
    } catch {
        console.error('タイトルのパースに失敗:', result)
        return []
    }
}

/**
 * AIレビューアシスト統合関数
 */
export async function generateReviewAssist(
    input: ReviewAssistInput
): Promise<ReviewAssistOutput> {
    switch (input.type) {
        case 'draft':
            const draft = await generateReviewDraft(
                input.input,
                input.shoeBrand,
                input.shoeModel
            )
            return { draft }

        case 'pros_cons':
            const { pros, cons } = await extractProsCons(
                input.input,
                input.shoeBrand,
                input.shoeModel
            )
            return { pros, cons }

        case 'title':
            const titles = await suggestTitles(
                input.input,
                input.shoeBrand,
                input.shoeModel
            )
            return { titles }

        default:
            throw new Error(`Unknown assist type: ${input.type}`)
    }
}
