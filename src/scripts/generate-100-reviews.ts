
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
    console.log('Starting 100 reviews generation...')

    // 1. Find shoes that DO NOT have an AI_SUMMARY review yet
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
            createdAt: 'desc' // Prioritize recently added shoes (like the new category ones)
        },
        take: 100 // Target 100 shoes
    })

    console.log(`Found ${targetShoes.length} shoes needing reviews.`)

    let successCount = 0
    let failCount = 0

    for (const shoe of targetShoes) {
        console.log(`\nProcessing: ${shoe.brand} ${shoe.modelName}...`)

        try {
            // 2. Collect reviews (Max 5 references)
            console.log('  - Collecting sources...')
            const collectionResult = await refreshCuratedSourcesForShoe(shoe.id, {
                maxResults: 5,
                includeVideos: true, // Enable videos
                includeWeb: true,
            })
            console.log(`    -> Created ${collectionResult.created} new sources.`)

            // 3. Fetch sources for summarization
            const sources = await prisma.curatedSource.findMany({
                where: { shoeId: shoe.id },
                take: 5, // Use top 5 sources
                orderBy: { reliability: 'desc' },
            })

            if (sources.length < 3) {
                console.log(`    -> Only found ${sources.length} sources. Skipping summarization (need at least 3).`)
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

            if (successCount >= 100) {
                console.log('Reached 100 reviews limit.')
                break
            }

            // Wait 5 seconds to avoid rate limits (slightly faster than 10s)
            console.log('    -> Waiting 5s...')
            await new Promise(resolve => setTimeout(resolve, 5000))

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
