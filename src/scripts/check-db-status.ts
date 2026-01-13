import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const reviewCount = await prisma.review.count()
    const userCount = await prisma.user.count()

    console.log('📊 データベース統計:')
    console.log(`   - レビュー数: ${reviewCount}`)
    console.log(`   - ユーザー数: ${userCount}`)

    // 最新5件のレビューを表示
    const recentReviews = await prisma.review.findMany({
        orderBy: { postedAt: 'desc' },
        take: 5,
        select: {
            title: true,
            postedAt: true,
            shoe: { select: { brand: true, modelName: true } }
        }
    })

    console.log('\n📝 最新5件のレビュー:')
    recentReviews.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title}`)
        console.log(`      シューズ: ${r.shoe.brand} ${r.shoe.modelName}`)
        console.log(`      投稿日時: ${r.postedAt?.toLocaleString('ja-JP')}`)
    })

    // デモユーザーの確認
    const demoUser = await prisma.user.findUnique({
        where: { email: 'demo@example.com' }
    })

    if (demoUser) {
        console.log('\n⚠️ デモユーザーがまだ存在しています')
    } else {
        console.log('\n✅ デモユーザーは削除されています')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
