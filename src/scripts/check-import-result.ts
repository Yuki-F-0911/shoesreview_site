import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== Review Count Summary ===');

    const totalReviews = await prisma.review.count();
    console.log('Total Reviews:', totalReviews);

    const userReviews = await prisma.review.count({ where: { type: 'USER' } });
    console.log('USER Reviews:', userReviews);

    // Get some sample shoe data
    const shoesWithUserReviews = await prisma.shoe.findMany({
        where: {
            reviews: {
                some: { type: 'USER' }
            }
        },
        select: {
            brand: true,
            modelName: true,
            _count: {
                select: { reviews: true }
            }
        },
        take: 20
    });

    console.log('\nShoes with USER reviews:');
    shoesWithUserReviews.forEach(s => {
        console.log(`  ${s.brand} ${s.modelName}: ${s._count.reviews} reviews`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
