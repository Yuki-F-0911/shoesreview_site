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
  TrendingUp,
  Star,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Filter,
  Zap,
  MessageSquare,
  Flame,
  Target
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

      <div className="min-h-screen bg-cyber-black">
        {/* ヒーローセクション - サイバーパンク風 */}
        <section className="relative overflow-hidden border-b border-primary/20">
          {/* 背景グラデーション＆パターン */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyber-black via-cyber-dark to-cyber-black" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 240, 255, 0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

          {/* グローエフェクト */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 bg-primary/20 text-primary border border-primary/30 shadow-glow-sm">
                <Zap className="mr-1 h-3 w-3" />
                {stats.reviewCount}件のレビューから最適なシューズを
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                <span className="block">ランナーのための</span>
                <span className="cyber-gradient-text text-glow">シューズガイド</span>
              </h1>

              <p className="text-text-secondary text-lg mb-10 max-w-2xl mx-auto">
                AI統合レビューとコミュニティの声から、<br className="hidden sm:block" />
                あなたに最適なランニングシューズを見つけよう
              </p>

              {/* 検索バー - サイバー風 */}
              <div className="max-w-xl mx-auto">
                <Link href="/search" className="block">
                  <div className="flex items-center glass border border-primary/30 rounded-2xl px-6 py-4 hover:border-primary hover:shadow-glow-primary transition-all group">
                    <Search className="h-5 w-5 text-primary" />
                    <span className="ml-4 text-text-muted">シューズ名、ブランドで検索...</span>
                    <ArrowRight className="ml-auto h-5 w-5 text-primary group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* クイックナビ - カテゴリー */}
        <section className="glass-dark border-b border-primary/20 py-6 overflow-x-auto">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-3 min-w-max">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/shoes?category=${cat.query}`}
                  className="flex items-center space-x-2 px-5 py-2.5 glass border border-primary/20 hover:border-primary hover:shadow-glow-sm rounded-full transition-all group"
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-medium text-sm text-text-secondary group-hover:text-primary">{cat.name}</span>
                </Link>
              ))}
              <Link
                href="/shoes"
                className="flex items-center space-x-2 px-5 py-2.5 border border-accent/30 hover:border-accent hover:shadow-glow-accent rounded-full transition-all group"
              >
                <Filter className="h-4 w-4 text-accent" />
                <span className="font-medium text-sm text-text-secondary group-hover:text-accent">すべて</span>
              </Link>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* メインコンテンツ - レビューフィード */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Flame className="mr-2 h-6 w-6 text-neon-red" />
                  レビューフィード
                </h2>
                <Link href="/reviews" className="text-primary text-sm font-medium hover:text-primary-light flex items-center group">
                  すべて見る
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {reviews.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <Card className="glass border border-primary/20">
                  <CardContent className="py-16 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-primary/30 mb-4" />
                    <p className="text-text-muted mb-4">まだレビューがありません</p>
                    <Link href="/reviews/new">
                      <Button className="bg-gradient-to-r from-primary to-accent text-cyber-black font-bold hover:shadow-glow-primary">
                        最初のレビューを投稿
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* 続きを読み込むボタン */}
              {reviews.length > 0 && (
                <div className="mt-10 text-center">
                  <Link href="/reviews">
                    <Button variant="outline" size="lg" className="px-8 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary hover:shadow-glow-sm">
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
              <Card className="overflow-hidden glass border border-primary/20">
                <div className="p-4 border-b border-primary/20 bg-primary/5">
                  <h3 className="font-bold text-white flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    注目のシューズ
                  </h3>
                </div>
                <div className="divide-y divide-primary/10">
                  {trendingShoes.map((shoe, index) => (
                    <Link
                      key={shoe.id}
                      href={`/shoes/${shoe.id}`}
                      className="flex items-center p-4 hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-sm font-bold text-primary mr-3 border border-primary/30">
                        {index + 1}
                      </div>
                      <div className="relative h-14 w-14 flex-shrink-0 bg-cyber-gray rounded-xl overflow-hidden mr-3 border border-primary/10">
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
                        <p className="text-xs text-primary uppercase">{shoe.brand}</p>
                        <p className="font-semibold text-white text-sm truncate group-hover:text-primary transition-colors">
                          {shoe.modelName}
                        </p>
                        <div className="flex items-center mt-0.5">
                          <Star className="h-3.5 w-3.5 fill-neon-yellow text-neon-yellow" />
                          <span className="text-sm font-medium text-white ml-1">{shoe.avgRating.toFixed(1)}</span>
                          <span className="text-xs text-text-muted ml-2">{shoe._count.reviews}件</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/shoes"
                  className="flex items-center justify-center p-3 text-primary text-sm font-medium hover:bg-primary/5 border-t border-primary/20 transition-all"
                >
                  すべてのシューズを見る
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Card>

              {/* ブランドで探す */}
              <Card className="overflow-hidden glass border border-primary/20">
                <div className="p-4 border-b border-primary/20 bg-primary/5">
                  <h3 className="font-bold text-white flex items-center">
                    <Target className="h-5 w-5 mr-2 text-accent" />
                    ブランドで探す
                  </h3>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {BRANDS.map((brand) => (
                    <Link
                      key={brand}
                      href={`/search?brand=${encodeURIComponent(brand)}`}
                      className="px-3 py-1.5 glass border border-primary/20 rounded-lg text-sm text-text-secondary hover:text-primary hover:border-primary hover:shadow-glow-sm transition-all"
                    >
                      {brand}
                    </Link>
                  ))}
                </div>
              </Card>

              {/* サイト統計 */}
              <Card className="overflow-hidden glass border border-primary/20">
                <div className="p-4 border-b border-primary/20 bg-primary/5">
                  <h3 className="font-bold text-white flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-neon-yellow" />
                    サイト統計
                  </h3>
                </div>
                <div className="grid grid-cols-3 divide-x divide-primary/20">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{stats.shoeCount}</p>
                    <p className="text-xs text-text-muted">シューズ</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-accent">{stats.reviewCount}</p>
                    <p className="text-xs text-text-muted">レビュー</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-neon-green">{stats.userCount}</p>
                    <p className="text-xs text-text-muted">ユーザー</p>
                  </div>
                </div>
              </Card>

              {/* CTAカード */}
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-accent to-primary text-white shadow-glow-primary">
                <CardContent className="p-6 text-center relative">
                  <div className="absolute inset-0 bg-cyber-black/30" />
                  <div className="relative">
                    <Zap className="mx-auto h-10 w-10 mb-3 animate-pulse" />
                    <h3 className="font-bold text-xl mb-2">レビューを投稿しよう</h3>
                    <p className="text-white/80 text-sm mb-4">
                      あなたの経験をシェアして、<br />他のランナーの参考に
                    </p>
                    <Link href="/reviews/new">
                      <Button className="bg-cyber-black text-primary hover:bg-cyber-dark w-full font-bold border border-primary/50 hover:shadow-glow-sm">
                        レビューを投稿
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
