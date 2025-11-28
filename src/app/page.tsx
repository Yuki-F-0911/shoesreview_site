import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma/client'
import { Button } from '@/components/ui/Button'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateItemListSchema, generateFAQSchema } from '@/lib/seo/structured-data'
import { Star, TrendingUp, Users, Zap, Search, ArrowRight, Check } from 'lucide-react'

// 動的レンダリングを強制（ビルド時の静的生成をスキップ）
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'シューズレビューサイト | ランニングシューズの専門レビュー・評価サイト',
  description: 'ランニングシューズの専門レビューサイト。Nike、Adidas、ASICS、New Balance、Hokaなど主要ブランドのシューズをAIが厳選した情報源から統合レビュー。あなたに最適なシューズが見つかります。',
  keywords: [
    'ランニングシューズ',
    'レビュー',
    'マラソン',
    'ジョギング',
    'Nike',
    'Adidas',
    'ASICS',
    'New Balance',
    'Hoka',
    'おすすめ',
    '比較',
  ],
}

async function getLatestReviews() {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        isPublished: true,
        isDraft: false,
      },
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
        createdAt: 'desc',
      },
      take: 6,
    })

    return reviews
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return []
  }
}

async function getPopularShoes() {
  try {
    const shoes = await prisma.shoe.findMany({
      include: {
        _count: {
          select: { reviews: true },
        },
        reviews: {
          where: { isPublished: true },
          select: { overallRating: true },
          take: 100,
        },
      },
      orderBy: {
        reviews: {
          _count: 'desc',
        },
      },
      take: 8,
    })

    return shoes.map(shoe => {
      const ratings = shoe.reviews.map(r => 
        typeof r.overallRating === 'number' ? r.overallRating : parseFloat(String(r.overallRating)) || 0
      )
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
        : 0

      return {
        ...shoe,
        avgRating,
      }
    })
  } catch (error) {
    console.error('Failed to fetch popular shoes:', error)
    return []
  }
}

async function getStats() {
  try {
    const [shoeCount, reviewCount, userCount] = await Promise.all([
      prisma.shoe.count(),
      prisma.review.count({ where: { isPublished: true } }),
      prisma.user.count(),
    ])
    return { shoeCount, reviewCount, userCount }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return { shoeCount: 0, reviewCount: 0, userCount: 0 }
  }
}

// ブランドリスト
const BRANDS = [
  { name: 'Nike', logo: '/brands/nike.svg' },
  { name: 'Adidas', logo: '/brands/adidas.svg' },
  { name: 'ASICS', logo: '/brands/asics.svg' },
  { name: 'New Balance', logo: '/brands/newbalance.svg' },
  { name: 'Hoka', logo: '/brands/hoka.svg' },
  { name: 'On', logo: '/brands/on.svg' },
  { name: 'Saucony', logo: '/brands/saucony.svg' },
  { name: 'Brooks', logo: '/brands/brooks.svg' },
]

// FAQ
const HOME_FAQS = [
  {
    question: 'このサイトではどのような情報が得られますか？',
    answer: 'ランニングシューズの詳細なレビューと評価を提供しています。公式サイト、YouTubeレビュー、ユーザー投稿など複数の信頼できる情報源からレビューを収集・統合し、包括的な評価を提供します。',
  },
  {
    question: 'AI統合レビューとは何ですか？',
    answer: 'AI統合レビューは、複数の情報源（公式情報、動画レビュー、ユーザー投稿等）から収集したレビューをAIが分析・統合したものです。様々な視点からの評価を1つのレビューにまとめており、より信頼性の高い情報を提供します。',
  },
  {
    question: '初心者におすすめのランニングシューズは？',
    answer: '初心者の方には、クッション性が高く安定感のあるシューズがおすすめです。当サイトでは「初心者向け」タグが付いたレビューを参考に、あなたに最適なシューズを見つけることができます。',
  },
  {
    question: 'シューズのサイズ選びのコツは？',
    answer: 'ランニングシューズは通常、普段履きより0.5〜1.0cm大きいサイズを選ぶことをおすすめします。各レビューにはサイズ感についてのコメントも含まれていますので、参考にしてください。',
  },
]

