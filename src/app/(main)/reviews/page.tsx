import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma/client'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'
import { reviewsListMetadata } from '@/lib/seo/metadata'
import { Clock, TrendingUp, Users, Bot } from 'lucide-react'

// ISR: 1分ごとにバックグラウンドで再生成
export const revalidate = 60

export const metadata: Metadata = reviewsListMetadata

type SortType = 'latest' | 'popular'
type ReviewType = 'all' | 'user' | 'ai'

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

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: { page?: string; sort?: string; type?: string }
}) {
  const page = parseInt(searchParams.page || '1', 10)
  const sort = (searchParams.sort === 'popular' ? 'popular' : 'latest') as SortType
  const reviewType = (['all', 'user', 'ai'].includes(searchParams.type || '') ? searchParams.type : 'all') as ReviewType
  const { reviews, total, totalPages } = await getReviews(page, 12, sort, reviewType)

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
            <p className="mt-1 text-gray-600">全{total}件のレビュー</p>
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
        </div>

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
      </div>
    </>
  )
}
