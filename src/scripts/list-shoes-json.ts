
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const shoes = await prisma.shoe.findMany({
        select: {
            brand: true,
            modelName: true,
            category: true,
            _count: {
                select: {
                    reviews: true,
                    curatedSources: true,
                }
            }
        },
        orderBy: {
            brand: 'asc',
        }
    })

    console.log(JSON.stringify(shoes, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
