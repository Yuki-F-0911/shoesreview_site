import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Clearing all shoe images...')

    const result = await prisma.shoe.updateMany({
        data: {
            imageUrls: []
        }
    })

    console.log(`Cleared images for ${result.count} shoes.`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
