import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { refreshCuratedSourcesForShoe } from '@/lib/curation/service'
import { generateSummarizedReview } from '@/lib/ai/summarizer'

const prisma = new PrismaClient()

// 認証チェック
function isAuthorized(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Vercel Cron Jobsからの呼び出し
    if (authHeader === `Bearer ${cronSecret}`) {
        return true
    }

    // または直接CRON_SECRETをクエリパラメータで渡す（デバッグ用）
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret')
    if (secret === cronSecret) {
        return true
    }

    return false
}

export async function GET(request: NextRequest) {
    // 認証チェック
    if (!isAuthorized(request)) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    try {
        console.log('Starting daily review generation via Cron...')

        // AI_SUMMARYレビューが存在しないシューズを取得
        const existingReviews = await prisma.review.findMany({
            where: { type: 'AI_SUMMARY' },
            select: { shoeId: true }
        })

        const existingShoeIds = existingReviews.map(r => r.shoeId)

        // 対象シューズを取得（最大10件/回で制限）
        const targetShoes = await prisma.shoe.findMany({
            where: {
                id: { notIn: existingShoeIds }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        console.log(`Found ${targetShoes.length} shoes needing reviews.`)

        const results = {
            processed: 0,
            success: 0,
            failed: 0,
            details: [] as { shoe: string; status: string; error?: string }[]
        }

        for (const shoe of targetShoes) {
            const shoeName = `${shoe.brand} ${shoe.modelName}`
            console.log(`Processing: ${shoeName}...`)

            try {
                // ソース収集
                const collectionResult = await refreshCuratedSourcesForShoe(shoe.id, {
                    maxResults: 5,
                    includeVideos: false,
                    includeWeb: true,
                })
                console.log(`  -> Created ${collectionResult.created} new sources.`)

                // ソース取得
                const sources = await prisma.curatedSource.findMany({
                    where: { shoeId: shoe.id },
                    take: 5,
                    orderBy: { reliability: 'desc' },
                })

                if (sources.length === 0) {
                    results.details.push({ shoe: shoeName, status: 'skipped', error: 'No sources found' })
                    results.failed++
                    continue
                }

                // 要約生成
                const summary = await generateSummarizedReview(
                    sources.map(s => ({
                        type: s.type === 'VIDEO' ? 'YOUTUBE_VIDEO' : 'WEB_ARTICLE',
                        title: s.title,
                        content: s.excerpt || '',
                        url: s.url,
                        author: s.author || undefined,
                    })),
                    shoe.brand,
                    shoe.modelName
                )

                // レビュー作成
                const createdReview = await prisma.review.create({
                    data: {
                        shoeId: shoe.id,
                        type: 'AI_SUMMARY',
                        title: summary.title,
                        content: summary.summary,
                        overallRating: summary.overallRating,
                        pros: summary.pros,
                        cons: summary.cons,
                        recommendedFor: summary.recommendedFor,
                        sourceCount: sources.length,
                    },
                })

                // ソース保存
                for (const source of sources) {
                    await prisma.aISource.create({
                        data: {
                            reviewId: createdReview.id,
                            sourceType: source.type === 'VIDEO' ? 'YOUTUBE_VIDEO' : 'WEB_ARTICLE',
                            sourceUrl: source.url,
                            sourceTitle: source.title,
                            sourceAuthor: source.author,
                            reliability: source.reliability,
                            scrapedAt: new Date(),
                        }
                    })
                }

                results.details.push({ shoe: shoeName, status: 'success' })
                results.success++

                // レート制限対策
                await new Promise(resolve => setTimeout(resolve, 5000))

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error)
                console.error(`  -> Error: ${errorMessage}`)
                results.details.push({ shoe: shoeName, status: 'failed', error: errorMessage })
                results.failed++
                await new Promise(resolve => setTimeout(resolve, 2000))
            }

            results.processed++
        }

        console.log(`Cron job completed. Success: ${results.success}, Failed: ${results.failed}`)

        return NextResponse.json({
            success: true,
            message: 'Daily review generation completed',
            results
        })

    } catch (error) {
        console.error('Cron job error:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}

// Vercel Cron Jobの設定
export const runtime = 'nodejs'
export const maxDuration = 300 // 5分（Pro planが必要）
