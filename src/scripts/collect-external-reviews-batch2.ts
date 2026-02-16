/**
 * 外部レビュー大量収集スクリプト（バッチ2）
 * 
 * より多くの検索パターンで個人レビューを収集
 * ターゲット: 残り85件（合計100件を目指す）
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const EXCLUDED_DOMAINS = [
    'nike.com', 'adidas.com', 'adidas.jp', 'asics.com', 'newbalance.jp',
    'mizunoshop.net', 'puma.com', 'reebok.jp', 'hoka.com', 'on-running.com',
    'brooksrunning.com', 'saucony.com',
    'amazon.co.jp', 'amazon.com', 'rakuten.co.jp', 'yahoo.co.jp',
    'shop.', 'store.', 'buy.', 'kakaku.com', 'price.com',
]

interface SearchResult {
    title: string
    url: string
    snippet: string
}

async function searchWeb(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID
    if (!apiKey || !searchEngineId) throw new Error('Search API keys required')

    const params = new URLSearchParams({
        key: apiKey, cx: searchEngineId,
        q: query, num: Math.min(maxResults, 10).toString(),
    })

    try {
        const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`)
        if (!response.ok) {
            const err = await response.text()
            console.warn(`  Search API error: ${err.substring(0, 100)}`)
            return []
        }
        const data = await response.json()
        return (data.items || []).map((item: any) => ({
            title: item.title, url: item.link, snippet: item.snippet || '',
        }))
    } catch (e) {
        console.warn(`  Search error: ${e instanceof Error ? e.message : e}`)
        return []
    }
}

function isExcluded(url: string): boolean {
    try {
        const host = new URL(url).hostname.toLowerCase()
        return EXCLUDED_DOMAINS.some(d => host.includes(d))
    } catch { return true }
}

function classifyPlatform(url: string): string {
    try {
        const host = new URL(url).hostname.toLowerCase()
        if (host.includes('reddit.com')) return 'reddit'
        if (host.includes('twitter.com') || host.includes('x.com')) return 'twitter'
        if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube'
        if (host.includes('strava.com')) return 'strava'
        return 'blog'
    } catch { return 'blog' }
}

function detectLanguage(text: string): string {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text) ? 'ja' : 'en'
}

function extractAuthor(url: string): string | undefined {
    try {
        const u = new URL(url)
        const h = u.hostname.toLowerCase()
        if (h.includes('reddit.com')) {
            const m = u.pathname.match(/\/r\/([^/]+)/)
            return m ? `r/${m[1]}` : undefined
        }
        if (h.includes('twitter.com') || h.includes('x.com')) {
            const m = u.pathname.match(/\/([^/]+)/)
            return m ? `@${m[1]}` : undefined
        }
        return h.replace('www.', '')
    } catch { return undefined }
}

async function aiExtract(snippet: string, title: string, brand: string, model: string): Promise<{
    aiSummary: string; sentiment: string; keyPoints: string[]; isPersonal: boolean; isRunning: boolean; author?: string;
} | null> {
    const key = process.env.GEMINI_API_KEY
    if (!key) return null

    const prompt = `以下は「${brand} ${model}」に関する検索結果です。個人レビューか判定し要約してください。

タイトル: ${title}
スニペット: ${snippet}

JSON形式で出力:
{
  "is_personal": true/false,
  "is_running": true/false,
  "summary": "独自要約(50-80文字)",
  "sentiment": "positive/negative/neutral/mixed",
  "key_points": ["ポイント1","ポイント2"],
  "author": "著者名(あれば)"
}

注: 原文コピー厳禁、ECサイト/プレスリリースは false、「${brand} ${model}」に無関係なら false`

    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
                }),
            }
        )
        if (!res.ok) return null
        const data = await res.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!content) return null
        const m = content.match(/\{[\s\S]*\}/)
        if (!m) return null
        const r = JSON.parse(m[0])
        return {
            aiSummary: r.summary || '', sentiment: r.sentiment || 'neutral',
            keyPoints: r.key_points || [], isPersonal: r.is_personal === true,
            isRunning: r.is_running !== false, author: r.author,
        }
    } catch { return null }
}

async function main() {
    console.log('=== 外部レビュー大量収集 (Batch 2) ===')

    const currentCount = await prisma.externalReview.count()
    console.log(`Current count: ${currentCount}`)
    const target = 100
    const needed = target - currentCount
    if (needed <= 0) {
        console.log('Already at target!')
        await prisma.$disconnect()
        return
    }
    console.log(`Need ${needed} more reviews to reach ${target}\n`)

    // 全ランニングシューズを取得
    const allShoes = await prisma.shoe.findMany({
        where: { category: { in: ['Running', 'RUNNING', 'ランニング'] } },
        select: { id: true, brand: true, modelName: true },
    })
    console.log(`Total running shoes: ${allShoes.length}`)

    // 既存URLを全取得
    const existingUrls = new Set(
        (await prisma.externalReview.findMany({ select: { sourceUrl: true } })).map(r => r.sourceUrl)
    )

    let totalSaved = 0

    // より多様な検索クエリパターン
    function generateQueries(brand: string, model: string): string[] {
        return [
            `"${brand} ${model}" レビュー 感想`,
            `"${brand} ${model}" 走ってみた インプレ`,
            `"${brand} ${model}" review runner blog`,
            `"${brand} ${model}" honest review running`,
            `"${brand} ${model}" review experience`,
            `"${brand}" "${model}" 使用感 ランニング`,
            `"${brand} ${model}" reddit running`,
            `"${brand} ${model}" marathon training review`,
            `"${brand} ${model}" 評価 ジョギング`,
            `"${brand} ${model}" レビュー ブログ`,
        ]
    }

    for (const shoe of allShoes) {
        if (totalSaved >= needed) break

        const shoeName = `${shoe.brand} ${shoe.modelName}`

        // ブランドやモデル名が無効なものをスキップ
        if (shoe.modelName.length < 2 || shoe.brand.length < 2) continue
        if (/^\d+$/.test(shoe.modelName)) continue

        console.log(`\n▶ ${shoeName}`)

        const queries = generateQueries(shoe.brand, shoe.modelName)

        for (const query of queries) {
            if (totalSaved >= needed) break

            try {
                const results = await searchWeb(query, 10)

                for (const sr of results) {
                    if (totalSaved >= needed) break
                    if (existingUrls.has(sr.url) || isExcluded(sr.url)) continue
                    if (!sr.snippet || sr.snippet.length < 20) continue

                    const extracted = await aiExtract(sr.snippet, sr.title, shoe.brand, shoe.modelName)

                    if (!extracted || !extracted.isPersonal || !extracted.isRunning) continue

                    try {
                        await prisma.externalReview.create({
                            data: {
                                shoeId: shoe.id,
                                platform: classifyPlatform(sr.url),
                                sourceUrl: sr.url,
                                sourceTitle: sr.title.substring(0, 255),
                                authorName: extracted.author || extractAuthor(sr.url) || null,
                                snippet: sr.snippet.substring(0, 200),
                                aiSummary: extracted.aiSummary,
                                language: detectLanguage(sr.snippet + sr.title),
                                sentiment: extracted.sentiment,
                                keyPoints: extracted.keyPoints,
                            },
                        })
                        existingUrls.add(sr.url)
                        totalSaved++
                        console.log(`  ✓ [${totalSaved + currentCount}/${target}] ${sr.title.substring(0, 50)}...`)
                    } catch (e) {
                        // duplicate, skip
                    }

                    // API rate limit
                    await new Promise(r => setTimeout(r, 1500))
                }

                // Wait between queries
                await new Promise(r => setTimeout(r, 2000))

            } catch (e) {
                console.warn(`  Query error: ${e instanceof Error ? e.message : e}`)
            }
        }
    }

    const finalCount = await prisma.externalReview.count()
    console.log(`\n=== Complete ===`)
    console.log(`Final count: ${finalCount}`)
    console.log(`Added in this batch: ${totalSaved}`)

    await prisma.$disconnect()
}

main()
