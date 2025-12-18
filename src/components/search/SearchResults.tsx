import { prisma } from '@/lib/prisma/client'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { EmptyState } from '@/components/common/EmptyState'
import type { SearchParams } from '@/types/api'

async function searchReviews(params: SearchParams) {
  const where: any = {
    // isPublished/isDraft removed
  }

  if (params.query) {
    where.OR = [
      { title: { contains: params.query, mode: 'insensitive' } },
      { content: { contains: params.query, mode: 'insensitive' } },
      { shoe: { brand: { contains: params.query, mode: 'insensitive' } } },
      { shoe: { modelName: { contains: params.query, mode: 'insensitive' } } },
    ]
  }

  if (params.brand) {
    where.shoe = { ...where.shoe, brand: { contains: params.brand, mode: 'insensitive' } }
  }

  if (params.category) {
    where.shoe = { ...where.shoe, category: params.category }
  }

  if (params.minRating) {
    where.overallRating = { gte: params.minRating }
  }

  const reviews = await prisma.review.findMany({
    where,
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
    take: 20,
  })

  return reviews
}

export async function SearchResults({ searchParams }: { searchParams: SearchParams }) {
  const reviews = await searchReviews(searchParams)

  if (reviews.length === 0) {
    return (
      <EmptyState
        title="検索結果が見つかりませんでした"
        description="別のキーワードで検索してみてください"
      />
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">{reviews.length}件のレビューが見つかりました</p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}

