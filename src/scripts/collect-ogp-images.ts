import { PrismaClient } from '@prisma/client'
import { extractOgpImage } from '../lib/utils/ogp'
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
    console.log('Starting OGP image collection...')

    // Fetch shoes that don't have images yet
    // Fetch all shoes and filter in memory to avoid Prisma query issues with arrays
    const allShoes = await prisma.shoe.findMany()

    const shoes = allShoes.filter(s => s.imageUrls.length === 0)

    console.log(`Found ${shoes.length} shoes without images.`)

    for (const shoe of shoes) {
        console.log(`Processing: ${shoe.brand} ${shoe.modelName}`)

        let foundImage = null

        // 1. Check review sources
        const reviews = await prisma.review.findMany({
            where: { shoeId: shoe.id },
            include: { aiSources: true }
        })

        for (const review of reviews) {
            for (const source of review.aiSources) {
                if (source.sourceUrl) {
                    console.log(`  - Checking source: ${source.sourceUrl}`)
                    const ogpImage = await extractOgpImage(source.sourceUrl)
                    if (ogpImage) {
                        console.log(`    -> Found OGP: ${ogpImage}`)
                        foundImage = ogpImage
                        break // Found one, stop looking for this shoe
                    }
                }
            }
            if (foundImage) break
        }

        // 2. If found, update shoe
        if (foundImage) {
            await prisma.shoe.update({
                where: { id: shoe.id },
                data: {
                    imageUrls: [foundImage]
                }
            })
            console.log(`    -> Updated shoe image!`)
        } else {
            console.log(`    -> No image found.`)
        }

        // Wait a bit to be nice to servers
        await new Promise(resolve => setTimeout(resolve, 1000))
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
