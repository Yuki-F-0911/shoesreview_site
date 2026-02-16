import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma/client'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { ExternalReviewCard } from '@/components/reviews/ExternalReviewCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'
import { reviewsListMetadata } from '@/lib/seo/metadata'
import { Clock, TrendingUp, Users, Bot, Globe } from 'lucide-react'

// ISR: 1分ごとにバックグラウンドで再生成
export const revalidate = 60

export const metadata: Metadata = reviewsListMetadata

type SortType = 'latest' | 'popular'
type ReviewType = 'all' | 'user' | 'ai' | 'external'

async function getReviews(page: number = 1, pageSize: number = 12, sort: SortType = 'latest', reviewType: ReviewType = 'all') {
  try {
    const skip = (page - 1) * pageSize

    // ソート条件を決定
    const orderBy = sort === 'popular'
      ? { likes: { _count: 'desc' as const } }
      : { postedAt: 'desc' as const }

    // レビュータイプでフィルタ
    const typeFilter = reviewType === 'user'
      ? { type: 'USER' }
      : reviewType === 'ai'
        ? { type: 'AI_SUMMARY' }
        : {}

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: typeFilter,
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
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.review.count({
        where: typeFilter,
      }),
    ])

    return {
      reviews,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return {
      reviews: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }
}

async function getExternalReviews(page: number = 1, pageSize: number = 12) {
  try {
    const skip = (page - 1) * pageSize
    const [reviews, total] = await Promise.all([
      prisma.externalReview.findMany({
        orderBy: { collectedAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          shoe: {
            select: {
              id: true,
              brand: true,
              modelName: true,
            },
          },
        },
      }),
      prisma.externalReview.count(),
    ])
    return {
      reviews,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  } catch (error) {
    console.error('Failed to fetch external reviews:', error)
    return { reviews: [], total: 0, page, pageSize, totalPages: 0 }
  }
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: { page?: string; sort?: string; type?: string }
}) {
  const page = parseInt(searchParams.page || '1', 10)
  const sort = (searchParams.sort === 'popular' ? 'popular' : 'latest') as SortType
  const reviewType = (['all', 'user', 'ai', 'external'].includes(searchParams.type || '') ? searchParams.type : 'all') as ReviewType

  const isExternal = reviewType === 'external'
  const { reviews, total, totalPages } = isExternal
    ? { reviews: [], total: 0, totalPages: 0 }
    : await getReviews(page, 12, sort, reviewType)

  const externalData = isExternal
    ? await getExternalReviews(page, 12)
    : (reviewType === 'all' ? await getExternalReviews(1, 6) : { reviews: [], total: 0, page: 1, pageSize: 12, totalPages: 0 })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'ホーム', url: '/' },
    { name: 'レビュー一覧', url: '/reviews' },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="container mx-auto px-4 py-8">
        {/* パンくずリスト */}
        <nav className="mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li><Link href="/" className="hover:text-gray-700">ホーム</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">レビュー一覧</li>
          </ol>
        </nav>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">レビュー一覧</h1>
            <p className="mt-1 text-gray-600">全{isExternal ? externalData.total : total + externalData.total}件のレビュー</p>
          </div>
          <div className="flex items-center gap-2">
            {/* ソートボタン */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <Link
                href={`/reviews?sort=latest&type=${reviewType}`}
                className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${sort === 'latest'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Clock className="h-4 w-4" />
                <span>新着順</span>
              </Link>
              <Link
                href={`/reviews?sort=popular&type=${reviewType}`}
                className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${sort === 'popular'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>人気順</span>
              </Link>
            </div>
            <Link href="/reviews/new">
              <Button>レビューを投稿</Button>
            </Link>
          </div>
        </div>

        {/* レビュータイプフィルター */}
        <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
          <Link
            href={`/reviews?sort=${sort}&type=all`}
            className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${reviewType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            すべて
          </Link>
          <Link
            href={`/reviews?sort=${sort}&type=user`}
            className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${reviewType === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Users className="h-4 w-4" />
            個人レビュー
          </Link>
          <Link
            href={`/reviews?sort=${sort}&type=ai`}
            className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${reviewType === 'ai'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Bot className="h-4 w-4" />
            AI統合
          </Link>
          <Link
            href={`/reviews?sort=${sort}&type=external`}
            className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${reviewType === 'external'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Globe className="h-4 w-4" />
            外部レビュー
          </Link>
        </div>

        {isExternal ? (
          /* 外部レビューモード */
          externalData.reviews.length > 0 ? (
            <>
              <p className="text-sm text-slate-500 mb-4">
                世界中のブログ・SNSから収集した個人レビューです。各リンクから元の記事をお読みいただけます。
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {externalData.reviews.map((review) => (
                  <div key={review.id}>
                    <p className="text-xs text-indigo-600 font-medium mb-1">
                      {review.shoe.brand} {review.shoe.modelName}
                    </p>
                    <ExternalReviewCard
                      review={{
                        ...review,
                        publishedAt: review.publishedAt ? review.publishedAt.toISOString() : null,
                        collectedAt: review.collectedAt.toISOString(),
                        keyPoints: review.keyPoints as string[],
                      }}
                    />
                  </div>
                ))}
              </div>
              {externalData.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={page}
                    totalPages={externalData.totalPages}
                    basePath="/reviews"
                    searchParams={{ sort, type: 'external' }}
                  />
                </div>
              )}
              <p className="text-xs text-slate-400 mt-4 text-center">
                ※ 出典元の著者に帰属する内容です。AI による独自要約を含みます。
              </p>
            </>
          ) : (
            <EmptyState
              title="外部レビューがありません"
              description="外部レビューの収集を待っています"
            />
          )
        ) : (
          /* 通常レビューモード */
          <>
            {reviews.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      basePath="/reviews"
                      searchParams={{ sort, type: reviewType }}
                    />
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="レビューがありません"
                description="最初のレビューを投稿してみましょう"
                action={
                  <Link href="/reviews/new">
                    <Button>レビューを投稿</Button>
                  </Link>
                }
              />
            )}

            {/* 'all'の場合は外部レビューも表示 */}
            {reviewType === 'all' && externalData.reviews.length > 0 && (
              <section className="mt-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-500" />
                    世界のランナーの声
                  </h2>
                  <Link
                    href="/reviews?type=external"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    すべて見る →
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {externalData.reviews.map((review) => (
                    <div key={review.id}>
                      <p className="text-xs text-indigo-600 font-medium mb-1">
                        {review.shoe.brand} {review.shoe.modelName}
                      </p>
                      <ExternalReviewCard
                        review={{
                          ...review,
                          publishedAt: review.publishedAt ? review.publishedAt.toISOString() : null,
                          collectedAt: review.collectedAt.toISOString(),
                          keyPoints: review.keyPoints as string[],
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}
