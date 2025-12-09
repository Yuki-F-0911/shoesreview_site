
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';


const url = process.env.DATABASE_URL;
if (!url) {
    throw new Error('DATABASE_URL is not set');
}
const newUrl = url.includes('pgbouncer=true')
    ? url
    : (url.includes('?') ? `${url}&pgbouncer=true` : `${url}?pgbouncer=true`);

// console.log('Using modified DB URL for PgBouncer compatibility...');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: newUrl,
        },
    },
});


// CSV Column mapping based on the provided file
// Index based mapping since headers might be long Japanese strings
const COLUMN_INDICES = {
    TIMESTAMP: 0,
    SHOE_NAME: 1, // "シューズ名 (ブランド名とモデル名 (例)Nike ペガサス41)"
    SIZE: 2,
    // Comfort (Step-in)
    STEP_TOE_WIDTH: 3, // "つま先の広さ"
    STEP_INSTEP_HEIGHT: 4, // "甲の高さ"
    STEP_HEEL_HOLD: 5, // "ヒールのホールド感"
    // Comfort (Running)
    RUN_LIGHTNESS: 6, // "軽さの実感"
    RUN_SINK_DEPTH: 7, // "沈み込みの深さ"
    RUN_TRANSITION: 8, // "トランジション（転がり）"
    RUN_RESPONSE: 9, // "反発のリズム"
    RUN_STABILITY: 10, // "安定性"
    // Fatigue
    FATIGUE_LEVEL: 11, // "走行後の状態（アフター・ラン）" <- Maybe overall rating or fatigue level? Value is '2', '4', '1'. Let's check CSV.
    // CSV Row 3: '2', Row 4: '4'. Reviewer comment: "全く感じない" etc.
    // Actually col 11 seems to be a number. Let's assume it's overall fatigue or something. 
    // Wait, Row 3 has "2". Next cols are "全く感じない"...
    FATIGUE_SOLE: 12,
    FATIGUE_CALF: 13,
    FATIGUE_KNEE: 14,
    FATIGUE_OTHER: 15,
    // SD Method
    SD_LANDING: 16,
    SD_RESPONSE: 17,
    SD_STABILITY: 18,
    SD_WIDTH: 19,
    SD_DESIGN: 20,
    // Other
    SD_NOTE: 21,
    ONOMATOPOEIA: 22,
    // User Stats
    GENDER: 23,
    SPECIALTY: 24,
    HEIGHT: 25,
    WEIGHT: 26,
    WEEKLY_DISTANCE: 27,
    PB: 28,
    FOOT_SHAPE: 29,
    FOOT_SHAPE_DETAIL: 30,
    LANDING_TYPE: 31,
    LANDING_TYPE_NOTE: 32
};

// Mapping helpers
function mapRating(value: string): number | null {
    // "非常に良い" -> 5, "良い" -> 4, "普通" -> 3, "悪い" -> 2, "非常に悪い" -> 1
    if (!value) return null;
    if (value.includes('非常に良い')) return 5;
    if (value === '良い') return 4;
    if (value === '普通') return 3;
    if (value === '悪い') return 2;
    if (value.includes('非常に悪い')) return 1;
    return 3; // Default
}

function mapSDRating(value: string): number | null {
    if (!value) return null;
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
}

