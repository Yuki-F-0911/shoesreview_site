import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Star, MessageSquare } from 'lucide-react'
import type { Shoe } from '@/types/shoe'

interface ShoeCardProps {
  shoe: Shoe & {
    _count?: {
      reviews: number
    }
    avgRating?: number
  }
}

export function ShoeCard({ shoe }: ShoeCardProps) {
  return (
    <Link href={`/shoes/${shoe.id}`} className="block group">
      <Card className="h-full overflow-hidden">
        {/* 画像セクション */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {shoe.imageUrls && shoe.imageUrls.length > 0 ? (
            <Image
              src={shoe.imageUrls[0]}
              alt={`${shoe.brand} ${shoe.modelName}`}
              fill
              className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-300">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}

          {/* カテゴリバッジ */}
          <div className="absolute left-3 top-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-600 text-xs backdrop-blur-sm shadow-sm">
              {shoe.category}
            </Badge>
          </div>
        </div>

        {/* 情報セクション */}
        <CardContent className="p-4">
          {/* ブランド名（小さく控えめ） */}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            {shoe.brand}
          </p>

          {/* モデル名（大きく目立つ） */}
          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {shoe.modelName}
          </h3>

          {/* メタ情報 */}
          <div className="mt-3 flex items-center justify-between">
            {/* 価格 */}
            {shoe.officialPrice && (
              <p className="text-base font-semibold text-gray-900">
                ¥{shoe.officialPrice.toLocaleString()}
              </p>
            )}

            {/* 評価とレビュー数 */}
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              {shoe.avgRating && shoe.avgRating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-gray-700">{shoe.avgRating.toFixed(1)}</span>
                </div>
              )}
              {shoe._count && (
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{shoe._count.reviews}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
