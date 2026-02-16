/**
 * 外部レビュー大量収集スクリプト（バッチ3）
 * 
 * 人気のランニングシューズをDBに追加し、レビューを集中的に収集
 * Google Custom Search APIの上限に注意（100クエリ/日）
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 人気ランニングシューズのリスト（DBに無いものを追加）
const POPULAR_SHOES = [
    // Nike
    { brand: 'Nike', modelName: 'Vaporfly 3', category: 'Running' },
    { brand: 'Nike', modelName: 'Pegasus 41', category: 'Running' },
    { brand: 'Nike', modelName: 'Invincible 3', category: 'Running' },
    { brand: 'Nike', modelName: 'Infinity Run 4', category: 'Running' },
    { brand: 'Nike', modelName: 'Zegama 2', category: 'Running' },
    { brand: 'Nike', modelName: 'Structure 25', category: 'Running' },
    // Adidas
    { brand: 'Adidas', modelName: 'Adizero Boston 12', category: 'Running' },
    { brand: 'Adidas', modelName: 'Adizero Adios Pro 3', category: 'Running' },
    { brand: 'Adidas', modelName: 'Supernova Rise', category: 'Running' },
    { brand: 'Adidas', modelName: 'Solarboost 5', category: 'Running' },
    // ASICS
    { brand: 'ASICS', modelName: 'Gel-Kayano 31', category: 'Running' },
    { brand: 'ASICS', modelName: 'Gel-Nimbus 26', category: 'Running' },
    { brand: 'ASICS', modelName: 'Magic Speed 4', category: 'Running' },
    { brand: 'ASICS', modelName: 'Metaspeed Sky Paris', category: 'Running' },
    { brand: 'ASICS', modelName: 'GT-2000 13', category: 'Running' },
    // New Balance
    { brand: 'New Balance', modelName: 'FuelCell SuperComp Elite v4', category: 'Running' },
    { brand: 'New Balance', modelName: 'Fresh Foam X 1080v14', category: 'Running' },
    { brand: 'New Balance', modelName: 'FuelCell Rebel v4', category: 'Running' },
    { brand: 'New Balance', modelName: 'Fresh Foam X 880v14', category: 'Running' },
    // HOKA
    { brand: 'HOKA', modelName: 'Clifton 9', category: 'Running' },
    { brand: 'HOKA', modelName: 'Mach 6', category: 'Running' },
    { brand: 'HOKA', modelName: 'Rocket X 2', category: 'Running' },
    { brand: 'HOKA', modelName: 'Rincon 4', category: 'Running' },
    { brand: 'HOKA', modelName: 'Arahi 7', category: 'Running' },
    // Saucony
    { brand: 'Saucony', modelName: 'Endorphin Speed 4', category: 'Running' },
    { brand: 'Saucony', modelName: 'Endorphin Pro 4', category: 'Running' },
    { brand: 'Saucony', modelName: 'Kinvara 15', category: 'Running' },
    { brand: 'Saucony', modelName: 'Triumph 22', category: 'Running' },
    // Brooks
    { brand: 'Brooks', modelName: 'Ghost 16', category: 'Running' },
    { brand: 'Brooks', modelName: 'Glycerin 21', category: 'Running' },
    { brand: 'Brooks', modelName: 'Hyperion Max', category: 'Running' },
    // On
    { brand: 'On', modelName: 'Cloudmonster 2', category: 'Running' },
    { brand: 'On', modelName: 'Cloudsurfer 7', category: 'Running' },
    { brand: 'On', modelName: 'Cloudflow 4', category: 'Running' },
    // Mizuno
    { brand: 'Mizuno', modelName: 'Wave Rebellion Pro 2', category: 'Running' },
    { brand: 'Mizuno', modelName: 'Wave Rider 28', category: 'Running' },
    // Puma
    { brand: 'Puma', modelName: 'Deviate Nitro Elite 3', category: 'Running' },
    { brand: 'Puma', modelName: 'Velocity Nitro 3', category: 'Running' },
]

const EXCLUDED_DOMAINS = [
    'nike.com', 'adidas.com', 'adidas.jp', 'asics.com', 'newbalance.jp',
    'mizunoshop.net', 'puma.com', 'reebok.jp', 'hoka.com', 'on-running.com',
    'brooksrunning.com', 'saucony.com',
    'amazon.co.jp', 'amazon.com', 'rakuten.co.jp', 'yahoo.co.jp',
    'shop.', 'store.', 'buy.', 'kakaku.com', 'price.com',
]

interface SearchResult { title: string; url: string; snippet: string }

async function searchWeb(query: string): Promise<SearchResult[]> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID
    if (!apiKey || !cx) throw new Error('Search API keys required')

    const params = new URLSearchParams({ key: apiKey, cx, q: query, num: '10' })
    try {
        const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`)
        if (!res.ok) {
            const err = await res.text()
            if (err.includes('rateLimitExceeded') || err.includes('dailyLimitExceeded')) {
                console.log('  ⚠ API rate limit reached, waiting 60s...')
                await new Promise(r => setTimeout(r, 60000))
                return []
            }
            console.warn(`  API error: ${err.substring(0, 80)}`)
            return []
        }
        const data = await res.json()
        return (data.items || []).map((i: any) => ({ title: i.title, url: i.link, snippet: i.snippet || '' }))
    } catch (e) {
        console.warn(`  Search error: ${e instanceof Error ? e.message : e}`)
        return []
    }
}

function isExcluded(url: string): boolean {
    try { return EXCLUDED_DOMAINS.some(d => new URL(url).hostname.toLowerCase().includes(d)) }
    catch { return true }
}

function classifyPlatform(url: string): string {
    try {
        const h = new URL(url).hostname.toLowerCase()
        if (h.includes('reddit.com')) return 'reddit'
        if (h.includes('twitter.com') || h.includes('x.com')) return 'twitter'
        if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube'
        if (h.includes('strava.com')) return 'strava'
        return 'blog'
    } catch { return 'blog' }
}

function detectLang(t: string): string {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(t) ? 'ja' : 'en'
}

function getAuthor(url: string): string | undefined {
    try {
        const u = new URL(url); const h = u.hostname.toLowerCase()
        if (h.includes('reddit.com')) { const m = u.pathname.match(/\/r\/([^/]+)/); return m ? `r/${m[1]}` : undefined }
        if (h.includes('twitter.com') || h.includes('x.com')) { const m = u.pathname.match(/\/([^/]+)/); return m ? `@${m[1]}` : undefined }
        return h.replace('www.', '')
    } catch { return undefined }
}

async function aiExtract(snippet: string, title: string, brand: string, model: string) {
    const key = process.env.GEMINI_API_KEY
    if (!key) return null

    const prompt = `以下は「${brand} ${model}」に関するWeb検索結果です。個人レビューか判定し、独自の要約を生成してください。

タイトル: ${title}
スニペット: ${snippet}

JSON:
{"is_personal":true/false,"is_running":true/false,"summary":"独自要約(50-80文字、原文コピー禁止)","sentiment":"positive/negative/neutral/mixed","key_points":["ポイント1","ポイント2"],"author":"著者名"}`

    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`,
            {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 400 } })
            }
        )
        if (!res.ok) { console.warn('  Gemini error:', (await res.text()).substring(0, 80)); return null }
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) return null
        const m = text.match(/\{[\s\S]*\}/)
        if (!m) return null
        const r = JSON.parse(m[0])
        return {
            aiSummary: r.summary || '', sentiment: r.sentiment || 'neutral', keyPoints: r.key_points || [],
            isPersonal: r.is_personal === true, isRunning: r.is_running !== false, author: r.author
        }
    } catch { return null }
}

async function ensureShoeExists(shoe: { brand: string; modelName: string; category: string }): Promise<string> {
    const existing = await prisma.shoe.findFirst({
        where: { brand: shoe.brand, modelName: shoe.modelName },
        select: { id: true },
    })
    if (existing) return existing.id

    const created = await prisma.shoe.create({
        data: { brand: shoe.brand, modelName: shoe.modelName, category: shoe.category },
    })
    console.log(`  📦 Created shoe: ${shoe.brand} ${shoe.modelName}`)
    return created.id
}

async function main() {
    console.log('═══════════════════════════════════════════')
    console.log('  外部レビュー大量収集 (Batch 3)')
    console.log('  人気ランニングシューズ全38モデル対応')
    console.log('═══════════════════════════════════════════')

    const currentCount = await prisma.externalReview.count()
    console.log(`\nCurrent count: ${currentCount}`)
    const TARGET = 100
    const needed = TARGET - currentCount
    if (needed <= 0) { console.log('Target reached!'); await prisma.$disconnect(); return }
    console.log(`Need ${needed} more to reach ${TARGET}\n`)

    const existingUrls = new Set(
        (await prisma.externalReview.findMany({ select: { sourceUrl: true } })).map(r => r.sourceUrl)
    )

    let saved = 0
    let apiCalls = 0
    const MAX_API_CALLS = 90 // 日次制限に余裕を持たせる

    for (const shoe of POPULAR_SHOES) {
        if (saved >= needed) break
        if (apiCalls >= MAX_API_CALLS) {
            console.log('\n⚠ API call limit reached. Stopping.')
            break
        }

        const shoeId = await ensureShoeExists(shoe)
        const shoeName = `${shoe.brand} ${shoe.modelName}`
        console.log(`\n▶ ${shoeName}`)

        // 少数の効果的なクエリ
        const queries = [
            `"${shoe.brand} ${shoe.modelName}" レビュー 感想 ランニング`,
            `"${shoe.brand} ${shoe.modelName}" review running experience`,
            `"${shoe.brand} ${shoe.modelName}" running shoe honest review blog`,
        ]

        for (const query of queries) {
            if (saved >= needed || apiCalls >= MAX_API_CALLS) break

            apiCalls++
            const results = await searchWeb(query)
            await new Promise(r => setTimeout(r, 2000))

            for (const sr of results) {
                if (saved >= needed) break
                if (existingUrls.has(sr.url) || isExcluded(sr.url)) continue
                if (!sr.snippet || sr.snippet.length < 20) continue

                const ex = await aiExtract(sr.snippet, sr.title, shoe.brand, shoe.modelName)
                if (!ex || !ex.isPersonal || !ex.isRunning) continue

                try {
                    await prisma.externalReview.create({
                        data: {
                            shoeId,
                            platform: classifyPlatform(sr.url),
                            sourceUrl: sr.url,
                            sourceTitle: sr.title.substring(0, 255),
                            authorName: ex.author || getAuthor(sr.url) || null,
                            snippet: sr.snippet.substring(0, 200),
                            aiSummary: ex.aiSummary,
                            language: detectLang(sr.snippet + sr.title),
                            sentiment: ex.sentiment,
                            keyPoints: ex.keyPoints,
                        },
                    })
                    existingUrls.add(sr.url)
                    saved++
                    console.log(`  ✓ [${currentCount + saved}/${TARGET}] ${sr.title.substring(0, 50)}...`)
                } catch { /* duplicate */ }

                await new Promise(r => setTimeout(r, 1500))
            }
        }
    }

    const finalCount = await prisma.externalReview.count()
    console.log('\n═══════════════════════════════════════════')
    console.log(`  Complete! Final count: ${finalCount}`)
    console.log(`  Added: ${saved}, API calls: ${apiCalls}`)
    console.log('═══════════════════════════════════════════')

    await prisma.$disconnect()
}

main()
