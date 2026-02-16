
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
    try {
        const total = await prisma.externalReview.count()
        const enriched = await prisma.externalReview.count({
            where: {
                aiSummary: { not: null }
            }
        })
        console.log(`Total: ${total}, Enriched: ${enriched}`)
    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
