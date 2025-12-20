/**
 * Guest Runnerのレビューを5点満点から10点満点に換算するスクリプト
 * 
 * 対象: ユーザー名がguest_で始まるユーザーのレビュー
 * 換算対象:
 * - overallRating
 * - stepInToeWidth, stepInInstepHeight, stepInHeelHold
 * - runLightness, runSinkDepth, runStability, runTransition, runResponse
 * - sdLanding, sdResponse, sdStability, sdWidth, sdDesign
 */

import { PrismaClient, Prisma } from '@prisma/client';

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

function convertTo10Scale(value: number | null): number | null {
    if (value === null) return null;
    return value * 2;
}

async function main() {
    console.log('🔄 Guest Runnerのレビュー点数を10点満点に換算します...\n');

    // guest_で始まるユーザーのレビューを取得
    const guestReviews = await prisma.review.findMany({
        where: {
            user: {
                username: {
                    startsWith: 'guest_'
                }
            }
        },
        include: {
            user: {
                select: {
                    username: true,
                    displayName: true
                }
            }
        }
    });

    console.log(`📊 Guest Runnerのレビュー数: ${guestReviews.length}件\n`);

    if (guestReviews.length === 0) {
        console.log('⚠️ Guest Runnerのレビューが見つかりませんでした。');
        return;
    }

    // 換算前の状態を表示
    console.log('換算前のサンプル:');
    const sample = guestReviews[0];
    console.log(`  - overallRating: ${sample.overallRating}`);
    console.log(`  - sdLanding: ${sample.sdLanding}`);
    console.log(`  - runLightness: ${sample.runLightness}\n`);

    // すでに10点満点換算済みかチェック（overallRatingが5より大きい場合は換算済み）
    const needsConversion = guestReviews.filter(r => {
        const rating = parseFloat(String(r.overallRating));
        return rating <= 5;
    });

    const alreadyConverted = guestReviews.length - needsConversion.length;

    if (alreadyConverted > 0) {
        console.log(`ℹ️  ${alreadyConverted}件のレビューは既に10点満点換算済みです。`);
    }

    if (needsConversion.length === 0) {
        console.log('✅ すべてのレビューが換算済みです。処理を終了します。');
        return;
    }

    console.log(`📝 換算が必要なレビュー: ${needsConversion.length}件\n`);
    console.log('変換を開始します...\n');

    let updatedCount = 0;

    for (const review of needsConversion) {
        try {
            const currentRating = parseFloat(String(review.overallRating));
            const newRating = currentRating * 2;

            await prisma.review.update({
                where: { id: review.id },
                data: {
                    overallRating: new Prisma.Decimal(newRating),
                    stepInToeWidth: convertTo10Scale(review.stepInToeWidth),
                    stepInInstepHeight: convertTo10Scale(review.stepInInstepHeight),
                    stepInHeelHold: convertTo10Scale(review.stepInHeelHold),
                    runLightness: convertTo10Scale(review.runLightness),
                    runSinkDepth: convertTo10Scale(review.runSinkDepth),
                    runStability: convertTo10Scale(review.runStability),
                    runTransition: convertTo10Scale(review.runTransition),
                    runResponse: convertTo10Scale(review.runResponse),
                    sdLanding: convertTo10Scale(review.sdLanding),
                    sdResponse: convertTo10Scale(review.sdResponse),
                    sdStability: convertTo10Scale(review.sdStability),
                    sdWidth: convertTo10Scale(review.sdWidth),
                    sdDesign: convertTo10Scale(review.sdDesign),
                }
            });
            updatedCount++;
            console.log(`✅ ${review.user?.displayName || 'Guest'}: rating ${currentRating} → ${newRating}`);
        } catch (error) {
            console.error(`❌ レビューID: ${review.id} の更新に失敗しました:`, error);
        }
    }

    console.log('\n📊 処理結果サマリー:');
    console.log(`   - 更新成功: ${updatedCount}件`);
    console.log(`   - スキップ（換算済み）: ${alreadyConverted}件`);
    console.log('\n✨ 10点満点換算が完了しました！');
}

main()
    .catch((e) => {
        console.error('❌ エラーが発生しました:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
