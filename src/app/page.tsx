import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma/client'
import { Button } from '@/components/ui/Button'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateItemListSchema } from '@/lib/seo/structured-data'
import {
  Search,
  ChevronRight,
  ArrowRight,
  MessageSquare,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Stride - ランニングシューズレビュー',
  description: 'ランニングシューズの専門レビューサイト。Nike、Adidas、ASICS、New Balance、Hokaなど主要ブランドのシューズをAIが厳選した情報源から統合レビュー。',
}

async function getTimelineReviews() {
  try {
    const reviews = await prisma.review.findMany({
      where: {},
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        shoe: {
          select: {
            id: true,
            brand: true,
            modelName: true,
            category: true,
            imageUrls: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        postedAt: 'desc',
      },
      take: 12,
    })
    return reviews
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return []
  }
}

async function getTrendingShoes() {
  try {
    const shoes = await prisma.shoe.findMany({
      include: {
        _count: {
          select: { reviews: true },
        },
        reviews: {
          select: { overallRating: true },
          take: 50,
        },
      },
      orderBy: {
        reviews: {
          _count: 'desc',
        },
      },
      take: 6,
    })

    return shoes.map(shoe => {
      const ratings = shoe.reviews.map(r =>
        typeof r.overallRating === 'number' ? r.overallRating : parseFloat(String(r.overallRating)) || 0
      )
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0
      return { ...shoe, avgRating }
    })
  } catch (error) {
    return []
  }
}

async function getStats() {
  try {
    const [shoeCount, reviewCount, userCount] = await Promise.all([
      prisma.shoe.count(),
      prisma.review.count(),
      prisma.user.count(),
    ])
    return { shoeCount, reviewCount, userCount }
  } catch (error) {
    return { shoeCount: 0, reviewCount: 0, userCount: 0 }
  }
}

// タグはキーワード検索として機能（シューズ名やキーワードで検索）
const CATEGORIES = [
  { name: 'マラソン', query: 'marathon' },      // マラソン・レース向けシューズ
  { name: 'トレーニング', query: 'training' },  // トレーニングシューズ
  { name: 'トレイル', query: 'trail' },         // トレイルランニング
  { name: 'レーシング', query: 'racing' },      // レーシングフラット
  { name: 'デイリー', query: 'daily' },         // デイリートレーナー
]

const BRANDS = ['Nike', 'Adidas', 'ASICS', 'New Balance', 'Hoka', 'On', 'Saucony', 'Brooks', 'Mizuno']

export default async function HomePage() {
  const [reviews, trendingShoes, stats] = await Promise.all([
    getTimelineReviews(),
    getTrendingShoes(),
    getStats(),
  ])

  const shoeListSchema = generateItemListSchema(
    trendingShoes.map((shoe, index) => ({
      name: `${shoe.brand} ${shoe.modelName}`,
      url: `/shoes/${shoe.id}`,
      position: index + 1,
    }))
  )

  return (
    <>
      <JsonLd data={shoeListSchema} />

      <div className="min-h-screen bg-white">
        {/* ===== ヒーローセクション ===== */}
        <section className="border-b border-neutral-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="max-w-lg mx-auto">
              {/* 検索バー */}
              <Link href="/search" className="block">
                <div className="flex items-center border border-neutral-200 hover:border-neutral-400 bg-white px-4 py-3 transition-colors group">
                  <Search className="h-4 w-4 text-neutral-400" />
                  <span className="ml-3 text-neutral-500 text-sm">シューズ名、ブランドで検索</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <p className="text-neutral-400 text-xs text-center mt-3">
                {stats.reviewCount}件のレビュー掲載中
              </p>
            </div>
          </div>
        </section>

        {/* ===== カテゴリー ===== */}
        <section className="border-b border-neutral-100 py-4 overflow-x-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center space-x-2 min-w-max">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/search?q=${cat.query}`}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent hover:border-neutral-200 transition-all"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/shoes"
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-400 transition-all"
              >
                すべて
              </Link>
            </div>
          </div>
        </section>

        {/* ===== メインコンテンツ ===== */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* 左サイドバー */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-20 space-y-6">
                {/* 統計 */}
                <div className="border-b border-neutral-100 pb-6">
                  <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">統計</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">シューズ</span>
                      <span className="text-neutral-900 font-medium">{stats.shoeCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">レビュー</span>
                      <span className="text-neutral-900 font-medium">{stats.reviewCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">ユーザー</span>
                      <span className="text-neutral-900 font-medium">{stats.userCount}</span>
                    </div>
                  </div>
                </div>

                {/* ブランド */}
                <div>
                  <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">ブランド</h3>
                  <div className="flex flex-wrap gap-2">
                    {BRANDS.slice(0, 6).map((brand) => (
                      <Link
                        key={brand}
                        href={`/search?brand=${encodeURIComponent(brand)}`}
                        className="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-400 transition-all"
                      >
                        {brand}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* メインフィード */}
            <main className="lg:col-span-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">レビュー</h2>
                <Link href="/reviews" className="text-neutral-500 text-sm hover:text-neutral-900 flex items-center">
                  すべて
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-neutral-500 mb-4">まだレビューがありません</p>
                    <Link href="/reviews/new">
                      <Button>最初のレビューを投稿</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {reviews.length > 0 && (
                <div className="mt-8 text-center">
                  <Link href="/reviews">
                    <Button variant="outline">
                      もっと見る
                    </Button>
                  </Link>
                </div>
              )}
            </main>

            {/* 右サイドバー */}
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-20 space-y-6">
                {/* 注目のシューズ */}
                <div>
                  <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">注目</h3>
                  <div className="space-y-4">
                    {trendingShoes.map((shoe, index) => (
                      <Link
                        key={shoe.id}
                        href={`/shoes/${shoe.id}`}
                        className="flex items-center group"
                      >
                        <span className="text-xs text-neutral-400 w-4">{index + 1}</span>
                        <div className="relative h-10 w-10 flex-shrink-0 bg-neutral-50 ml-2">
                          {shoe.imageUrls && shoe.imageUrls[0] && (
                            <Image
                              src={shoe.imageUrls[0]}
                              alt={shoe.modelName}
                              fill
                              className="object-contain p-1"
                              sizes="40px"
                            />
                          )}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <p className="text-xs text-neutral-400">{shoe.brand}</p>
                          <p className="text-sm text-neutral-900 truncate group-hover:underline">
                            {shoe.modelName}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/shoes" className="text-sm text-neutral-500 hover:text-neutral-900 mt-4 inline-block">
                    すべて見る
                  </Link>
                </div>

                {/* モバイル用ブランド */}
                <div className="lg:hidden border-t border-neutral-100 pt-6">
                  <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">ブランド</h3>
                  <div className="flex flex-wrap gap-2">
                    {BRANDS.map((brand) => (
                      <Link
                        key={brand}
                        href={`/search?brand=${encodeURIComponent(brand)}`}
                        className="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-400 transition-all"
                      >
                        {brand}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="border border-neutral-200 p-4">
                  <h3 className="text-sm font-medium text-neutral-900 mb-2">レビューを投稿</h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    あなたの経験をシェアしてランナーの参考に
                  </p>
                  <Link href="/reviews/new">
                    <Button className="w-full">投稿する</Button>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
