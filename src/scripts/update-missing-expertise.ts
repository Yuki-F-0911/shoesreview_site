
import fs from 'fs';
import path from 'path';
// @ts-expect-error csv-parse/sync has no type declarations
import { parse } from 'csv-parse/sync';
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

const COLUMN_INDICES = {
    SHOE_NAME: 1,
    SPECIALTY: 24,
};

async function main() {
    const csvFilePath = path.join(process.cwd(), 'ランニングシューズ レビューフォーム（回答） - フォームの回答 1.csv');
    console.log(`Reading CSV from ${csvFilePath}`);

    if (!fs.existsSync(csvFilePath)) {
        console.error('CSV file not found');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records = parse(fileContent, {
        columns: false,
        from_line: 2,
        skip_empty_lines: true
    });

    console.log(`Found ${records.length} records to process for expertise update`);

    for (const record of records) {
        const shoeNameRaw = record[COLUMN_INDICES.SHOE_NAME];
        const expertise = record[COLUMN_INDICES.SPECIALTY];

        if (!shoeNameRaw || !expertise) continue;

        // Parse Brand/Model
        let brand = '';
        let modelName = '';
        const parts = shoeNameRaw.trim().split(/[\s　]+/);
        if (parts.length >= 2) {
            brand = parts[0];
            modelName = parts.slice(1).join(' ');
        } else {
            brand = 'Unknown';
            modelName = shoeNameRaw;
        }

        // Normalize Brand (simplified)
        const brandLower = brand.toLowerCase();
        if (brandLower.includes('nike') || brandLower.includes('ナイキ')) brand = 'Nike';
        else if (brandLower.includes('asics') || brandLower.includes('アシックス')) brand = 'Asics';
        else if (brandLower.includes('adidas') || brandLower.includes('アディダス')) brand = 'Adidas';
        else if (brandLower.includes('hoka') || brandLower.includes('ホカ')) brand = 'Hoka';
        else if (brandLower.includes('on') || brandLower.includes('オン')) brand = 'On';

        // Find Shoe
        const shoe = await prisma.shoe.findFirst({
            where: {
                brand: { contains: brand, mode: 'insensitive' },
                modelName: { contains: modelName, mode: 'insensitive' }
            }
        });

        if (shoe) {
            // Update latest review for this shoe that has missing expertise
            const review = await prisma.review.findFirst({
                where: {
                    shoeId: shoe.id,
                    reviewerExpertise: null
                } as any,
                orderBy: { createdAt: 'desc' } as any
            });

            if (review) {
                await prisma.review.update({
                    where: { id: review.id },
                    data: { reviewerExpertise: expertise } as any
                });
                console.log(`Updated expertise for ${brand} ${modelName}: ${expertise}`);
            } else {
                console.log(`No review needing update for ${brand} ${modelName}`);
            }
        } else {
            console.log(`Shoe not found: ${brand} ${modelName}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
