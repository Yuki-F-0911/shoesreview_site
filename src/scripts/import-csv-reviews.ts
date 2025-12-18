
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

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: newUrl,
        },
    },
});


// CSV Column mapping based on the provided file
const COLUMN_INDICES = {
    TIMESTAMP: 0,
    SHOE_NAME: 1,
    SIZE: 2,
    STEP_TOE_WIDTH: 3,
    STEP_INSTEP_HEIGHT: 4,
    STEP_HEEL_HOLD: 5,
    RUN_LIGHTNESS: 6,
    RUN_SINK_DEPTH: 7,
    RUN_TRANSITION: 8,
    RUN_RESPONSE: 9,
    RUN_STABILITY: 10,
    FATIGUE_LEVEL: 11,
    FATIGUE_SOLE: 12,
    FATIGUE_CALF: 13,
    FATIGUE_KNEE: 14,
    FATIGUE_OTHER: 15,
    SD_LANDING: 16,
    SD_RESPONSE: 17,
    SD_STABILITY: 18,
    SD_WIDTH: 19,
    SD_DESIGN: 20,
    SD_NOTE: 21,
    ONOMATOPOEIA: 22,
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
    if (!value) return null;
    if (value.includes('非常に良い')) return 5;
    if (value === '良い') return 4;
    if (value === '普通') return 3;
    if (value === '悪い') return 2;
    if (value.includes('非常に悪い')) return 1;
    return 3;
}

function mapSDRating(value: string): number | null {
    if (!value) return null;
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
}

// 配列フィールドをパースするヘルパー関数
function parseArrayField(value: string): string[] {
    if (!value) return [];
    // カンマ区切りまたは改行区切りで分割
    return value.split(/[,、\n]/).map(s => s.trim()).filter(Boolean);
}

