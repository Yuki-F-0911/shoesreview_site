import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL;
if (!url) {
    throw new Error('DATABASE_URL is not set');
}
const newUrl = url.includes('pgbouncer=true')
    ? url
    : (url.includes('?') ? `${url}&pgbouncer=true` : `${url}?pgbouncer=true`);

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: newUrl,
        },
    },
});

async function main() {
    const categories = await prisma.shoe.findMany({
        select: { category: true },
        distinct: ['category']
    });
    console.log(JSON.stringify(categories, null, 2));
}

main()
    .finally(() => prisma.$disconnect());
