import Link from 'next/link'
import Image from 'next/image'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils/date'
import { Star, ThumbsUp, MessageCircle, Sparkles } from 'lucide-react'
import type { Prisma } from '@prisma/client'

// Prismaから返される型を受け入れる
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

  // 評価に基づく色を決定
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600 bg-green-50'
    if (rating >= 6) return 'text-blue-600 bg-blue-50'
    if (rating >= 4) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <Link href={`/reviews/${review.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        {/* 画像セクション */}
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
          {shoeImageUrl ? (
            <>
              <Image
                src={shoeImageUrl}
                alt={shoe ? `${shoe.brand} ${shoe.modelName}` : 'シューズ画像'}
                fill
                className="object-contain p-3 transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl text-gray-300">👟</span>
            </div>
          )}

          {/* AI要約バッジ */}
          {isAISummary && (
            <div className="absolute left-2 top-2">
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                <Sparkles className="mr-1 h-3 w-3" />
                AI統合
              </Badge>
            </div>
          )}

          {/* 評価スコア */}
          <div className={`absolute right-2 top-2 flex items-center rounded-lg px-2 py-1 ${getRatingColor(rating)}`}>
            <Star className="mr-1 h-3.5 w-3.5 fill-current" />
            <span className="text-sm font-bold">{rating.toFixed(1)}</span>
          </div>

          {/* シューズ情報オーバーレイ */}
          {shoe && (
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
              <p className="text-xs font-medium text-white drop-shadow-md">
                {shoe.brand} {shoe.modelName}
              </p>
            </div>
          )}
        </div>

        {/* コンテンツセクション */}
        <CardContent className="p-4">
          <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
            {review.title}
          </h3>

          <p className="mb-3 line-clamp-2 text-sm text-gray-600">{review.content}</p>

          {/* タグ */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {shoe && (
              <Badge variant="outline" className="text-xs">
                {shoe.category}
              </Badge>
            )}
            {review.sourceCount > 0 && isAISummary && (
              <Badge variant="secondary" className="text-xs">
                {review.sourceCount}件の情報源
              </Badge>
            )}
          </div>

          {/* フッター */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <div className="flex items-center space-x-2">
              {user ? (
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <Avatar
                      src={user.avatarUrl}
                      fallback={user.displayName[0]}
                      className="h-6 w-6"
                    />
                    <span className="text-xs text-gray-600">{user.displayName}</span>
                  </div>
                  {/* Reviewer Attributes (Check if they exist on review object) */}
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-gray-500">
                    {/* Using generic access for new fields to avoid stale type errors if needed, but standard should work if generated */}
                    {(review as any).reviewerGender && <span>{(review as any).reviewerGender}</span>}
                    {(review as any).reviewerExpertise && <span>/ {(review as any).reviewerExpertise}</span>}
                    {(review as any).reviewerPersonalBest && <span>/ PB: {(review as any).reviewerPersonalBest}</span>}
                  </div>
                </div>
              ) : isAISummary ? (
                <div className="flex items-center text-xs text-gray-600">
                  <Sparkles className="mr-1 h-4 w-4 text-purple-500" />
                  AI要約
                </div>
              ) : null}
            </div>

            <div className="flex items-center space-x-3 text-xs text-gray-500">
              {review._count && (
                <>
                  <span className="flex items-center">
                    <ThumbsUp className="mr-1 h-3 w-3" />
                    {review._count.likes}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="mr-1 h-3 w-3" />
                    {review._count.comments}
                  </span>
                </>
              )}
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400">{formatDate((review as any).createdAt)}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
