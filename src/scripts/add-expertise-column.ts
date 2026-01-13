
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
    console.log('Applying schema changes for expertise...');

    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerExpertise" TEXT;`);
        console.log('Schema changes applied successfully.');
    } catch (e) {
        console.error('Error applying schema changes:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
