import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { refreshCuratedSourcesForShoe } from '../lib/curation/service'
import { generateSummarizedReview } from '../lib/ai/summarizer'

// Manually load .env file
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '')
            if (!process.env[key]) {
                process.env[key] = value
            }
        }
    })
}

// Append pgbouncer=true if not present
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('pgbouncer=true')) {
    const separator = process.env.DATABASE_URL.includes('?') ? '&' : '?'
    process.env.DATABASE_URL = `${process.env.DATABASE_URL}${separator}pgbouncer=true`
    console.log('Appended pgbouncer=true to DATABASE_URL')
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
})

async function main() {
    console.log('Starting daily review generation...')

    // 1. Find shoes that DO NOT have an AI_SUMMARY review yet
    // We can't easily do a "NOT EXISTS" in Prisma for this relation in one go efficiently if the dataset is huge,
    // but for this size, we can fetch shoes and filter or use a raw query.
    // Let's try to fetch shoes and include reviews to filter.
    // Or better, fetch all shoes and check.

    // Fetching shoes that are likely candidates (e.g., created recently or just all active shoes)
    // 1. Find shoes that DO NOT have an AI_SUMMARY review yet
    // Fetch all shoeIds that already have an AI review
    const existingReviews = await prisma.review.findMany({
        where: {
            type: 'AI_SUMMARY'
        },
        select: {
            shoeId: true
        }
    })

    const existingShoeIds = existingReviews.map(r => r.shoeId)

    // Fetch shoes that are NOT in the existing list
    const targetShoes = await prisma.shoe.findMany({
        where: {
            id: {
                notIn: existingShoeIds
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 50
    })

    console.log(`Found ${targetShoes.length} shoes needing reviews (limit 50).`)

    let successCount = 0
    let failCount = 0

    for (const shoe of targetShoes) {
        console.log(`\nProcessing: ${shoe.brand} ${shoe.modelName}...`)

        try {
            // 2. Collect reviews (Max 5 references)
            console.log('  - Collecting sources...')
            const collectionResult = await refreshCuratedSourcesForShoe(shoe.id, {
                maxResults: 5,
                includeVideos: false, // Disable videos to avoid API limits
                includeWeb: true,
            })
            console.log(`    -> Created ${collectionResult.created} new sources.`)

            // 3. Fetch sources for summarization
            const sources = await prisma.curatedSource.findMany({
                where: { shoeId: shoe.id },
                take: 5, // Use top 5 sources
                orderBy: { reliability: 'desc' },
            })

            if (sources.length === 0) {
                console.log('    -> No sources found, skipping summarization.')
                failCount++
                continue
            }

            // 4. Generate Summary
            console.log('  - Generating summary...')
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

            // 5. Post Review
            console.log('  - Posting review...')
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
                    isPublished: true,
                },
            })

            // 6. Save Sources
            console.log('  - Saving sources...')
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

            console.log('    -> Done!')
            successCount++

            // Wait 10 seconds to avoid rate limits
            console.log('    -> Waiting 10s...')
            await new Promise(resolve => setTimeout(resolve, 10000))

        } catch (error) {
            console.error(`    -> Error processing ${shoe.brand} ${shoe.modelName}:`, error)
            failCount++
            // Wait even on error
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    }

    console.log('\nAll processing complete!')
    console.log(`Success: ${successCount}, Failed/Skipped: ${failCount}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