async function main() {
    const csvFilePath = path.join(process.cwd(), 'ランニングシューズ レビューフォーム（回答） - フォームの回答 1.csv');
    console.log(`Reading CSV from ${csvFilePath}`);

    if (!fs.existsSync(csvFilePath)) {
        console.error('CSV file not found');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records = parse(fileContent, {
        columns: false, // Use index based
        from_line: 2, // Skip header
        skip_empty_lines: true
    });

    console.log(`Found ${records.length} records`);

    for (const record of records) {
        try {
            // 1. Parse Shoe Name
            const shoeNameRaw = record[COLUMN_INDICES.SHOE_NAME];
            if (!shoeNameRaw) continue;

            // Simple heuristic split: Space or " "
            // Example: "Nike ペガサス41", "アシックス ノヴァブラスト5", "on CLOUD10000"
            // If brand is first word involved.
            let brand = '';
            let modelName = '';

            const parts = shoeNameRaw.trim().split(/[\s　]+/); // split by space or full-width space
            if (parts.length >= 2) {
                brand = parts[0];
                modelName = parts.slice(1).join(' ');
            } else {
                // Fallback if no space
                brand = 'Unknown';
                modelName = shoeNameRaw;
            }

            // Normalize Brand
            const brandLower = brand.toLowerCase();
            if (brandLower.includes('nike') || brandLower.includes('ナイキ')) brand = 'Nike';
            else if (brandLower.includes('asics') || brandLower.includes('アシックス')) brand = 'Asics';
            else if (brandLower.includes('adidas') || brandLower.includes('アディダス')) brand = 'Adidas';
            else if (brandLower.includes('hoka') || brandLower.includes('ホカ')) brand = 'Hoka';
            else if (brandLower.includes('on') || brandLower.includes('オン')) brand = 'On';
            else if (brandLower.includes('new balance') || brandLower.includes('ニューバランス')) brand = 'New Balance';
            else if (brandLower.includes('mizuno') || brandLower.includes('ミズノ')) brand = 'Mizuno';
            else if (brandLower.includes('puma') || brandLower.includes('プーマ')) brand = 'Puma';


            // 2. Find or Create Shoe
            // Check exact match first
            let shoe = await prisma.shoe.findFirst({
                where: {
                    brand: { contains: brand, mode: 'insensitive' },
                    modelName: { contains: modelName, mode: 'insensitive' }
                }
            });

            if (!shoe) {
                console.log(`Shoe not found, creating: ${brand} ${modelName}`);
                shoe = await prisma.shoe.create({
                    data: {
                        brand,
                        modelName,
                        category: 'ランニング', // Default
                        imageUrls: [],
                        officialPrice: 0,
                    }
                });
            }

            // 3. Create User (Guest)
            // Generate a unique username based on the record to avoid collisions but keep it consistent if re-run?
            // Actually, user requested "Individual reviews", so let's make a new user per row.
            const randomSuffix = crypto.randomBytes(4).toString('hex');
            const username = `guest_${randomSuffix}`;
            const email = `${username}@example.com`;

            const user = await prisma.user.create({
                data: {
                    username,
                    email,
                    displayName: `Guest Runner ${randomSuffix}`,
                    password: await crypto.hash('sha256', 'password'), // Dummy password
                }
            });

            // 4. Create Review
            await prisma.review.create({
                data: {
                    shoeId: shoe.id,
                    userId: user.id,
                    title: `${shoe.brand} ${shoe.modelName} レビュー`, // Default title
                    content: record[COLUMN_INDICES.SD_NOTE] || record[COLUMN_INDICES.FOOT_SHAPE_DETAIL] || '詳細なコメントはありません。', // Use notes as content for now
                    type: 'USER',
                    overallRating: 4.0, // Default or derived? CSV doesn't have an explicit 1-5 overall rating col?
                    // Wait, maybe we can avg the 1-5 ratings?
                    // Map all new fields
                    stepInToeWidth: mapRating(record[COLUMN_INDICES.STEP_TOE_WIDTH]),
                    stepInInstepHeight: mapRating(record[COLUMN_INDICES.STEP_INSTEP_HEIGHT]),
                    stepInHeelHold: mapRating(record[COLUMN_INDICES.STEP_HEEL_HOLD]),

                    runLightness: mapRating(record[COLUMN_INDICES.RUN_LIGHTNESS]),
                    runSinkDepth: mapRating(record[COLUMN_INDICES.RUN_SINK_DEPTH]),
                    runStability: mapRating(record[COLUMN_INDICES.RUN_STABILITY]),
                    runTransition: mapRating(record[COLUMN_INDICES.RUN_TRANSITION]),
                    runResponse: mapRating(record[COLUMN_INDICES.RUN_RESPONSE]),

                    fatigueSole: record[COLUMN_INDICES.FATIGUE_SOLE],
                    fatigueCalf: record[COLUMN_INDICES.FATIGUE_CALF],
                    fatigueKnee: record[COLUMN_INDICES.FATIGUE_KNEE],
                    fatigueOther: record[COLUMN_INDICES.FATIGUE_OTHER],

                    sdLanding: mapSDRating(record[COLUMN_INDICES.SD_LANDING]),
                    sdResponse: mapSDRating(record[COLUMN_INDICES.SD_RESPONSE]),
                    sdStability: mapSDRating(record[COLUMN_INDICES.SD_STABILITY]),
                    sdWidth: mapSDRating(record[COLUMN_INDICES.SD_WIDTH]),
                    sdDesign: mapSDRating(record[COLUMN_INDICES.SD_DESIGN]),

                    onomatopoeia: record[COLUMN_INDICES.ONOMATOPOEIA],
                    purchaseSize: record[COLUMN_INDICES.SIZE],

                    // Reviewer stats
                    reviewerGender: record[COLUMN_INDICES.GENDER],
                    reviewerExpertise: record[COLUMN_INDICES.SPECIALTY],
                    reviewerHeight: parseFloat(record[COLUMN_INDICES.HEIGHT]) || null,
                    reviewerWeight: parseFloat(record[COLUMN_INDICES.WEIGHT]) || null,
                    reviewerWeeklyDistance: parseFloat(record[COLUMN_INDICES.WEEKLY_DISTANCE]) || null,
                    reviewerPersonalBest: record[COLUMN_INDICES.PB],
                    reviewerFootShape: record[COLUMN_INDICES.FOOT_SHAPE],
                    reviewerLandingType: record[COLUMN_INDICES.LANDING_TYPE],
                } as any
            });
            console.log(`Imported review for ${shoe.brand} ${shoe.modelName}`);

        } catch (e) {
            console.error(`Error processing row: ${JSON.stringify(record)}`, e);
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
