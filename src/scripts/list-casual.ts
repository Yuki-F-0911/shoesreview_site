import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const shoes = await prisma.shoe.findMany({
        where: {
            category: 'カジュアル'
        }
    })

    console.log('--- Category: カジュアル ---')
    shoes.forEach(shoe => {
        console.log(`[${shoe.brand}] ${shoe.modelName}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
