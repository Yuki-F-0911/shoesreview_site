
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

async function enrichReviewWithAI(review: any) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // JSON抽出
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/{[\s\S]*}/)
        if (!jsonMatch) {
            console.warn(`JSON parsing failed for review ${review.id}`)
            return null
        }

        const { aiSummary, sentiment, keyPoints } = JSON.parse(jsonMatch[1] || jsonMatch[0])

        if (!aiSummary) {
            console.log(`Skipping review ${review.id}: No personal opinion detected`)
            return null
        }

        // DB更新
        await prisma.externalReview.update({
            where: { id: review.id },
            data: {
                aiSummary,
                sentiment: sentiment || 'neutral',
                keyPoints: keyPoints || [],
                // 収集済みなのでcollectedAtは更新しない
            }
        })

        console.log(`Updated review ${review.id}: ${aiSummary.substring(0, 30)}...`)
        return true

    } catch (error) {
        console.error(`Error processing review ${review.id}:`, error)
        return null
    }
}

async function main() {
    console.log('Starting AI enrichment for external reviews...')

    // AI要約がないレビューを取得（includeなし）
    const reviewsToProcess = await prisma.externalReview.findMany({
        where: {
            aiSummary: null,
            snippet: { not: null }
        },
        take: 100 // 一回の上限
    })

    console.log(`Found ${reviewsToProcess.length} reviews to process.`)

    let processedCount = 0
    for (const review of reviewsToProcess) {
        // APIレート制限考慮
        await sleep(2000)

        // シューズ情報を個別に取得
        const shoe = await prisma.shoe.findUnique({
            where: { id: review.shoeId }
        })

        if (!shoe) {
            console.warn(`Shoe not found for review ${review.id}`)
            continue
        }

        const success = await enrichReviewWithAI({ ...review, shoe })
        if (success) processedCount++
    }

    console.log(`Finished! Successfully processed ${processedCount}/${reviewsToProcess.length} reviews.`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