export default async function HomePage() {
  const [reviews, popularShoes, stats] = await Promise.all([
    getLatestReviews(),
    getPopularShoes(),
    getStats(),
  ])

  // 構造化データ
  const shoeListSchema = generateItemListSchema(
    popularShoes.map((shoe, index) => ({
      name: `${shoe.brand} ${shoe.modelName}`,
      url: `/shoes/${shoe.id}`,
      position: index + 1,
    }))
  )
  
  const faqSchema = generateFAQSchema(HOME_FAQS)

  return (
    <>
      <JsonLd data={shoeListSchema} />
      <JsonLd data={faqSchema} />

      {/* ヒーローセクション */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white">
              AI統合レビューで信頼性の高い情報を
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              あなたに最適な
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                ランニングシューズ
              </span>
              を見つけよう
            </h1>
            <p className="mb-8 text-lg text-blue-100 md:text-xl">
              公式サイト、YouTube、ユーザー投稿など複数の信頼できる情報源から
              <br className="hidden md:block" />
              AIがレビューを収集・統合。あなたのシューズ選びをサポートします。
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/shoes">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  シューズを探す
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/reviews">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  レビューを見る
                </Button>
              </Link>
            </div>
          </div>

          {/* 統計 */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white md:text-4xl">
                {stats.shoeCount}+
              </div>
              <div className="mt-1 text-sm text-blue-200">シューズ</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white md:text-4xl">
                {stats.reviewCount}+
              </div>
              <div className="mt-1 text-sm text-blue-200">レビュー</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white md:text-4xl">
                {stats.userCount}+
              </div>
              <div className="mt-1 text-sm text-blue-200">ユーザー</div>
            </div>
          </div>
        </div>

        {/* 波形の装飾 */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 100V50C360 0 720 100 1080 50C1260 25 1380 12.5 1440 50V100H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              なぜこのサイトが選ばれるのか
            </h2>
            <p className="text-gray-600">
              他のレビューサイトとは一線を画す、AI統合レビューの強み
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-white shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex rounded-lg bg-blue-100 p-3">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">AI統合レビュー</h3>
                <p className="text-sm text-gray-600">
                  複数の情報源からAIがレビューを収集・分析。偏りのない包括的な評価を提供します。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-green-50 to-white shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex rounded-lg bg-green-100 p-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">価格比較リンク</h3>
                <p className="text-sm text-gray-600">
                  楽天、Amazon、公式ストアなど各ECサイトへのリンクを提供。簡単に価格比較できます。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-50 to-white shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">リアルな口コミ</h3>
                <p className="text-sm text-gray-600">
                  Reddit、Twitter、YouTubeなどSNSからの生の声も収集。リアルなユーザー体験がわかります。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-orange-50 to-white shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex rounded-lg bg-orange-100 p-3">
                  <Search className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">詳細な検索</h3>
                <p className="text-sm text-gray-600">
                  ブランド、用途、価格帯など多彩な条件で検索。あなたにぴったりのシューズが見つかります。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 人気シューズセクション */}
      {popularShoes.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">人気のシューズ</h2>
                <p className="mt-1 text-gray-600">レビュー数の多い注目シューズ</p>
              </div>
              <Link href="/shoes">
                <Button variant="outline">
                  すべて見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {popularShoes.map((shoe) => (
                <Link key={shoe.id} href={`/shoes/${shoe.id}`}>
                  <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
                    <div className="relative aspect-square bg-gray-100">
                      {shoe.imageUrls && shoe.imageUrls[0] ? (
                        <Image
                          src={shoe.imageUrls[0]}
                          alt={`${shoe.brand} ${shoe.modelName}`}
                          fill
                          className="object-contain p-4 transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-4xl text-gray-300">👟</span>
                        </div>
                      )}
                      {shoe.avgRating > 0 && (
                        <div className="absolute right-2 top-2 flex items-center rounded-full bg-white px-2 py-1 shadow-md">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 text-sm font-medium">{shoe.avgRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="outline" className="mb-2 text-xs">
                        {shoe.category}
                      </Badge>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                        {shoe.brand}
                      </h3>
                      <p className="text-sm text-gray-600">{shoe.modelName}</p>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <Users className="mr-1 h-3 w-3" />
                        {shoe._count.reviews}件のレビュー
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 新着レビューセクション */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">新着レビュー</h2>
              <p className="mt-1 text-gray-600">最新のユーザーレビュー</p>
            </div>
            <Link href="/reviews">
              <Button variant="outline">
                すべて見る
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {reviews.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">まだレビューがありません</p>
                <Link href="/reviews/new" className="mt-4 inline-block">
                  <Button>最初のレビューを投稿</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* ブランドセクション */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">取り扱いブランド</h2>
            <p className="text-gray-600">主要なランニングシューズブランドを網羅</p>
          </div>

          <div className="mt-10 grid grid-cols-4 gap-6 md:grid-cols-8">
            {BRANDS.map((brand) => (
              <Link
                key={brand.name}
                href={`/search?brand=${encodeURIComponent(brand.name)}`}
                className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <span className="text-2xl font-bold text-gray-800">{brand.name.charAt(0)}</span>
                <span className="mt-2 text-xs text-gray-600">{brand.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQセクション */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">よくある質問</h2>
              <p className="text-gray-600">シューズ選びのヒント</p>
            </div>

            <div className="mt-10 space-y-4">
              {HOME_FAQS.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="mb-2 font-semibold text-gray-900">{faq.question}</h3>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            あなたのレビューを投稿しませんか？
          </h2>
          <p className="mb-8 text-blue-100">
            他のランナーの参考になるレビューを投稿して、コミュニティに貢献しましょう。
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/reviews/new">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                レビューを投稿
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                アカウント作成
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
