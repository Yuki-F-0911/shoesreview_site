import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const shoes = await prisma.shoe.findMany({
        orderBy: { category: 'asc' }
    })

    console.log('--- Shoes by Category ---')
    let currentCategory = ''
    shoes.forEach(shoe => {
        if (shoe.category !== currentCategory) {
            console.log(`\n[${shoe.category}]`)
            currentCategory = shoe.category
        }
        console.log(`  - ${shoe.brand} ${shoe.modelName}`)
    })
    console.log('-----------------------------')
    console.log(`Total: ${shoes.length}`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