// パスワードハッシュ用関数
function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// 重複チェック用のユニークキー生成
function generateReviewKey(shoeId: string, timestamp: string, size: string): string {
    return `${shoeId}_${timestamp}_${size}`;
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
        columns: false,
        from_line: 2,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true
    });

    console.log(`Found ${records.length} records`);

    // 既存のレビューを取得して重複チェック用のセットを作成
    const existingReviews = await prisma.review.findMany({
        select: {
            shoeId: true,
            purchaseSize: true,
            reviewerHeight: true,
            reviewerWeight: true,
        }
    });

    const existingKeys = new Set(
        existingReviews.map(r => `${r.shoeId}_${r.purchaseSize}_${r.reviewerHeight}_${r.reviewerWeight}`)
    );

    let importedCount = 0;
    let skippedCount = 0;

    for (const record of records) {
        try {
            const shoeNameRaw = record[COLUMN_INDICES.SHOE_NAME];
            if (!shoeNameRaw) {
                console.log('Skipping empty shoe name');
                continue;
            }

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
            else if (brandLower.includes('saucony') || brandLower.includes('サッカニー')) brand = 'Saucony';
            else if (brandLower.includes('brooks') || brandLower.includes('ブルックス')) brand = 'Brooks';

            // モデル名の正規化（例：「サッカニー、エンドルフィンプロ2」→「エンドルフィンプロ2」）
            modelName = modelName.replace(/^[、,\s]+/, '');

            // Find or Create Shoe
            let shoe = await prisma.shoe.findFirst({
                where: {
                    brand: { contains: brand, mode: 'insensitive' },
                    modelName: { contains: modelName.split(' ')[0], mode: 'insensitive' }
                }
            });

            if (!shoe) {
                console.log(`Shoe not found, creating: ${brand} ${modelName}`);
                shoe = await prisma.shoe.create({
                    data: {
                        brand,
                        modelName,
                        category: 'ランニング',
                        imageUrls: [],
                        officialPrice: 0,
                    }
                });
            }

            // 重複チェック
            const purchaseSize = record[COLUMN_INDICES.SIZE]?.replace(/cm$/, '') || '';
            const reviewerHeight = parseFloat(record[COLUMN_INDICES.HEIGHT]) || null;
            const reviewerWeight = parseFloat(record[COLUMN_INDICES.WEIGHT]) || null;
            const duplicateKey = `${shoe.id}_${purchaseSize}_${reviewerHeight}_${reviewerWeight}`;

            if (existingKeys.has(duplicateKey)) {
                console.log(`Skipping duplicate review for ${shoe.brand} ${shoe.modelName} (size: ${purchaseSize})`);
                skippedCount++;
                continue;
            }

            // Create Guest User
            const randomSuffix = crypto.randomBytes(4).toString('hex');
            const username = `guest_${randomSuffix}`;
            const email = `${username}@example.com`;

            const user = await prisma.user.create({
                data: {
                    username,
                    email,
                    displayName: `Runner ${randomSuffix.slice(0, 4).toUpperCase()}`,
                    password: hashPassword('password123'),
                }
            });

            // Calculate overall rating from SD ratings
            const sdRatings = [
                mapSDRating(record[COLUMN_INDICES.SD_LANDING]),
                mapSDRating(record[COLUMN_INDICES.SD_RESPONSE]),
                mapSDRating(record[COLUMN_INDICES.SD_STABILITY]),
            ].filter((r): r is number => r !== null);

            const avgRating = sdRatings.length > 0
                ? (sdRatings.reduce((a, b) => a + b, 0) / sdRatings.length) * 2 // 1-5 -> 2-10
                : 7.0;

            // Build review content from available data
            const contentParts: string[] = [];
            if (record[COLUMN_INDICES.SD_NOTE]) {
                contentParts.push(record[COLUMN_INDICES.SD_NOTE]);
            }
            if (record[COLUMN_INDICES.ONOMATOPOEIA]) {
                contentParts.push(`履き心地: ${record[COLUMN_INDICES.ONOMATOPOEIA]}`);
            }
            if (record[COLUMN_INDICES.LANDING_TYPE_NOTE]) {
                contentParts.push(`接地タイプ補足: ${record[COLUMN_INDICES.LANDING_TYPE_NOTE]}`);
            }
            const content = contentParts.length > 0
                ? contentParts.join('\n\n')
                : `${shoe.brand} ${shoe.modelName}を使用してのレビューです。`;

            // Create Review
            await prisma.review.create({
                data: {
                    shoeId: shoe.id,
                    userId: user.id,
                    title: `${shoe.brand} ${shoe.modelName} レビュー`,
                    content,
                    type: 'USER',
                    overallRating: avgRating,

                    stepInToeWidth: mapRating(record[COLUMN_INDICES.STEP_TOE_WIDTH]),
                    stepInInstepHeight: mapRating(record[COLUMN_INDICES.STEP_INSTEP_HEIGHT]),
                    stepInHeelHold: mapRating(record[COLUMN_INDICES.STEP_HEEL_HOLD]),

                    runLightness: mapRating(record[COLUMN_INDICES.RUN_LIGHTNESS]),
                    runSinkDepth: mapRating(record[COLUMN_INDICES.RUN_SINK_DEPTH]),
                    runStability: mapRating(record[COLUMN_INDICES.RUN_STABILITY]),
                    runTransition: mapRating(record[COLUMN_INDICES.RUN_TRANSITION]),
                    runResponse: mapRating(record[COLUMN_INDICES.RUN_RESPONSE]),

                    fatigueSole: record[COLUMN_INDICES.FATIGUE_SOLE] || null,
                    fatigueCalf: record[COLUMN_INDICES.FATIGUE_CALF] || null,
                    fatigueKnee: record[COLUMN_INDICES.FATIGUE_KNEE] || null,
                    fatigueOther: record[COLUMN_INDICES.FATIGUE_OTHER] || null,

                    sdLanding: mapSDRating(record[COLUMN_INDICES.SD_LANDING]),
                    sdResponse: mapSDRating(record[COLUMN_INDICES.SD_RESPONSE]),
                    sdStability: mapSDRating(record[COLUMN_INDICES.SD_STABILITY]),
                    sdWidth: mapSDRating(record[COLUMN_INDICES.SD_WIDTH]),
                    sdDesign: mapSDRating(record[COLUMN_INDICES.SD_DESIGN]),

                    onomatopoeia: record[COLUMN_INDICES.ONOMATOPOEIA] || null,
                    purchaseSize,

                    reviewerGender: record[COLUMN_INDICES.GENDER] || null,
                    reviewerExpertise: parseArrayField(record[COLUMN_INDICES.SPECIALTY]),
                    reviewerHeight,
                    reviewerWeight,
                    reviewerWeeklyDistance: parseFloat(record[COLUMN_INDICES.WEEKLY_DISTANCE]) || null,
                    reviewerPersonalBest: record[COLUMN_INDICES.PB] || null,
                    reviewerFootShape: parseArrayField(record[COLUMN_INDICES.FOOT_SHAPE]),
                    reviewerFootShapeDetail: record[COLUMN_INDICES.FOOT_SHAPE_DETAIL] || null,
                    reviewerLandingType: record[COLUMN_INDICES.LANDING_TYPE] || null,
                    reviewerLandingTypeDetail: record[COLUMN_INDICES.LANDING_TYPE_NOTE] || null,
                }
            });

            existingKeys.add(duplicateKey);
            importedCount++;
            console.log(`✅ Imported review for ${shoe.brand} ${shoe.modelName} (size: ${purchaseSize})`);

        } catch (e) {
            console.error(`❌ Error processing row: ${JSON.stringify(record).slice(0, 200)}...`, e);
        }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   - Imported: ${importedCount}`);
    console.log(`   - Skipped (duplicates): ${skippedCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
