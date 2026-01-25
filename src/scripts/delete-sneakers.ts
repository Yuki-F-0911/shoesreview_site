
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting cleanup of sneaker shoes...')

    // 1. Delete by Category "カジュアル"
    const deletedCasual = await prisma.shoe.deleteMany({
        where: {
            category: 'カジュアル'
        }
    })
    console.log(`Deleted ${deletedCasual.count} shoes with category 'カジュアル'.`)

    // 2. Delete Converse (if any left)
    const deletedConverse = await prisma.shoe.deleteMany({
        where: {
            brand: {
                contains: 'Converse',
                mode: 'insensitive'
            }
        }
    })
    console.log(`Deleted ${deletedConverse.count} Converse shoes.`)

    // 3. Delete Air Max (if any left)
    const deletedAirMax = await prisma.shoe.deleteMany({
        where: {
            modelName: {
                contains: 'Air Max',
                mode: 'insensitive'
            }
        }
    })
    console.log(`Deleted ${deletedAirMax.count} Air Max shoes.`)

    // 4. Delete specific other known sneakers if needed (e.g. Vans)
    const deletedVans = await prisma.shoe.deleteMany({
        where: {
            brand: {
                contains: 'Vans',
                mode: 'insensitive'
            }
        }
    })
    console.log(`Deleted ${deletedVans.count} Vans shoes.`)

    console.log('Cleanup completed.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
