/**
 * デモユーザー削除スクリプト
 * demo@example.comユーザーとその関連データを削除
 */

import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL
if (!url) {
    throw new Error('DATABASE_URL is not set')
}
const newUrl = url.includes('pgbouncer=true')
    ? url
    : url.includes('?')
        ? `${url}&pgbouncer=true`
        : `${url}?pgbouncer=true`

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: newUrl,
        },
    },
})

async function main() {
    console.log('🗑️ デモユーザーの削除を開始...')

    // デモユーザーを検索
    const demoUser = await prisma.user.findUnique({
        where: { email: 'demo@example.com' },
        include: {
            reviews: true,
            comments: true,
            likes: true,
        },
    })

    if (!demoUser) {
        console.log('✅ デモユーザーは見つかりませんでした（既に削除済みか、存在しません）')
        return
    }

    console.log(`📋 デモユーザー情報:`)
    console.log(`   - ID: ${demoUser.id}`)
    console.log(`   - ユーザー名: ${demoUser.username}`)
    console.log(`   - 表示名: ${demoUser.displayName}`)
    console.log(`   - レビュー数: ${demoUser.reviews.length}`)
    console.log(`   - コメント数: ${demoUser.comments.length}`)
    console.log(`   - いいね数: ${demoUser.likes.length}`)

    // ユーザーを削除（関連データはカスケード削除または SetNull）
    await prisma.user.delete({
        where: { email: 'demo@example.com' },
    })

    console.log('✅ デモユーザーを削除しました')

    // demouserのパターンで作成されたユーザーがないか確認
    const otherDemoUsers = await prisma.user.findMany({
        where: {
            OR: [
                { username: { contains: 'demo', mode: 'insensitive' } },
                { email: { contains: 'demo@', mode: 'insensitive' } },
            ],
        },
    })

    if (otherDemoUsers.length > 0) {
        console.log(`\n⚠️ 他にもデモ関連ユーザーが見つかりました:`)
        for (const user of otherDemoUsers) {
            console.log(`   - ${user.username} (${user.email})`)
        }
        console.log('   これらは手動で確認してください。')
    }
}

main()
    .catch((e) => {
        console.error('❌ エラーが発生しました:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
