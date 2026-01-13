import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const sneakers = ['Air Max 90', 'Chuck Taylor All Star']

    console.log('Removing reviews for sneakers:', sneakers)

    const shoes = await prisma.shoe.findMany({
        where: {
            modelName: {
                in: sneakers
            }
        }
    })

    const shoeIds = shoes.map(s => s.id)

    if (shoeIds.length === 0) {
        console.log('No sneaker shoes found.')
        return
    }

    const result = await prisma.review.deleteMany({
        where: {
            shoeId: {
                in: shoeIds
            }
        }
    })

    console.log(`Deleted ${result.count} reviews for sneakers.`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
