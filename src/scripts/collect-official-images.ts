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

const BRAND_DOMAINS: Record<string, string> = {
    'Nike': 'nike.com',
    'Adidas': 'adidas', // adidas.com or adidas.jp
    'Asics': 'asics.com',
    'New Balance': 'newbalance',
    'Hoka': 'hoka.com',
    'Saucony': 'saucony',
    'Mizuno': 'mizuno',
    'On': 'on.com', // or on-running
    'Altra': 'altra',
    'Topo Athletic': 'topoathletic',
    'Salomon': 'salomon.com',
    'Brooks': 'brooks',
    'Puma': 'puma.com',
    'Under Armour': 'underarmour'
}

async function main() {
    console.log('Starting Official Image Collection...')

    const shoes = await prisma.shoe.findMany({
        orderBy: { createdAt: 'desc' }
    })

    console.log(`Processing ${shoes.length} shoes...`)

    for (const shoe of shoes) {
        console.log(`\nProcessing: ${shoe.brand} ${shoe.modelName}`)

        const brandDomain = BRAND_DOMAINS[shoe.brand]
        if (!brandDomain) {
            console.log(`  -> Unknown brand domain for ${shoe.brand}, skipping specific filter.`)
        }

        try {
            // Search for official page
            const query = `${shoe.brand} ${shoe.modelName} 公式`
            const results = await searchWebArticles(query, 5)

            let officialUrl = null

            // Find first result matching brand domain
            for (const item of results.items) {
                if (brandDomain && item.url.toLowerCase().includes(brandDomain)) {
                    officialUrl = item.url
                    console.log(`  -> Found official URL: ${officialUrl}`)
                    break
                }
            }

            // Fallback: if no official domain match, take the top result if it looks plausible (skip amazon/rakuten if possible)
            if (!officialUrl && results.items.length > 0) {
                // Simple heuristic: skip known marketplaces if we want "official" feel, but sometimes marketplaces have good images too.
                // For now, let's try to stick to the plan of "Official".
                // If we can't find official, maybe we shouldn't overwrite if we already have something?
                // But user said current images are bad.
            }

            if (officialUrl) {
                const ogpImage = await extractOgpImage(officialUrl)
                if (ogpImage) {
                    console.log(`  -> Found OGP Image: ${ogpImage}`)

                    await prisma.shoe.update({
                        where: { id: shoe.id },
                        data: {
                            imageUrls: [ogpImage]
                        }
                    })
                    console.log(`  -> Updated shoe image!`)
                } else {
                    console.log(`  -> No OGP image found at official URL.`)
                }
            } else {
                console.log(`  -> No official URL found in top results.`)
            }

        } catch (e) {
            console.error(`  -> Error: ${e}`)
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
