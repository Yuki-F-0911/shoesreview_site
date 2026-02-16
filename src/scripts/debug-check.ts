
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
    try {
        const count = await prisma.externalReview.count()
        console.log(`ExternalReview count: ${count}`)
    } catch (e) {
        console.error('Error counting external reviews:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
