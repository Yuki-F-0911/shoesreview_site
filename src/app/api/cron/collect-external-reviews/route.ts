import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SERPER_API_KEY = process.env.SERPER_API_KEY || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

// 認証チェック
function isAuthorized(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (authHeader === `Bearer ${cronSecret}`) {
        return true
    }

    const url = new URL(request.url)
    const secret = url.searchParams.get('secret')
    if (secret === cronSecret) {
        return true
    }

    return false
}

// Serper APIで検索
async function searchSerper(query: string, numResults: number = 10): Promise<Array<{ title: string; link: string; snippet: string }>> {
    if (!SERPER_API_KEY) return []

    try {
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': SERPER_API_KEY,
            },
            body: JSON.stringify({
                q: query,
                num: numResults,
                gl: 'jp',
                hl: 'ja',
            }),
        })

        if (!response.ok) return []
        const data = await response.json()
        return data.organic || []
    } catch {
        return []
    }
}

// プラットフォーム検出
function detectPlatform(url: string): string | null {
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
    if (url.includes('reddit.com')) return 'reddit'
    if (url.includes('note.com')) return 'note'
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    return null
}

// URLからプラットフォーム固有のバリデーション
function isValidPost(url: string, platform: string): boolean {
    switch (platform) {
        case 'twitter':
            return url.includes('/status/')
        case 'reddit':
            return url.includes('/comments/')
        case 'note':
            return url.includes('/n/')
        case 'youtube':
            return url.includes('watch?v=') || url.includes('youtu.be/')
        default:
            return true
    }
}

// 著者名抽出
function extractAuthor(url: string, platform: string): string | null {
    switch (platform) {
        case 'twitter': {
            const match = url.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status/)
            return match ? `@${match[1]}` : null
        }
        case 'reddit': {
            const match = url.match(/reddit\.com\/r\/([^/]+)/)
            return match ? `r/${match[1]}` : null
        }
        case 'note': {
            const match = url.match(/note\.com\/([^/]+)/)
            return match ? match[1] : null
        }
        default:
            return null
    }
}

// Gemini APIでセンチメント分析
async function analyzeSentiment(text: string): Promise<{ sentiment: string; keyPoints: string[]; aiSummary: string } | null> {
    if (!GEMINI_API_KEY || !text) return null

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `以下のランニングシューズレビューのスニペットを分析してください。

テキスト: "${text}"

以下のJSON形式で回答してください（JSONのみ、他のテキストは不要）:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "keyPoints": ["ポイント1", "ポイント2"],
  "aiSummary": "1文での要約（日本語）"
}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 200,
                    }
                }),
            }
        )

        if (!response.ok) return null
        const data = await response.json()
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

        // JSONを抽出
        const jsonMatch = rawText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) return null

        return JSON.parse(jsonMatch[0])
    } catch {
        return null
    }
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log('Starting external review collection via Cron...')

        // ランニングカテゴリのシューズを取得（最大20件）
        const shoes = await prisma.shoe.findMany({
            where: {
                category: { in: ['Running', 'RUNNING', 'ランニング'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        })

        console.log(`Found ${shoes.length} shoes to process.`)

        const results = {
            processed: 0,
            created: 0,
            skipped: 0,
            failed: 0,
            details: [] as { shoe: string; status: string; count?: number; error?: string }[],
        }

        const platforms = ['twitter', 'reddit', 'note']
        const siteQueries: Record<string, string> = {
            twitter: '(site:twitter.com OR site:x.com)',
            reddit: 'site:reddit.com',
            note: 'site:note.com',
        }

        for (const shoe of shoes) {
            const shoeName = `${shoe.brand} ${shoe.modelName}`
            console.log(`Processing: ${shoeName}`)
            let shoeCreated = 0

            try {
                for (const platform of platforms) {
                    const query = `${shoe.brand} ${shoe.modelName} レビュー ${siteQueries[platform]}`
                    const searchResults = await searchSerper(query, 10)

                    for (const result of searchResults) {
                        const detectedPlatform = detectPlatform(result.link)
                        if (!detectedPlatform || detectedPlatform !== platform) continue
                        if (!isValidPost(result.link, platform)) continue

                        // 重複チェック
                        const existing = await prisma.externalReview.findFirst({
                            where: {
                                sourceUrl: result.link,
                                shoeId: shoe.id,
                            }
                        })
                        if (existing) {
                            results.skipped++
                            continue
                        }

                        const author = extractAuthor(result.link, platform)

                        // AI分析（スニペットがある場合）
                        const analysis = result.snippet
                            ? await analyzeSentiment(result.snippet)
                            : null

                        await prisma.externalReview.create({
                            data: {
                                shoeId: shoe.id,
                                platform,
                                sourceUrl: result.link,
                                sourceTitle: result.title || null,
                                authorName: author,
                                snippet: result.snippet?.slice(0, 200) || '',
                                aiSummary: analysis?.aiSummary || null,
                                language: 'ja',
                                sentiment: analysis?.sentiment || null,
                                keyPoints: analysis?.keyPoints || [],
                            }
                        })

                        shoeCreated++
                        results.created++
                    }

                    // API レート制限対策
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }

                results.details.push({ shoe: shoeName, status: 'success', count: shoeCreated })
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error)
                console.error(`  Error for ${shoeName}: ${errorMessage}`)
                results.details.push({ shoe: shoeName, status: 'failed', error: errorMessage })
                results.failed++
                await new Promise(resolve => setTimeout(resolve, 2000))
            }

            results.processed++
        }

        console.log(`Cron completed. Created: ${results.created}, Skipped: ${results.skipped}, Failed: ${results.failed}`)

        return NextResponse.json({
            success: true,
            message: 'External review collection completed',
            results,
        })
    } catch (error) {
        console.error('Cron job error:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}

export const runtime = 'nodejs'
export const maxDuration = 300
