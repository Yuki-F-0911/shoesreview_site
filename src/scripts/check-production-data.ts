import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking database content...')

    // Count Users
    const userCount = await prisma.user.count()
    console.log(`Total Users: ${userCount}`)

    // Check for Admin User
    const adminUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: 'admin@example.com' }, // Adjust if you know the specific admin email
                { username: 'admin' }
            ]
        }
    })
    if (adminUser) {
        console.log(`Admin User Found: ${adminUser.username} (${adminUser.email})`)
    } else {
        console.log('Admin User NOT Found')
    }

    // Count Shoes
    const shoeCount = await prisma.shoe.count()
    console.log(`Total Shoes: ${shoeCount}`)

    // Count Reviews
    const reviewCount = await prisma.review.count()
    console.log(`Total Reviews: ${reviewCount}`)

    // Count Published Reviews (isPublished removed from schema, just count all)
    // const publishedReviewCount = await prisma.review.count({
    //     where: { isPublished: true }
    // })
    // console.log(`Published Reviews: ${publishedReviewCount}`)

    // List first 5 shoes
    const shoes = await prisma.shoe.findMany({
        take: 5,
        select: { id: true, brand: true, modelName: true }
    })
    console.log('First 5 Shoes:', JSON.stringify(shoes, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
