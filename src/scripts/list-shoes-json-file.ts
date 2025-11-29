
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

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

    fs.writeFileSync(path.join(process.cwd(), 'shoes_list.json'), JSON.stringify(shoes, null, 2))
    console.log('Done')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
