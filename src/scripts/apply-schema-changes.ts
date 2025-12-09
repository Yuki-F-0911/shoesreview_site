
import { PrismaClient } from '@prisma/client';


const url = process.env.DATABASE_URL;
if (!url) {
    throw new Error('DATABASE_URL is not set');
}
const newUrl = url.includes('pgbouncer=true')
    ? url
    : (url.includes('?') ? `${url}&pgbouncer=true` : `${url}?pgbouncer=true`);

console.log('Using modified DB URL for PgBouncer compatibility...');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: newUrl,
        },
    },
});


async function main() {
    console.log('Applying schema changes...');

    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "stepInToeWidth" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "stepInInstepHeight" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "stepInHeelHold" INTEGER;`);

        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "runLightness" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "runSinkDepth" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "runStability" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "runTransition" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "runResponse" INTEGER;`);

        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "fatigueSole" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "fatigueCalf" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "fatigueKnee" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "fatigueOther" TEXT;`);

        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "sdLanding" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "sdResponse" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "sdStability" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "sdWidth" INTEGER;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "sdDesign" INTEGER;`);

        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "onomatopoeia" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "purchaseSize" TEXT;`);

        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerGender" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerHeight" DOUBLE PRECISION;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerWeight" DOUBLE PRECISION;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerWeeklyDistance" DOUBLE PRECISION;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerPersonalBest" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerFootShape" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerLandingType" TEXT;`);

        console.log('Schema changes applied successfully.');
    } catch (e) {
        console.error('Error applying schema changes:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
