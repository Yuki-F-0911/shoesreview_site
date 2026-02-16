/**
 * 外部レビュー高速収集スクリプト
 * 
 * 2フェーズアプローチ:
 * Phase 1: 検索結果からレビューを直接保存（AI抽出なし）
 * Phase 2: 後でAI enrichmentを実行（別スクリプト）
 * 
 * これにより、Gemini APIの制限に関係なく高速に収集できる
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
    'wikipedia.org', 'facebook.com',
]

// 個人レビューらしいタイトルのキーワード
const PERSONAL_INDICATORS_JA = ['レビュー', '感想', '使って', '履いて', '走って', '本音', 'インプレ', '評価', 'おすすめ', '比較']
const PERSONAL_INDICATORS_EN = ['review', 'experience', 'thoughts', 'opinion', 'honest', 'impressed', 'tested', 'tried', 'compared', 'verdict', 'best', 'worst', 'update']

const POPULAR_SHOES = [
    { brand: 'Nike', modelName: 'Vaporfly 3', category: 'Running' },
    { brand: 'Nike', modelName: 'Alphafly 3', category: 'Running' },
    { brand: 'Nike', modelName: 'Pegasus 41', category: 'Running' },
    { brand: 'Nike', modelName: 'Invincible 3', category: 'Running' },
    { brand: 'Nike', modelName: 'Infinity Run 4', category: 'Running' },
    { brand: 'Nike', modelName: 'Vomero 18', category: 'Running' },
    { brand: 'Nike', modelName: 'Structure 25', category: 'Running' },
    { brand: 'Nike', modelName: 'Zegama 2', category: 'Running' },
    { brand: 'Adidas', modelName: 'Adizero Boston 12', category: 'Running' },
    { brand: 'Adidas', modelName: 'Adizero Adios Pro 3', category: 'Running' },
    { brand: 'Adidas', modelName: 'Supernova Rise', category: 'Running' },
    { brand: 'Adidas', modelName: 'Ultraboost Light', category: 'Running' },
    { brand: 'Adidas', modelName: 'Solarboost 5', category: 'Running' },
    { brand: 'Adidas', modelName: 'Adizero SL2', category: 'Running' },
    { brand: 'ASICS', modelName: 'Gel-Kayano 31', category: 'Running' },
    { brand: 'ASICS', modelName: 'Gel-Nimbus 26', category: 'Running' },
    { brand: 'ASICS', modelName: 'Magic Speed 4', category: 'Running' },
    { brand: 'ASICS', modelName: 'Metaspeed Sky Paris', category: 'Running' },
    { brand: 'ASICS', modelName: 'Novablast 5', category: 'Running' },
    { brand: 'ASICS', modelName: 'GT-2000 13', category: 'Running' },
    { brand: 'New Balance', modelName: 'FuelCell SC Elite v4', category: 'Running' },
    { brand: 'New Balance', modelName: 'Fresh Foam 1080v14', category: 'Running' },
    { brand: 'New Balance', modelName: 'FuelCell Rebel v4', category: 'Running' },
    { brand: 'New Balance', modelName: 'Fresh Foam 880v14', category: 'Running' },
    { brand: 'HOKA', modelName: 'Clifton 9', category: 'Running' },
    { brand: 'HOKA', modelName: 'Bondi 8', category: 'Running' },
    { brand: 'HOKA', modelName: 'Mach 6', category: 'Running' },
    { brand: 'HOKA', modelName: 'Rocket X 2', category: 'Running' },
    { brand: 'HOKA', modelName: 'Rincon 4', category: 'Running' },
    { brand: 'HOKA', modelName: 'Arahi 7', category: 'Running' },
    { brand: 'Saucony', modelName: 'Endorphin Speed 4', category: 'Running' },
    { brand: 'Saucony', modelName: 'Endorphin Pro 4', category: 'Running' },
    { brand: 'Saucony', modelName: 'Kinvara 15', category: 'Running' },
    { brand: 'Saucony', modelName: 'Triumph 22', category: 'Running' },
    { brand: 'Saucony', modelName: 'Ride 17', category: 'Running' },
    { brand: 'Brooks', modelName: 'Ghost 16', category: 'Running' },
    { brand: 'Brooks', modelName: 'Glycerin 21', category: 'Running' },
    { brand: 'Brooks', modelName: 'Hyperion Max', category: 'Running' },
    { brand: 'Brooks', modelName: 'Hyperion Elite 3', category: 'Running' },
    { brand: 'On', modelName: 'Cloudmonster 2', category: 'Running' },
    { brand: 'On', modelName: 'Cloudsurfer 7', category: 'Running' },
    { brand: 'On', modelName: 'Cloudflow 4', category: 'Running' },
    { brand: 'On', modelName: 'Cloudstratus 3', category: 'Running' },
    { brand: 'Mizuno', modelName: 'Wave Rebellion Pro 2', category: 'Running' },
    { brand: 'Mizuno', modelName: 'Wave Rider 28', category: 'Running' },
    { brand: 'Mizuno', modelName: 'Wave Duel 3', category: 'Running' },
    { brand: 'Puma', modelName: 'Deviate Nitro Elite 3', category: 'Running' },
    { brand: 'Puma', modelName: 'Velocity Nitro 3', category: 'Running' },
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
            if (err.includes('rateLimitExceeded') || err.includes('dailyLimitExceeded') || err.includes('429')) {
                console.log('  ⚠ Google API quota reached!')
                return []
            }
            return []
        }
        const data = await res.json()
        return (data.items || []).map((i: any) => ({ title: i.title, url: i.link, snippet: i.snippet || '' }))
    } catch { return [] }
}

function isExcluded(url: string): boolean {
    try { return EXCLUDED_DOMAINS.some(d => new URL(url).hostname.toLowerCase().includes(d)) }
    catch { return true }
}

function isLikelyPersonalReview(title: string, snippet: string): boolean {
    const text = (title + ' ' + snippet).toLowerCase()
    const jaMatch = PERSONAL_INDICATORS_JA.some(k => text.includes(k))
    const enMatch = PERSONAL_INDICATORS_EN.some(k => text.includes(k))
    return jaMatch || enMatch
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
        const u = new URL(url); const h = u.hostname.toLowerCase(); const p = u.pathname
        if (h.includes('reddit.com')) { const m = p.match(/\/r\/([^/]+)/); return m ? `r/${m[1]}` : undefined }
        if (h.includes('twitter.com') || h.includes('x.com')) { const m = p.match(/\/([^/]+)/); return m ? `@${m[1]}` : undefined }
        return h.replace('www.', '')
    } catch { return undefined }
}

function guessSentiment(text: string): string {
    const lower = text.toLowerCase()
    const posWords = ['great', 'excellent', 'love', 'amazing', 'best', 'perfect', 'comfortable',
        '最高', '素晴らしい', '快適', 'おすすめ', '気に入', '良い', '軽い', '好き']
    const negWords = ['poor', 'bad', 'terrible', 'hate', 'uncomfortable', 'heavy', 'expensive',
        '悪い', '重い', '高い', 'がっかり', '残念', '不満', '痛い']

    const posCount = posWords.filter(w => lower.includes(w)).length
    const negCount = negWords.filter(w => lower.includes(w)).length

    if (posCount > negCount) return 'positive'
    if (negCount > posCount) return 'negative'
    if (posCount > 0 && negCount > 0) return 'mixed'
    return 'neutral'
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
    console.log(`  📦 New shoe: ${shoe.brand} ${shoe.modelName}`)
    return created.id
}

async function main() {
    console.log('═══════════════════════════════════════════')
    console.log('  外部レビュー高速収集 (No AI Phase)')
    console.log('  直接保存モード: 48モデル対象')
    console.log('═══════════════════════════════════════════')

    const currentCount = await prisma.externalReview.count()
    console.log(`\nCurrent: ${currentCount}/100`)
    const TARGET = 100
    const needed = TARGET - currentCount
    if (needed <= 0) { console.log('✅ Target reached!'); await prisma.$disconnect(); return }

    const existingUrls = new Set(
        (await prisma.externalReview.findMany({ select: { sourceUrl: true } })).map(r => r.sourceUrl)
    )

    let saved = 0
    let apiCalls = 0
    let quotaExhausted = false

    for (const shoe of POPULAR_SHOES) {
        if (saved >= needed || quotaExhausted) break

        const shoeId = await ensureShoeExists(shoe)
        const shoeName = `${shoe.brand} ${shoe.modelName}`
        console.log(`\n▶ ${shoeName}`)

        // 2クエリのみ（API節約）
        const queries = [
            `"${shoe.brand} ${shoe.modelName}" レビュー 感想`,
            `"${shoe.brand} ${shoe.modelName}" review running`,
        ]

        for (const query of queries) {
            if (saved >= needed || quotaExhausted) break

            apiCalls++
            const results = await searchWeb(query)

            if (results.length === 0 && apiCalls > 3) {
                // 3回以上連続で0件ならquota切れの可能性
                quotaExhausted = true
                break
            }

            for (const sr of results) {
                if (saved >= needed) break
                if (existingUrls.has(sr.url) || isExcluded(sr.url)) continue
                if (!sr.snippet || sr.snippet.length < 20) continue
                if (!isLikelyPersonalReview(sr.title, sr.snippet)) continue

                try {
                    await prisma.externalReview.create({
                        data: {
                            shoeId,
                            platform: classifyPlatform(sr.url),
                            sourceUrl: sr.url,
                            sourceTitle: sr.title.substring(0, 255),
                            authorName: getAuthor(sr.url) || null,
                            snippet: sr.snippet.substring(0, 200),
                            aiSummary: null, // Phase 2でAI enrichment
                            language: detectLang(sr.snippet + sr.title),
                            sentiment: guessSentiment(sr.snippet + sr.title),
                            keyPoints: [],
                        },
                    })
                    existingUrls.add(sr.url)
                    saved++
                    console.log(`  ✓ [${currentCount + saved}/${TARGET}] ${sr.title.substring(0, 55)}...`)
                } catch { /* duplicate */ }
            }

            // API rate limit delay
            await new Promise(r => setTimeout(r, 1200))
        }
    }

    // 追加検索: 特定のサイトやコミュニティに向けて
    if (saved < needed && !quotaExhausted) {
        console.log('\n--- 追加検索: Reddit/YouTube ---')
        const additionalQueries = [
            'best running shoes 2024 review reddit',
            'best running shoes 2025 review reddit',
            'ランニングシューズ レビュー 2024 おすすめ ブログ',
            'ランニングシューズ 比較 レビュー 2025',
            'marathon shoe review 2024 blog',
            'running shoe review YouTube 2024',
            'hoka vs nike running shoe comparison review',
            'asics vs new balance running review',
            'saucony endorphin speed review personal',
            'brooks ghost review runner blog',
        ]

        for (const query of additionalQueries) {
            if (saved >= needed || quotaExhausted) break
            apiCalls++

            const results = await searchWeb(query)
            if (results.length === 0 && apiCalls > 5) { quotaExhausted = true; break }

            for (const sr of results) {
                if (saved >= needed) break
                if (existingUrls.has(sr.url) || isExcluded(sr.url)) continue
                if (!sr.snippet || sr.snippet.length < 20) continue

                // この追加検索はランニングシューズ全般なので、shoeIdを推測
                let matchedShoeId: string | null = null
                for (const shoe of POPULAR_SHOES) {
                    if (sr.title.toLowerCase().includes(shoe.modelName.toLowerCase()) ||
                        sr.snippet.toLowerCase().includes(shoe.modelName.toLowerCase())) {
                        matchedShoeId = await ensureShoeExists(shoe)
                        break
                    }
                }
                if (!matchedShoeId) continue // シューズが特定できない場合はスキップ

                try {
                    await prisma.externalReview.create({
                        data: {
                            shoeId: matchedShoeId,
                            platform: classifyPlatform(sr.url),
                            sourceUrl: sr.url,
                            sourceTitle: sr.title.substring(0, 255),
                            authorName: getAuthor(sr.url) || null,
                            snippet: sr.snippet.substring(0, 200),
                            aiSummary: null,
                            language: detectLang(sr.snippet + sr.title),
                            sentiment: guessSentiment(sr.snippet + sr.title),
                            keyPoints: [],
                        },
                    })
                    existingUrls.add(sr.url)
                    saved++
                    console.log(`  ✓ [${currentCount + saved}/${TARGET}] ${sr.title.substring(0, 55)}...`)
                } catch { /* duplicate */ }
            }

            await new Promise(r => setTimeout(r, 1200))
        }
    }

    const finalCount = await prisma.externalReview.count()
    console.log('\n═══════════════════════════════════════════')
    console.log(`  Phase 1 Complete!`)
    console.log(`  Final count: ${finalCount}`)
    console.log(`  Added: ${saved}, API calls: ${apiCalls}`)
    console.log(`  Quota exhausted: ${quotaExhausted}`)
    console.log('═══════════════════════════════════════════')

    await prisma.$disconnect()
}

main()
