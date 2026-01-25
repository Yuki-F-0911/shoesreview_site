
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    const lines: string[] = []
    const log = (msg: string) => {
        console.log(msg)
        lines.push(msg)
    }

    log('Checking for casual sneakers...')

    // 1. Find Converse shoes
    const converseShoes = await prisma.shoe.findMany({
        where: {
            brand: {
                contains: 'Converse',
                mode: 'insensitive'
            }
        },
        include: {
            reviews: true
        }
    })
    log(`Found ${converseShoes.length} Converse shoes.`)
    converseShoes.forEach(s => log(` - [${s.brand}] ${s.modelName} (Reviews: ${s.reviews.length})`))

    // 2. Find Air Max shoes
    const airMaxShoes = await prisma.shoe.findMany({
        where: {
            modelName: {
                contains: 'Air Max',
                mode: 'insensitive'
            }
        },
        include: {
            reviews: true
        }
    })
    log(`Found ${airMaxShoes.length} Air Max shoes.`)
    airMaxShoes.forEach(s => log(` - [${s.brand}] ${s.modelName} (Reviews: ${s.reviews.length})`))

    // 3. Find Vans
    const vansShoes = await prisma.shoe.findMany({
        where: {
            brand: {
                contains: 'Vans',
                mode: 'insensitive'
            }
        },
        include: {
            reviews: true
        }
    })
    log(`Found ${vansShoes.length} Vans shoes.`)
    vansShoes.forEach(s => log(` - [${s.brand}] ${s.modelName} (Reviews: ${s.reviews.length})`))

    // 4. Find anything with category not strictly running (if inconsistent)
    const categories = await prisma.shoe.groupBy({
        by: ['category'],
        _count: {
            id: true
        }
    })
    log('Categories: ' + JSON.stringify(categories))

    fs.writeFileSync('result.txt', lines.join('\n'))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
