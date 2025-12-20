/**
 * Guest Runnerのレビューの詳細項目を5点満点に修正するスクリプト
 * 
 * - 詳細項目（stepIn*, run*, sd*）: 現在の値を4で割って5点満点に戻す
 * - overallRating: 10点満点を維持
 */

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

// 4倍されてしまった値を元に戻す（20→5, 16→4, etc.）
function revertTo5Scale(value: number | null): number | null {
    if (value === null) return null;
    // 値が5より大きい場合は4で割って戻す
    if (value > 5) {
        return Math.round(value / 4);
    }
    return value;
}

async function main() {
    console.log('🔄 Guest Runnerのレビュー詳細項目を5点満点に修正します...\n');

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

    // 修正前の状態を表示
    console.log('修正前のサンプル:');
    const sample = guestReviews[0];
    console.log(`  - overallRating: ${sample.overallRating} (10点満点を維持)`);
    console.log(`  - sdLanding: ${sample.sdLanding} → ${revertTo5Scale(sample.sdLanding)}`);
    console.log(`  - runLightness: ${sample.runLightness} → ${revertTo5Scale(sample.runLightness)}`);
    console.log(`  - stepInToeWidth: ${sample.stepInToeWidth} → ${revertTo5Scale(sample.stepInToeWidth)}\n`);

    // 詳細項目が5より大きいレビューのみ修正
    const needsFix = guestReviews.filter(r =>
        (r.sdLanding !== null && r.sdLanding > 5) ||
        (r.runLightness !== null && r.runLightness > 5) ||
        (r.stepInToeWidth !== null && r.stepInToeWidth > 5)
    );

    if (needsFix.length === 0) {
        console.log('✅ すべてのレビューの詳細項目は既に5点満点です。');
        return;
    }

    console.log(`📝 修正が必要なレビュー: ${needsFix.length}件\n`);

    let updatedCount = 0;

    for (const review of needsFix) {
        try {
            await prisma.review.update({
                where: { id: review.id },
                data: {
                    // overallRatingはそのまま（10点満点を維持）
                    // 詳細項目のみ5点満点に戻す
                    stepInToeWidth: revertTo5Scale(review.stepInToeWidth),
                    stepInInstepHeight: revertTo5Scale(review.stepInInstepHeight),
                    stepInHeelHold: revertTo5Scale(review.stepInHeelHold),
                    runLightness: revertTo5Scale(review.runLightness),
                    runSinkDepth: revertTo5Scale(review.runSinkDepth),
                    runStability: revertTo5Scale(review.runStability),
                    runTransition: revertTo5Scale(review.runTransition),
                    runResponse: revertTo5Scale(review.runResponse),
                    sdLanding: revertTo5Scale(review.sdLanding),
                    sdResponse: revertTo5Scale(review.sdResponse),
                    sdStability: revertTo5Scale(review.sdStability),
                    sdWidth: revertTo5Scale(review.sdWidth),
                    sdDesign: revertTo5Scale(review.sdDesign),
                }
            });
            updatedCount++;
            console.log(`✅ ${review.user?.displayName || 'Guest'}: 詳細項目を5点満点に修正`);
        } catch (error) {
            console.error(`❌ レビューID: ${review.id} の更新に失敗しました:`, error);
        }
    }

    console.log('\n📊 処理結果サマリー:');
    console.log(`   - 修正完了: ${updatedCount}件`);
    console.log(`   - overallRating: 10点満点を維持`);
    console.log(`   - 詳細評価項目: 5点満点に修正`);
    console.log('\n✨ 修正が完了しました！');
}

main()
    .catch((e) => {
        console.error('❌ エラーが発生しました:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
