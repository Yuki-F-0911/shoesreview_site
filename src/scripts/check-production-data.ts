import { PrismaClient } from '@prisma/client'
import fs from 'fs';

const logFile = 'check-result.txt';

function log(msg: string) {
    console.log(msg);
    try {
        fs.appendFileSync(logFile, msg + '\n');
    } catch (e) { /* ignore */ }
}

async function main() {
    try {
        fs.writeFileSync(logFile, 'Checking database content with PgBouncer fix...\n');
    } catch (e) { /* ignore */ }

    log('Checking database content...');

    // Check DB Connection String
    let dbUrl = process.env.DATABASE_URL || '';

    // Add pgbouncer=true if likely using Supabase Transaction connection
    if (dbUrl.includes('6543') && !dbUrl.includes('pgbouncer=true')) {
        log('Adding pgbouncer=true to connection string...');
        const separator = dbUrl.includes('?') ? '&' : '?';
        dbUrl = `${dbUrl}${separator}pgbouncer=true`;
        process.env.DATABASE_URL = dbUrl;
    }

    const isSupabase = dbUrl.includes('supabase');
    const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    const isVercel = dbUrl.includes('vercel');

    let connectionType = 'Unknown';
    if (isSupabase) connectionType = 'Supabase (Production?)';
    else if (isLocal) connectionType = 'Localhost (Development)';
    else if (isVercel) connectionType = 'Vercel Postgres';

    log(`Database connection type: ${connectionType}`)

    const prisma = new PrismaClient();

    try {
        // Count Shoes
        const shoeCount = await prisma.shoe.count()
        log(`Total Shoes: ${shoeCount}`)

        // Count Reviews
        const reviewCount = await prisma.review.count()
        log(`Total Reviews: ${reviewCount}`)

        // List first 5 shoes
        const shoes = await prisma.shoe.findMany({
            take: 5,
            select: { id: true, brand: true, modelName: true }
        })
        log('First 5 Shoes: ' + JSON.stringify(shoes, null, 2))

        // List latest 5 reviews WITHOUT orderBy (createdAt doesn't exist)
        const reviews = await prisma.review.findMany({
            take: 5,
            include: {
                shoe: { select: { brand: true, modelName: true } },
                user: { select: { username: true } }
            }
        })

        log('Sample 5 Reviews:');
        if (reviews.length === 0) {
            log('No reviews found.');
        } else {
            reviews.forEach((r: any) => {
                log(`- [${r.type}] ${r.shoe?.brand} ${r.shoe?.modelName}: "${r.title}" by ${r.user?.username || 'AI'} (${r.id})`);
            });
        }

        log('SUCCESS: All queries completed without error.');
        await prisma.$disconnect();

    } catch (error) {
        log('Error querying database: ' + error);
        await prisma.$disconnect();
    }
}

main()
    .catch(e => {
        log('Fatal Error: ' + e)
        process.exit(1)
    })
