
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

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
})

async function main() {
    const shoes = await prisma.shoe.findMany({
        include: {
            _count: {
                select: {
                    reviews: true,
                    curatedSources: true,
                },
            },
        },
    })

    console.log('Shoe Status:')
    console.log('--------------------------------------------------')
    console.log(
        `${'Brand'.padEnd(15)} | ${'Model'.padEnd(30)} | ${'Category'.padEnd(15)} | ${'Reviews'.padEnd(8)} | ${'Sources'.padEnd(8)}`
    )
    console.log('--------------------------------------------------')

    const shoesWithData = shoes.filter(s => s._count.reviews > 0 || s._count.curatedSources > 0);

    for (const shoe of shoesWithData) {
        console.log(
            `${shoe.brand.padEnd(15)} | ${shoe.modelName.padEnd(30)} | ${shoe.category.padEnd(15)} | ${String(shoe._count.reviews).padEnd(8)} | ${String(shoe._count.curatedSources).padEnd(8)}`
        )
    }

    if (shoesWithData.length === 0) {
        console.log('No shoes with collected reviews or sources found.')
    }

    console.log('--------------------------------------------------')
    console.log(`Total shoes with data: ${shoesWithData.length} / ${shoes.length}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
