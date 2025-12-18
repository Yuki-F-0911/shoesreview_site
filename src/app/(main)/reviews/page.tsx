import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma/client'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'
import { reviewsListMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = reviewsListMetadata

async function getReviews(page: number = 1, pageSize: number = 12) {
  try {
    const skip = (page - 1) * pageSize

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
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
          createdAt: 'desc',
        } as any,
        skip,
        take: pageSize,
      }),
      prisma.review.count({
        where: {},
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
    // エラーが発生した場合は空の結果を返す
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
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', 10)
  const { reviews, total, totalPages } = await getReviews(page)

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

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">レビュー一覧</h1>
            <p className="mt-1 text-gray-600">全{total}件のレビュー</p>
          </div>
          <Link href="/reviews/new">
            <Button>レビューを投稿</Button>
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
              <div className="mt-8 flex justify-center space-x-2">
                {page > 1 && (
                  <Link href={`/reviews?page=${page - 1}`}>
                    <Button variant="outline">前へ</Button>
                  </Link>
                )}
                <span className="flex items-center px-4 text-sm text-gray-700">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link href={`/reviews?page=${page + 1}`}>
                    <Button variant="outline">次へ</Button>
                  </Link>
                )}
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

