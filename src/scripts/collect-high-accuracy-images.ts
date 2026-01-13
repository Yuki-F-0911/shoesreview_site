import { PrismaClient } from '@prisma/client'
import { extractOgpImage } from '../lib/utils/ogp'
import { searchWebArticles } from '../lib/ai/web-search'
import fs from 'fs'
import path from 'path'

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
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
})

const BRAND_DOMAINS: Record<string, string[]> = {
    'Nike': ['nike.com'],
    'Adidas': ['adidas.jp', 'adidas.com'],
    'Asics': ['asics.com'],
    'New Balance': ['newbalance.jp', 'newbalance.com'],
    'Hoka': ['hoka.com'],
    'Saucony': ['saucony.com', 'saucony-japan.com'],
    'Mizuno': ['mizuno.jp', 'mizuno.com'],
    'On': ['on.com', 'on-running.com'],
    'Altra': ['altrarunning.jp', 'altra.com'],
    'Topo Athletic': ['topoathletic.jp', 'topoathletic.com'],
    'Salomon': ['salomon.com'],
    'Brooks': ['brooksrunning.co.jp', 'brooksrunning.com'],
    'Puma': ['puma.com'],
    'Under Armour': ['underarmour.co.jp', 'underarmour.com']
}

function isAmazonLogo(url: string): boolean {
    const lower = url.toLowerCase()
    return lower.includes('logo') ||
        lower.includes('icon') ||
        lower.includes('share-icons') ||
        lower.includes('previewdoh') || // Amazon specific
        lower.includes('nav-sprite') ||
        lower.includes('transparent-pixel')
}

async function main() {
    console.log('Starting Refined High Accuracy Image Collection...')

    const shoes = await prisma.shoe.findMany({
        orderBy: { createdAt: 'desc' }
    })

    console.log(`Processing ${shoes.length} shoes...`)

    for (const shoe of shoes) {
        console.log(`\nProcessing: ${shoe.brand} ${shoe.modelName}`)

        let foundImage = null
        const validDomains = BRAND_DOMAINS[shoe.brand]

        // Strategy 1: Official Site Search (Broader)
        if (validDomains) {
            console.log(`  [1] Searching Official Site...`)
            try {
                // Search for "Brand ModelName 公式" or just "Brand ModelName"
                const query = `${shoe.brand} ${shoe.modelName} 公式`
                const results = await searchWebArticles(query, 5)

                for (const item of results.items) {
                    // Check if URL belongs to valid domain
                    if (validDomains.some(d => item.url.includes(d))) {
                        console.log(`    -> Found Official URL: ${item.url}`)
                        const ogp = await extractOgpImage(item.url)
                        if (ogp && !isAmazonLogo(ogp)) { // Sanity check even for official
                            console.log(`    -> Found OGP: ${ogp}`)
                            foundImage = ogp
                            break
                        }
                    }
                }
            } catch (e) {
                console.error(`    -> Error searching official: ${e}`)
            }
        }

        // Strategy 2: Amazon.co.jp Fallback
        if (!foundImage) {
            console.log(`  [2] Searching Amazon.co.jp...`)
            try {
                const query = `site:amazon.co.jp ${shoe.brand} ${shoe.modelName}`
                const results = await searchWebArticles(query, 3)

                for (const item of results.items) {
                    // Skip search result pages, look for product pages
                    if (item.url.includes('/dp/') || item.url.includes('/gp/product/')) {
                        console.log(`    -> Found Amazon URL: ${item.url}`)
                        const ogp = await extractOgpImage(item.url)
                        if (ogp) {
                            if (!isAmazonLogo(ogp)) {
                                console.log(`    -> Found OGP: ${ogp}`)
                                foundImage = ogp
                                break
                            } else {
                                console.log(`    -> Skipped Amazon Logo: ${ogp}`)
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(`    -> Error searching Amazon: ${e}`)
            }
        }

        if (foundImage) {
            await prisma.shoe.update({
                where: { id: shoe.id },
                data: {
                    imageUrls: [foundImage]
                }
            })
            console.log(`  -> SAVED image for ${shoe.modelName}`)
        } else {
            console.log(`  -> FAILED to find image for ${shoe.modelName}`)
        }

        // Wait to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000))
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
