import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const url = process.env.DATABASE_URL
    if (!url) {
        console.log('DATABASE_URL is NOT set.')
        return
    }

    // Mask password for security
    const masked = url.replace(/:([^:@]+)@/, ':****@')
    console.log(`Loaded DATABASE_URL: ${masked}`)

    try {
        await prisma.$connect()
        console.log('Successfully connected to database!')
        await prisma.$disconnect()
    } catch (e: any) {
        console.error('Connection failed:', e.message)
    }
}

main()
