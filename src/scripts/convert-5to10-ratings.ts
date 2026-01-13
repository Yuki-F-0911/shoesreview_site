/**
 * 5点満点の評価項目を10点満点に変換するスクリプト
 * 対象：stepIn系、run系、sd系の項目（以前は5点満点だったもの）
 */

import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL
if (!url) {
    throw new Error('DATABASE_URL is not set')
}
const newUrl = url.includes('pgbouncer=true')
    ? url
    : (url.includes('?') ? `${url}&pgbouncer=true` : `${url}?pgbouncer=true`)

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: newUrl,
        },
    },
})

async function main() {
    console.log('🔄 5点満点→10点満点への変換を開始...')

    // 全レビューを取得
    const reviews = await prisma.review.findMany({
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
        },
    })

    console.log(`📊 ${reviews.length}件のレビューを処理します`)

    let updatedCount = 0
    let skippedCount = 0

    for (const review of reviews) {
        // 5点満点のフィールドを判定（値が1-5の範囲内なら変換対象）
        const updates: Record<string, number | null> = {}

        const fieldsToConvert = [
            { key: 'stepInToeWidth', value: review.stepInToeWidth },
            { key: 'stepInInstepHeight', value: review.stepInInstepHeight },
            { key: 'stepInHeelHold', value: review.stepInHeelHold },
            { key: 'runLightness', value: review.runLightness },
            { key: 'runSinkDepth', value: review.runSinkDepth },
            { key: 'runStability', value: review.runStability },
            { key: 'runTransition', value: review.runTransition },
            { key: 'runResponse', value: review.runResponse },
            { key: 'sdLanding', value: review.sdLanding },
            { key: 'sdResponse', value: review.sdResponse },
            { key: 'sdStability', value: review.sdStability },
            { key: 'sdWidth', value: review.sdWidth },
            { key: 'sdDesign', value: review.sdDesign },
        ]

        let needsUpdate = false

        for (const field of fieldsToConvert) {
            if (field.value !== null && field.value !== undefined) {
                // 5以下の値は5点満点とみなして×2
                if (field.value <= 5) {
                    updates[field.key] = field.value * 2
                    needsUpdate = true
                }
                // 6以上の値は既に10点満点とみなしてそのまま
            }
        }

        if (needsUpdate) {
            await prisma.review.update({
                where: { id: review.id },
                data: updates,
            })
            updatedCount++
            console.log(`✅ Review ${review.id} を変換しました`)
        } else {
            skippedCount++
        }
    }

    console.log('\n📊 変換完了:')
    console.log(`   - 変換済み: ${updatedCount}件`)
    console.log(`   - スキップ: ${skippedCount}件`)
}

main()
    .catch((e) => {
        console.error('❌ エラー:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
