import { PrismaClient } from '@prisma/client'
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
    console.log('Checking AI Reviews and Sources...')
    try {
        const count = await prisma.review.count({
            where: { type: 'AI_SUMMARY' }
        })
        console.log(`Total AI reviews: ${count}`)

        const reviews = await prisma.review.findMany({
            where: { type: 'AI_SUMMARY' },
            include: { aiSources: true },
            take: 5,
            orderBy: { createdAt: 'desc' } as any
        })
        console.log(`Latest 5 AI reviews:`)
        reviews.forEach(r => {
            console.log(`Review: ${r.title}`)
            console.log(`  - Sources: ${r.aiSources.length}`)
            r.aiSources.forEach(s => console.log(`    - ${s.sourceTitle} (${s.sourceUrl})`))
        })
    } catch (e) {
        console.error('Error accessing Review table:', e)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
