import { PrismaClient } from '@prisma/client'
import { searchImages } from '../lib/ai/web-search'
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

function isBadImage(url: string): boolean {
    const lower = url.toLowerCase()
    return lower.includes('logo') ||
        lower.includes('icon') ||
        lower.includes('symbol') ||
        lower.includes('profile') ||
        lower.includes('header') ||
        lower.includes('avatar') ||
        lower.includes('default') ||
        lower.includes('svg') ||
        lower.includes('transparent') ||
        lower.includes('sprite') ||
        (lower.includes('amazon') && (lower.includes('play-button') || lower.includes('badge')))
}

async function main() {
    console.log('Starting Enhanced Google Image Search Collection...')

    // Fetch all shoes
    const allShoes = await prisma.shoe.findMany({
        orderBy: { createdAt: 'desc' }
    })

    // Filter for shoes with NO images
    // User said "all shoes not currently collected", but also "all shoes" in general.
    // Let's stick to missing ones first to fill gaps, or maybe check if existing ones are bad?
    // User said "collect for all shoes currently not collected".
    // But previously I cleared all images. So "missing" = "all" effectively if I cleared them.
    // Wait, I ran the script and it filled some.
    // So "missing" is correct.
    const shoes = allShoes.filter(s => s.imageUrls.length === 0)

    console.log(`Processing ${shoes.length} shoes without images (Total: ${allShoes.length})...`)

    for (const shoe of shoes) {
        console.log(`\nProcessing: ${shoe.brand} ${shoe.modelName}`)

        // Try multiple query strategies
        const queries = [
            `${shoe.brand} ${shoe.modelName} shoe product image`,
            `${shoe.brand} ${shoe.modelName} running shoe white background`,
            `${shoe.brand} ${shoe.modelName} official`,
            `${shoe.brand} ${shoe.modelName}`
        ]

        let foundImage = null

        for (const query of queries) {
            if (foundImage) break

            console.log(`  Trying query: "${query}"`)
            try {
                const results = await searchImages(query, 3)

                for (const item of results.items) {
                    console.log(`    -> Candidate: ${item.url}`)

                    if (!isBadImage(item.url)) {
                        // Prefer jpg/png/webp and reasonable size indicators if possible (url doesn't tell size usually)
                        if (item.url.match(/\.(jpg|jpeg|png|webp)$/i)) {
                            foundImage = item.url
                            console.log(`    -> SELECTED: ${foundImage}`)
                            break
                        }
                    } else {
                        console.log(`    -> Skipped (Bad pattern)`)
                    }
                }
            } catch (e) {
                console.error(`    -> Error: ${e}`)
            }

            // Wait a bit between queries
            await new Promise(resolve => setTimeout(resolve, 1000))
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
            console.log(`  -> FAILED to find image for ${shoe.modelName} after all attempts.`)
        }
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
