import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Fetch all shoes and filter in memory
    const allShoes = await prisma.shoe.findMany()
    const missing = allShoes.filter(s => s.imageUrls.length === 0)

    console.log(`Total Shoes: ${allShoes.length}`)
    console.log(`Missing Images: ${missing.length}`)

    if (missing.length > 0) {
        console.log('--- Shoes without images ---')
        missing.forEach(s => console.log(`- ${s.brand} ${s.modelName}`))
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
