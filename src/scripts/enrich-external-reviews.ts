
import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

// 環境変数の読み込み
dotenv.config()
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function callGeminiWithRetry(prompt: string, maxRetries: number = 3): Promise<string | null> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(prompt)
            const response = await result.response
            return response.text()
        } catch (error: any) {
            const statusCode = error?.status || error?.httpStatusCode || 0
            const isRateLimit = statusCode === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')

            if (isRateLimit && attempt < maxRetries) {
                // エクスポネンシャルバックオフ: 10s, 30s, 60s
                const waitTime = Math.min(10000 * Math.pow(3, attempt), 60000)
                console.log(`  ⏳ レート制限、${waitTime / 1000}秒待機... (リトライ ${attempt + 1}/${maxRetries})`)
                await sleep(waitTime)
                continue
            }

            throw error
        }
    }

    return null
}

async function enrichReviewWithAI(review: any) {
    try {
        const prompt = `
以下は「${review.shoe.brand} ${review.shoe.modelName}」に関するウェブ上のレビュー（スニペット）です。
この内容を元に、**日本語で**個人の意見・感想を要約してください。

タイトル: ${review.sourceTitle}
スニペット: ${review.snippet}

以下のJSON形式で出力してください：
\`\`\`json
{
  "aiSummary": "著者の感想・意見の要約（日本語、60-80文字程度。〜だ、〜である調）",
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "keyPoints": ["短いキーワード1", "短いキーワード2", "短いキーワード3"]
}
\`\`\`

注意点:
- 元の文章が英語でも、必ず**日本語**で出力すること。
- 「素晴らしいクッション性」「価格が高い」など、具体的な感想を抜き出すこと。
- 著者の主観がない（単なる製品説明）場合は、aiSummaryをnullにすること。
`

        const text = await callGeminiWithRetry(prompt)
        if (!text) {
            console.warn(`  ⚠️ Empty response for review ${review.id}`)
            return null
        }

        // JSON抽出
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/{[\s\S]*}/)
        if (!jsonMatch) {
            console.warn(`  ⚠️ JSON parsing failed for review ${review.id}`)
            return null
        }

        const { aiSummary, sentiment, keyPoints } = JSON.parse(jsonMatch[1] || jsonMatch[0])

        if (!aiSummary) {
            console.log(`  ⏭️ Skipping review ${review.id}: No personal opinion detected`)
            return null
        }

        // DB更新
        await prisma.externalReview.update({
            where: { id: review.id },
            data: {
                aiSummary,
                sentiment: sentiment || 'neutral',
                keyPoints: keyPoints || [],
            }
        })

        console.log(`  ✅ ${review.shoe.brand} ${review.shoe.modelName}: ${aiSummary.substring(0, 40)}...`)
        return true

    } catch (error: any) {
        console.error(`  ❌ Error review ${review.id}:`, error?.message || error)
        return null
    }
}

async function main() {
    console.log('🚀 Starting AI enrichment for external reviews...\n')

    // AI要約がないレビューを取得
    const reviewsToProcess = await prisma.externalReview.findMany({
        where: {
            aiSummary: null,
            snippet: { not: '' }
        },
        take: 10 // 無料枠レート制限を考慮して10件ずつ
    })

    console.log(`📋 Found ${reviewsToProcess.length} reviews to process.\n`)

    if (reviewsToProcess.length === 0) {
        console.log('✨ All reviews already have AI summaries!')
        return
    }

    let processedCount = 0
    let errorCount = 0

    for (let i = 0; i < reviewsToProcess.length; i++) {
        const review = reviewsToProcess[i]

        console.log(`[${i + 1}/${reviewsToProcess.length}] Processing review ${review.id}...`)

        // シューズ情報を個別に取得
        const shoe = await prisma.shoe.findUnique({
            where: { id: review.shoeId }
        })

        if (!shoe) {
            console.warn(`  ⚠️ Shoe not found for review ${review.id}`)
            continue
        }

        const success = await enrichReviewWithAI({ ...review, shoe })
        if (success) {
            processedCount++
        } else {
            errorCount++
        }

        // APIレート制限考慮: 10秒間隔
        if (i < reviewsToProcess.length - 1) {
            await sleep(10000)
        }
    }

    console.log(`\n🏁 Finished! Successfully processed ${processedCount}/${reviewsToProcess.length} reviews. (${errorCount} errors)`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
