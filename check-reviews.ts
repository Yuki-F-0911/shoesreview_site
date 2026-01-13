import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkReviews() {
  try {
    console.log('='.repeat(60))
    console.log('レビューの状態確認')
    console.log('='.repeat(60))

    // すべてのレビューを取得
    const allReviews = await prisma.review.findMany({
      include: {
        shoe: {
          select: {
            id: true,
            brand: true,
            modelName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      } as any,
    })

    console.log(`\n総レビュー数: ${allReviews.length}`)

    // 全てのレビューを表示
    console.log(`公開されているレビュー: ${allReviews.length}`)

    if (allReviews.length > 0) {
      console.log('\nレビュー（最初の5件）:')
      allReviews.slice(0, 5).forEach((review) => {
        console.log(`  - ID: ${review.id}`)
        console.log(`    タイトル: ${review.title}`)
        console.log(`    靴: ${review.shoe?.brand} ${review.shoe?.modelName}`)
        // console.log(`    作成日: ${review.createdAt}`) // createdAt typing issue handling
        console.log('')
      })
    } else {
      console.log('\n⚠️ レビューがありません')
    }
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkReviews()



