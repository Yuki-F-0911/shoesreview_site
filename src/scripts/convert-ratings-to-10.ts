/**
 * CSVからインポートされたレビューの各評価項目を5点満点から10点満点に換算するスクリプト
 * 
 * 対象フィールド:
 * - stepInToeWidth, stepInInstepHeight, stepInHeelHold (ステップイン評価)
 * - runLightness, runSinkDepth, runStability, runTransition, runResponse (走行時評価)
 * - sdLanding, sdResponse, sdStability, sdWidth, sdDesign (SD法評価)
 * 
 * 実行方法:
 * npx ts-node src/scripts/convert-ratings-to-10.ts
 */

import { PrismaClient } from '@prisma/client';

// PgBouncer対応のURL設定
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

// 5点満点を10点満点に換算する関数
function convertTo10Scale(value: number | null): number | null {
    if (value === null) return null;
    return value * 2;
}

async function main() {
    console.log('🔄 レビュー評価項目の10点満点換算を開始します...\n');

    // ユーザー投稿（CSVインポート）のレビューを取得
    // type: 'USER' かつ詳細評価項目が設定されているものが対象
    const reviews = await prisma.review.findMany({
        where: {
            type: 'USER',
            OR: [
                { stepInToeWidth: { not: null } },
                { stepInInstepHeight: { not: null } },
                { stepInHeelHold: { not: null } },
                { runLightness: { not: null } },
                { runSinkDepth: { not: null } },
                { runStability: { not: null } },
                { runTransition: { not: null } },
                { runResponse: { not: null } },
                { sdLanding: { not: null } },
                { sdResponse: { not: null } },
                { sdStability: { not: null } },
                { sdWidth: { not: null } },
                { sdDesign: { not: null } },
            ]
        },
        select: {
            id: true,
            stepInToeWidth: true,
            stepInInstepHeight: true,
            stepInHeelHold: true,
            runLightness: true,
            runSinkDepth: true,
            runStability: true,
            runTransition: true,
            runResponse: true,
            sdLanding: true,
            sdResponse: true,
            sdStability: true,
            sdWidth: true,
            sdDesign: true,
        }
    });

    console.log(`📊 対象レビュー数: ${reviews.length}件\n`);

    // すでに10点満点換算済みかチェック（値が5より大きい場合は換算済みと判断）
    const alreadyConverted = reviews.filter(r =>
        (r.stepInToeWidth !== null && r.stepInToeWidth > 5) ||
        (r.sdLanding !== null && r.sdLanding > 5) ||
        (r.runLightness !== null && r.runLightness > 5)
    );

    if (alreadyConverted.length > 0) {
        console.log(`⚠️  ${alreadyConverted.length}件のレビューが既に10点満点換算済みの可能性があります。`);
        console.log('   スキップするか確認してください。\n');

        // 値が5以下のレビューのみ処理
        const needsConversion = reviews.filter(r =>
            (r.stepInToeWidth === null || r.stepInToeWidth <= 5) &&
            (r.sdLanding === null || r.sdLanding <= 5) &&
            (r.runLightness === null || r.runLightness <= 5)
        );

        if (needsConversion.length === 0) {
            console.log('✅ すべてのレビューが換算済みです。処理を終了します。');
            return;
        }

        console.log(`📝 換算が必要なレビュー: ${needsConversion.length}件\n`);
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const review of reviews) {
        // 既に換算済みの場合はスキップ
        if (
            (review.stepInToeWidth !== null && review.stepInToeWidth > 5) ||
            (review.sdLanding !== null && review.sdLanding > 5) ||
            (review.runLightness !== null && review.runLightness > 5)
        ) {
            skippedCount++;
            continue;
        }

        try {
            await prisma.review.update({
                where: { id: review.id },
                data: {
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
            console.log(`✅ レビューID: ${review.id} を更新しました`);
        } catch (error) {
            console.error(`❌ レビューID: ${review.id} の更新に失敗しました:`, error);
        }
    }

    console.log('\n📊 処理結果サマリー:');
    console.log(`   - 更新成功: ${updatedCount}件`);
    console.log(`   - スキップ（換算済み）: ${skippedCount}件`);
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
