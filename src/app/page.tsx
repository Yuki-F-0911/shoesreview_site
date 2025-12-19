import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma/client'
import { Button } from '@/components/ui/Button'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateItemListSchema } from '@/lib/seo/structured-data'
import {
  Search,
  TrendingUp,
  Star,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Filter,
  Zap,
  Users,
  MessageSquare
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'シューズレビューサイト | ランニングシューズの専門レビュー・評価サイト',
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

const CATEGORIES = [
  { name: 'マラソン', icon: '🏃', query: 'MARATHON' },
  { name: 'トレーニング', icon: '💪', query: 'TRAINING' },
  { name: 'トレイル', icon: '⛰️', query: 'TRAIL' },
  { name: 'レーシング', icon: '🏆', query: 'RACING' },
  { name: 'デイリー', icon: '☀️', query: 'DAILY' },
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

      <div className="min-h-screen bg-slate-50">
        {/* ヒーローセクション - シンプルで独自性のあるデザイン */}
        <section className="bg-white border-b border-slate-100">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-primary/10 text-primary border-0">
                <Sparkles className="mr-1 h-3 w-3" />
                {stats.reviewCount}件のレビューから最適なシューズを
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                ランナーのための<br className="sm:hidden" />
                <span className="text-primary">シューズガイド</span>
              </h1>
              <p className="text-slate-600 text-lg mb-8 max-w-2xl mx-auto">
                AI統合レビューとコミュニティの声から、あなたに最適なランニングシューズを見つけよう
              </p>

              {/* 検索バー */}
              <div className="max-w-xl mx-auto">
                <Link href="/search" className="block">
                  <div className="flex items-center bg-slate-100 rounded-2xl px-5 py-4 hover:bg-slate-200 transition-colors group">
                    <Search className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="ml-3 text-slate-500">シューズ名、ブランドで検索...</span>
                    <ArrowRight className="ml-auto h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* クイックナビ - カテゴリー */}
        <section className="bg-white border-b border-slate-100 py-6 overflow-x-auto">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-3 min-w-max">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/shoes?category=${cat.query}`}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-slate-100 hover:bg-primary hover:text-white rounded-full transition-colors group"
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-medium text-sm text-slate-700 group-hover:text-white">{cat.name}</span>
                </Link>
              ))}
              <Link
                href="/shoes"
                className="flex items-center space-x-2 px-5 py-2.5 border border-slate-200 hover:border-primary hover:text-primary rounded-full transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span className="font-medium text-sm">すべて</span>
              </Link>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* メインコンテンツ - レビューフィード */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">レビューフィード</h2>
                <Link href="/reviews" className="text-primary text-sm font-medium hover:underline flex items-center">
                  すべて見る <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {reviews.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 mb-4">まだレビューがありません</p>
                    <Link href="/reviews/new">
                      <Button>最初のレビューを投稿</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* 続きを読み込むボタン */}
              {reviews.length > 0 && (
                <div className="mt-8 text-center">
                  <Link href="/reviews">
                    <Button variant="outline" size="lg" className="px-8">
                      もっとレビューを見る
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* トレンドシューズ */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    注目のシューズ
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {trendingShoes.map((shoe, index) => (
                    <Link
                      key={shoe.id}
                      href={`/shoes/${shoe.id}`}
                      className="flex items-center p-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-bold text-slate-500 mr-3">
                        {index + 1}
                      </div>
                      <div className="relative h-14 w-14 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden mr-3">
                        {shoe.imageUrls && shoe.imageUrls[0] && (
                          <Image
                            src={shoe.imageUrls[0]}
                            alt={shoe.modelName}
                            fill
                            className="object-contain p-1"
                            sizes="56px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 uppercase">{shoe.brand}</p>
                        <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-primary transition-colors">
                          {shoe.modelName}
                        </p>
                        <div className="flex items-center mt-0.5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium text-slate-700 ml-1">{shoe.avgRating.toFixed(1)}</span>
                          <span className="text-xs text-slate-400 ml-2">{shoe._count.reviews}件</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/shoes"
                  className="flex items-center justify-center p-3 text-primary text-sm font-medium hover:bg-slate-50 border-t border-slate-100"
                >
                  すべてのシューズを見る
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Card>

              {/* ブランドで探す */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-900">ブランドで探す</h3>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {BRANDS.map((brand) => (
                    <Link
                      key={brand}
                      href={`/search?brand=${encodeURIComponent(brand)}`}
                      className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-primary hover:text-white transition-colors"
                    >
                      {brand}
                    </Link>
                  ))}
                </div>
              </Card>

              {/* サイト統計 */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-900 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-amber-500" />
                    サイト統計
                  </h3>
                </div>
                <div className="grid grid-cols-3 divide-x divide-slate-100">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{stats.shoeCount}</p>
                    <p className="text-xs text-slate-500">シューズ</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{stats.reviewCount}</p>
                    <p className="text-xs text-slate-500">レビュー</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{stats.userCount}</p>
                    <p className="text-xs text-slate-500">ユーザー</p>
                  </div>
                </div>
              </Card>

              {/* CTAカード */}
              <Card className="overflow-hidden bg-gradient-to-br from-primary to-primary-dark text-white">
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-lg mb-2">レビューを投稿しよう</h3>
                  <p className="text-primary-100 text-sm mb-4">
                    あなたの経験をシェアして、他のランナーの参考に
                  </p>
                  <Link href="/reviews/new">
                    <Button className="bg-white text-primary hover:bg-slate-100 w-full">
                      レビューを投稿
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
