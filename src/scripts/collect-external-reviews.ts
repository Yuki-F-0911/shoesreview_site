/**
 * 外部レビュー収集スクリプト
 * 
 * 世界中のブログ・SNS・YouTubeなどから個人のシューズレビューを収集
 * 著作権保護: スニペットのみ保存、原文リンク必須、AI独自要約
 * 
 * 使い方:
 *   npx tsx src/scripts/collect-external-reviews.ts [--dry-run] [--limit N] [--shoe-id ID]
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ==========================
// 設定
// ==========================

const EXCLUDED_DOMAINS = [
    'nike.com', 'adidas.com', 'adidas.jp', 'asics.com', 'newbalance.jp',
    'mizunoshop.net', 'puma.com', 'reebok.jp', 'hoka.com', 'on-running.com',
    'brooksrunning.com', 'saucony.com',
    'amazon.co.jp', 'amazon.com', 'rakuten.co.jp', 'yahoo.co.jp',
    'shop.', 'store.', 'buy.',
    'kakaku.com', 'price.com',
]

const PERSONAL_KEYWORDS_JA = ['レビュー', '感想', '使ってみた', '履いてみた', '走ってみた', '本音', 'インプレ']
const PERSONAL_KEYWORDS_EN = ['review', 'experience', 'opinion', 'thoughts', 'honest', 'personal', 'first impressions']

interface SearchResult {
    title: string
    url: string
    snippet: string
    displayUrl?: string
}

interface ExtractedReview {
    aiSummary: string
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
    keyPoints: string[]
    isPersonalReview: boolean
    isRunningShoe: boolean
    authorName?: string
}

// ==========================
// Web検索（Google Custom Search / Serper）
// ==========================

async function searchWeb(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    // Serper API
    if (process.env.SERPER_API_KEY) {
        try {
            const response = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': process.env.SERPER_API_KEY,
                },
                body: JSON.stringify({ q: query, num: maxResults }),
            })
            if (response.ok) {
                const data = await response.json()
                return (data.organic || []).map((item: any) => ({
                    title: item.title,
                    url: item.link,
                    snippet: item.snippet || '',
                    displayUrl: item.displayLink,
                }))
            }
        } catch (e) {
            console.warn('Serper API failed, trying Google Custom Search:', e)
        }
    }

    // Google Custom Search API
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

    if (!apiKey || !searchEngineId) {
        throw new Error('GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID are required')
    }

    const params = new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: query,
        num: Math.min(maxResults, 10).toString(),
    })

    const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?${params.toString()}`
    )

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Google Search API error: ${error}`)
    }

    const data = await response.json()
    return (data.items || []).map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || '',
        displayUrl: item.displayLink,
    }))
}

// ==========================
// フィルタリング
// ==========================

function isExcludedDomain(url: string): boolean {
    try {
        const hostObj = new URL(url)
        const host = hostObj.hostname.toLowerCase()
        return EXCLUDED_DOMAINS.some(domain => host.includes(domain))
    } catch {
        return true
    }
}

function classifyPlatform(url: string): string {
    try {
        const host = new URL(url).hostname.toLowerCase()
        if (host.includes('reddit.com')) return 'reddit'
        if (host.includes('twitter.com') || host.includes('x.com')) return 'twitter'
        if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube'
        if (host.includes('strava.com')) return 'strava'
        if (host.includes('instagram.com')) return 'instagram'
        if (host.includes('threads.net')) return 'threads'
        return 'blog'
    } catch {
        return 'blog'
    }
}

function detectLanguage(text: string): string {
    const jaPattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/
    if (jaPattern.test(text)) return 'ja'
    return 'en'
}

function extractAuthorFromUrl(url: string): string | undefined {
    try {
        const urlObj = new URL(url)
        const host = urlObj.hostname.toLowerCase()
        const path = urlObj.pathname

        if (host.includes('reddit.com')) {
            const match = path.match(/\/r\/([^/]+)/)
            return match ? `r/${match[1]}` : undefined
        }
        if (host.includes('twitter.com') || host.includes('x.com')) {
            const match = path.match(/\/([^/]+)/)
            return match ? `@${match[1]}` : undefined
        }
        if (host.includes('youtube.com')) {
            return undefined // YouTubeは検索結果からは著者不明
        }
        // ブログの場合はドメインを著者代わりに
        return host.replace('www.', '')
    } catch {
        return undefined
    }
}

// ==========================
// AI抽出（個人意見の構造化要約）
// ==========================

async function extractPersonalReview(
    snippet: string,
    title: string,
    brand: string,
    model: string,
): Promise<ExtractedReview | null> {
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY is required')
    }

    const prompt = `以下は「${brand} ${model}」というランニングシューズに関するWeb検索結果のスニペットです。
これが「個人の感想・レビュー」であるかを判定し、個人の意見を構造化してください。

タイトル: ${title}
スニペット: ${snippet}

以下を厳守してください：
- 原文のコピー・引用は一切行わないこと
- あなた自身の言葉で、この人がどう感じたかを短く要約すること（50-80文字）
- このスニペットが「${brand} ${model}」について述べているか確認すること

以下のJSON形式で出力してください：
{
  "is_personal_review": true/false （個人の感想・レビューかどうか。企業のプレスリリースやECサイトの説明は false）,
  "is_running_shoe": true/false （ランニングシューズとして言及されているか）,
  "ai_summary": "この人の意見の独自要約（50-80文字）",
  "sentiment": "positive" or "negative" or "neutral" or "mixed",
  "key_points": ["ポイント1", "ポイント2", "ポイント3"],
  "author_name": "著者名（判別できれば）"
}

個人の意見でない場合や、「${brand} ${model}」に関係ない内容の場合は、is_personal_review を false にしてください。`

    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
                }),
            }
        )

        if (!response.ok) {
            const errText = await response.text()
            console.error(`Gemini API error: ${errText}`)
            return null
        }

        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!content) return null

        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) return null

        const result = JSON.parse(jsonMatch[0])

        return {
            aiSummary: result.ai_summary || '',
            sentiment: result.sentiment || 'neutral',
            keyPoints: result.key_points || [],
            isPersonalReview: result.is_personal_review === true,
            isRunningShoe: result.is_running_shoe !== false,
            authorName: result.author_name || undefined,
        }
    } catch (error) {
        console.error('AI extraction error:', error)
        return null
    }
}

// ==========================
// メイン収集ロジック
// ==========================

interface CollectionResult {
    totalProcessed: number
    totalSaved: number
    totalSkipped: number
    totalErrors: number
}

async function collectExternalReviewsForShoe(
    shoeId: string,
    brand: string,
    modelName: string,
    dryRun: boolean = false,
): Promise<CollectionResult> {
    const result: CollectionResult = {
        totalProcessed: 0,
        totalSaved: 0,
        totalSkipped: 0,
        totalErrors: 0,
    }

    // 既存URLの重複チェック
    const existingUrls = new Set(
        (await prisma.externalReview.findMany({
            where: { shoeId },
            select: { sourceUrl: true },
        })).map(r => r.sourceUrl)
    )

    // 多言語クエリの生成
    const queries = [
        `"${brand} ${modelName}" レビュー 感想 個人`,
        `"${brand} ${modelName}" 履いてみた OR 走ってみた`,
        `"${brand} ${modelName}" review personal experience running`,
        `"${brand} ${modelName}" honest review running shoe`,
        `site:reddit.com "${brand} ${modelName}" running`,
        `"${brand} ${modelName}" running review blog`,
    ]

    const allResults: SearchResult[] = []

    for (const query of queries) {
        try {
            const results = await searchWeb(query, 10)
            allResults.push(...results)
            // API制限対策
            await new Promise(resolve => setTimeout(resolve, 1500))
        } catch (error) {
            console.warn(`  Query failed: ${query}`, error instanceof Error ? error.message : error)
            result.totalErrors++
        }
    }

    // 重複URL除去
    const uniqueResults = new Map<string, SearchResult>()
    for (const r of allResults) {
        if (!uniqueResults.has(r.url) && !existingUrls.has(r.url) && !isExcludedDomain(r.url)) {
            uniqueResults.set(r.url, r)
        }
    }

    console.log(`  Found ${uniqueResults.size} unique results after filtering`)

    for (const [url, searchResult] of uniqueResults) {
        result.totalProcessed++

        try {
            // AI で個人レビューかどうか判定＋要約
            const extracted = await extractPersonalReview(
                searchResult.snippet,
                searchResult.title,
                brand,
                modelName,
            )

            if (!extracted || !extracted.isPersonalReview || !extracted.isRunningShoe) {
                result.totalSkipped++
                continue
            }

            const platform = classifyPlatform(url)
            const language = detectLanguage(searchResult.snippet + searchResult.title)
            const authorFromUrl = extractAuthorFromUrl(url)

            if (dryRun) {
                console.log(`  [DRY-RUN] Would save: ${searchResult.title.substring(0, 60)}...`)
                console.log(`    Platform: ${platform}, Sentiment: ${extracted.sentiment}`)
                console.log(`    Summary: ${extracted.aiSummary}`)
                result.totalSaved++
                continue
            }

            await prisma.externalReview.create({
                data: {
                    shoeId,
                    platform,
                    sourceUrl: url,
                    sourceTitle: searchResult.title.substring(0, 255),
                    authorName: extracted.authorName || authorFromUrl || null,
                    authorUrl: authorFromUrl ? url : null,
                    snippet: searchResult.snippet.substring(0, 200),
                    aiSummary: extracted.aiSummary,
                    language,
                    sentiment: extracted.sentiment,
                    keyPoints: extracted.keyPoints,
                },
            })

            result.totalSaved++
            console.log(`  ✓ Saved: ${searchResult.title.substring(0, 50)}... [${platform}/${language}]`)

            // API制限対策
            await new Promise(resolve => setTimeout(resolve, 2000))

        } catch (error) {
            if (error instanceof Error && error.message.includes('Unique constraint')) {
                result.totalSkipped++
            } else {
                console.error(`  ✗ Error processing ${url}:`, error instanceof Error ? error.message : error)
                result.totalErrors++
            }
        }
    }

    return result
}

// ==========================
// メイン
// ==========================

async function main() {
    const args = process.argv.slice(2)
    const dryRun = args.includes('--dry-run')
    const limitArg = args.find(a => a.startsWith('--limit'))
    const limit = limitArg ? parseInt(args[args.indexOf(limitArg) + 1]) : 20
    const shoeIdArg = args.find(a => a.startsWith('--shoe-id'))
    const specificShoeId = shoeIdArg ? args[args.indexOf(shoeIdArg) + 1] : null

    console.log('═══════════════════════════════════════════')
    console.log('  外部レビュー収集スクリプト')
    console.log(`  Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`)
    console.log(`  Limit: ${limit} shoes`)
    console.log('═══════════════════════════════════════════')

    try {
        let targetShoes: { id: string; brand: string; modelName: string }[]

        if (specificShoeId) {
            const shoe = await prisma.shoe.findUnique({
                where: { id: specificShoeId },
                select: { id: true, brand: true, modelName: true },
            })
            if (!shoe) {
                console.error(`Shoe not found: ${specificShoeId}`)
                process.exit(1)
            }
            targetShoes = [shoe]
        } else {
            // 外部レビューが少ないランニングシューズを取得
            targetShoes = await prisma.shoe.findMany({
                where: {
                    category: { in: ['Running', 'RUNNING', 'ランニング'] },
                },
                select: { id: true, brand: true, modelName: true },
                orderBy: { createdAt: 'desc' },
                take: limit,
            })
        }

        console.log(`\nTarget: ${targetShoes.length} shoes\n`)

        const grandTotal = {
            processed: 0,
            saved: 0,
            skipped: 0,
            errors: 0,
        }

        for (const shoe of targetShoes) {
            const shoeName = `${shoe.brand} ${shoe.modelName}`
            console.log(`\n▶ Processing: ${shoeName}`)

            const result = await collectExternalReviewsForShoe(
                shoe.id,
                shoe.brand,
                shoe.modelName,
                dryRun,
            )

            grandTotal.processed += result.totalProcessed
            grandTotal.saved += result.totalSaved
            grandTotal.skipped += result.totalSkipped
            grandTotal.errors += result.totalErrors

            console.log(`  Result: saved=${result.totalSaved}, skipped=${result.totalSkipped}, errors=${result.totalErrors}`)

            // シューズ間の待機
            await new Promise(resolve => setTimeout(resolve, 3000))
        }

        console.log('\n═══════════════════════════════════════════')
        console.log('  Collection Complete')
        console.log(`  Total Processed: ${grandTotal.processed}`)
        console.log(`  Total Saved:     ${grandTotal.saved}`)
        console.log(`  Total Skipped:   ${grandTotal.skipped}`)
        console.log(`  Total Errors:    ${grandTotal.errors}`)
        console.log('═══════════════════════════════════════════')

    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
