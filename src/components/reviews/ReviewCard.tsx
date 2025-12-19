import Link from 'next/link'
import Image from 'next/image'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils/date'
import { Star, ThumbsUp, MessageCircle, Sparkles, ChevronRight } from 'lucide-react'
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

  // 良い点のサマリーを抽出（最初の100文字程度）
  const contentPreview = review.content.length > 150
    ? review.content.slice(0, 150) + '...'
    : review.content

  return (
    <Link href={`/reviews/${review.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* シューズ画像エリア - メインビジュアル */}
        <div className="relative">
          <div className="aspect-[16/9] bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
            {shoeImageUrl ? (
              <Image
                src={shoeImageUrl}
                alt={`${shoe.brand} ${shoe.modelName}`}
                fill
                className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-6xl text-slate-200">👟</span>
              </div>
            )}
          </div>

          {/* 評価スコアバッジ */}
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-slate-900">{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* AIバッジ */}
          {isAISummary && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-gradient-to-r from-primary to-primary-dark text-white border-0 shadow-md">
                <Sparkles className="mr-1 h-3 w-3" />
                AI統合
              </Badge>
            </div>
          )}
        </div>

        {/* コンテンツエリア */}
        <div className="p-5">
          {/* シューズ名 - 最も目立つ */}
          {shoe && (
            <div className="mb-3">
              <p className="text-xs font-medium text-primary uppercase tracking-wider">
                {shoe.brand}
              </p>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                {shoe.modelName}
              </h3>
            </div>
          )}

          {/* レビュー本文プレビュー */}
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            {contentPreview}
          </p>

          {/* フッター: ユーザーとエンゲージメント */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  <Avatar
                    src={user.avatarUrl}
                    fallback={user.displayName[0]}
                    className="h-8 w-8"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user.displayName}</p>
                    <p className="text-xs text-slate-400">{formatDate((review as any).createdAt)}</p>
                  </div>
                </>
              ) : isAISummary ? (
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">AI統合レビュー</p>
                    <p className="text-xs text-slate-400">{review.sourceCount}件の情報源</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center space-x-3 text-slate-400">
              <span className="flex items-center space-x-1 text-sm">
                <ThumbsUp className="h-4 w-4" />
                <span>{review._count?.likes || 0}</span>
              </span>
              <span className="flex items-center space-x-1 text-sm">
                <MessageCircle className="h-4 w-4" />
                <span>{review._count?.comments || 0}</span>
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
