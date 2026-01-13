import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const casualShoes = await prisma.shoe.findMany({
        where: {
            OR: [
                { category: 'カジュアル' },
                { category: 'Casual' },
                { category: 'スニーカー' },
                { brand: 'Converse' },
                { modelName: { contains: 'Air Max' } }
            ]
        }
    })

    console.log('--- Potential Sneakers ---')
    casualShoes.forEach(shoe => {
        console.log(`[${shoe.brand}] ${shoe.modelName} (${shoe.category})`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
