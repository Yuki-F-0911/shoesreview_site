import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
    // Check which shoes that have external reviews also have regular reviews (shown on site)
    const shoesWithExtReviews = await p.shoe.findMany({
        where: { externalReviews: { some: {} } },
        select: {
            id: true, brand: true, modelName: true, imageUrls: true,
            _count: { select: { externalReviews: true, reviews: true } }
        },
        orderBy: { externalReviews: { _count: 'desc' } },
    })

    console.log('=== Shoes with External Reviews ===')
    let withRegularReviews = 0
    let withImages = 0
    for (const s of shoesWithExtReviews) {
        const hasReviews = s._count.reviews > 0
        const hasImages = (s.imageUrls?.length || 0) > 0
        if (hasReviews) withRegularReviews++
        if (hasImages) withImages++
        console.log(`  ${s.brand} ${s.modelName}: ext=${s._count.externalReviews} reg=${s._count.reviews} img=${hasImages ? 'yes' : 'no'} id=${s.id}`)
    }
    console.log(`\nTotal: ${shoesWithExtReviews.length} shoes with ext reviews`)
    console.log(`With regular reviews (visible on site): ${withRegularReviews}`)
    console.log(`With images: ${withImages}`)

    // Check total counts
    const totalExt = await p.externalReview.count()
    console.log(`\nTotal external reviews: ${totalExt}`)

    await p.$disconnect()
}
main()
