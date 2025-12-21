import Link from 'next/link'
import Image from 'next/image'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils/date'
import { ThumbsUp, MessageCircle } from 'lucide-react'
import type { Prisma } from '@prisma/client'

type ReviewWithRelations = Prisma.ReviewGetPayload<{
  include: {
    user: {
      select: {
        id: true
        username: true
        displayName: true
        avatarUrl: true
      }
    }
    shoe: {
      select: {
        id: true
        brand: true
        modelName: true
        category: true
        imageUrls: true
      }
    }
    _count: {
      select: {
        likes: true
        comments: true
      }
    }
  }
}>

interface ReviewCardProps {
  review: ReviewWithRelations
}

export function ReviewCard({ review }: ReviewCardProps) {
  const shoe = review.shoe
  const user = review.user
  const isAISummary = review.type === 'AI_SUMMARY'
  const shoeImageUrl = shoe?.imageUrls && shoe.imageUrls.length > 0 ? shoe.imageUrls[0] : null
  const rating = parseFloat(String(review.overallRating))

  const contentText = review.content || (review as any).quickComment || ''
  const contentPreview = contentText.length > 150
    ? contentText.slice(0, 150) + '...'
    : contentText

  return (
    <Link href={`/reviews/${review.id}`} className="block group">
      <Card className="overflow-hidden card-hover">
        {/* ヘッダー */}
        <div className="flex items-center p-4 pb-3">
          {user ? (
            <>
              <Avatar
                src={user.avatarUrl}
                fallback={user.displayName[0]}
                className="h-9 w-9"
              />
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{user.displayName}</p>
                <p className="text-xs text-neutral-400">{formatDate((review as any).createdAt)}</p>
              </div>
            </>
          ) : isAISummary ? (
            <>
              <div className="h-9 w-9 bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-500">
                AI
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900">AI統合レビュー</p>
                <p className="text-xs text-neutral-400">{review.sourceCount}件の情報源</p>
              </div>
            </>
          ) : null}

          {isAISummary && (
            <span className="text-xs text-neutral-400 border border-neutral-200 px-2 py-0.5">
              AI
            </span>
          )}
        </div>

        {/* 画像 */}
        <div className="relative aspect-[4/3] bg-neutral-50 overflow-hidden">
          {shoeImageUrl ? (
            <Image
              src={shoeImageUrl}
              alt={`${shoe.brand} ${shoe.modelName}`}
              fill
              className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-neutral-300 text-sm">No Image</span>
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          {shoe && (
            <div className="mb-3">
              <p className="text-xs text-neutral-400 uppercase tracking-wider mb-0.5">
                {shoe.brand}
              </p>
              <h3 className="text-base font-medium text-neutral-900 group-hover:underline">
                {shoe.modelName}
              </h3>
            </div>
          )}

          {/* 評価 */}
          <div className="flex items-center mb-3">
            <span className="text-2xl font-semibold text-neutral-900">{rating.toFixed(1)}</span>
            <span className="text-sm text-neutral-400 ml-1">/ 10</span>
          </div>

          {/* 本文 */}
          <p className="text-sm text-neutral-600 leading-relaxed mb-4 line-clamp-3">
            {contentPreview}
          </p>

          {/* アクション */}
          <div className="flex items-center space-x-4 pt-3 border-t border-neutral-100">
            <button className="flex items-center text-neutral-400 hover:text-neutral-900 transition-colors">
              <ThumbsUp className="h-4 w-4" />
              <span className="ml-1.5 text-xs">{review._count?.likes || 0}</span>
            </button>
            <button className="flex items-center text-neutral-400 hover:text-neutral-900 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span className="ml-1.5 text-xs">{review._count?.comments || 0}</span>
            </button>
          </div>
        </div>
      </Card>
    </Link>
  )
}
