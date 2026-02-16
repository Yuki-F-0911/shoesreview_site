/**
 * 外部レビュー定期収集 cron スクリプト
 * 
 * 既存の collect-external-reviews.ts をラップし、
 * 日次実行でレビューを増やし続ける
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const EXCLUDED_DOMAINS = [
    'nike.com', 'adidas.com', 'adidas.jp', 'asics.com', 'newbalance.jp',
    'mizunoshop.net', 'puma.com', 'hoka.com', 'on-running.com',
    'brooksrunning.com', 'saucony.com',
    'amazon.co.jp', 'amazon.com', 'rakuten.co.jp', 'yahoo.co.jp',
    'shop.', 'store.', 'buy.', 'kakaku.com', 'price.com',
    'wikipedia.org', 'facebook.com',
]

const PERSONAL_INDICATORS = [
    'レビュー', '感想', '使って', '履いて', '走って', 'インプレ', '評価',
    'review', 'experience', 'thoughts', 'opinion', 'honest', 'tested', 'tried',
]

interface SearchResult { title: string; url: string; snippet: string }

async function searchWeb(query: string): Promise<SearchResult[]> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID
    if (!apiKey || !cx) throw new Error('Search API keys required')

    const params = new URLSearchParams({ key: apiKey, cx, q: query, num: '10' })
    try {
        const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`)
        if (!res.ok) return []
        const data = await res.json()
        return (data.items || []).map((i: any) => ({ title: i.title, url: i.link, snippet: i.snippet || '' }))
    } catch { return [] }
}

function isExcluded(url: string): boolean {
    try { return EXCLUDED_DOMAINS.some(d => new URL(url).hostname.toLowerCase().includes(d)) }
    catch { return true }
}

function isLikelyReview(title: string, snippet: string): boolean {
    const text = (title + ' ' + snippet).toLowerCase()
    return PERSONAL_INDICATORS.some(k => text.includes(k))
}

function classifyPlatform(url: string): string {
    try {
        const h = new URL(url).hostname.toLowerCase()
        if (h.includes('reddit.com')) return 'reddit'
        if (h.includes('twitter.com') || h.includes('x.com')) return 'twitter'
        if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube'
        return 'blog'
    } catch { return 'blog' }
}

function detectLang(t: string): string {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(t) ? 'ja' : 'en'
}

function guessSentiment(text: string): string {
    const lower = text.toLowerCase()
    const pos = ['great', 'excellent', 'love', 'best', 'comfortable', '最高', '快適', 'おすすめ', '気に入', '良い']
    const neg = ['poor', 'bad', 'uncomfortable', 'heavy', '悪い', '重い', 'がっかり', '残念']
    const p = pos.filter(w => lower.includes(w)).length
    const n = neg.filter(w => lower.includes(w)).length
    if (p > n) return 'positive'
    if (n > p) return 'negative'
    if (p > 0 && n > 0) return 'mixed'
    return 'neutral'
}

async function main() {
    console.log(`[${new Date().toISOString()}] Starting daily external review collection...`)

    // レビューが少ないシューズを優先的に処理（1日5足まで）
    const shoes = await prisma.shoe.findMany({
        where: { category: { in: ['Running', 'RUNNING', 'ランニング'] } },
        select: {
            id: true, brand: true, modelName: true,
            _count: { select: { externalReviews: true } }
        },
        orderBy: { externalReviews: { _count: 'asc' } },
        take: 5,
    })

    if (shoes.length === 0) {
        console.log('No running shoes found.')
        await prisma.$disconnect()
        return
    }

    const existingUrls = new Set(
        (await prisma.externalReview.findMany({ select: { sourceUrl: true } })).map(r => r.sourceUrl)
    )

    let totalSaved = 0

    for (const shoe of shoes) {
        console.log(`\n▶ ${shoe.brand} ${shoe.modelName} (existing: ${shoe._count.externalReviews})`)

        const queries = [
            `"${shoe.brand} ${shoe.modelName}" レビュー 感想`,
            `"${shoe.brand} ${shoe.modelName}" review running`,
        ]

        for (const query of queries) {
            const results = await searchWeb(query)
            for (const sr of results) {
                if (existingUrls.has(sr.url) || isExcluded(sr.url)) continue
                if (!sr.snippet || sr.snippet.length < 20 || !isLikelyReview(sr.title, sr.snippet)) continue

                try {
                    await prisma.externalReview.create({
                        data: {
                            shoeId: shoe.id,
                            platform: classifyPlatform(sr.url),
                            sourceUrl: sr.url,
                            sourceTitle: sr.title.substring(0, 255),
                            authorName: null,
                            snippet: sr.snippet.substring(0, 200),
                            aiSummary: null,
                            language: detectLang(sr.snippet + sr.title),
                            sentiment: guessSentiment(sr.snippet + sr.title),
                            keyPoints: [],
                        },
                    })
                    existingUrls.add(sr.url)
                    totalSaved++
                    console.log(`  ✓ ${sr.title.substring(0, 50)}...`)
                } catch { /* duplicate */ }
            }
            await new Promise(r => setTimeout(r, 1500))
        }
    }

    const totalCount = await prisma.externalReview.count()
    console.log(`\n[${new Date().toISOString()}] Done. Added: ${totalSaved}, Total: ${totalCount}`)
    await prisma.$disconnect()
}

main().catch(console.error)
