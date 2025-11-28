import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Star, Users } from 'lucide-react'
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
    <Link href={`/shoes/${shoe.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        {/* 画像セクション */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-50">
          {shoe.imageUrls && shoe.imageUrls.length > 0 ? (
            <Image
              src={shoe.imageUrls[0]}
              alt={`${shoe.brand} ${shoe.modelName}`}
              fill
              className="object-contain p-4 transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="mt-1 text-xs">No Image</span>
              </div>
            </div>
          )}
          
          {/* 評価バッジ */}
          {shoe.avgRating && shoe.avgRating > 0 && (
            <div className="absolute right-2 top-2 flex items-center rounded-full bg-white/95 px-2 py-1 shadow-md backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 text-sm font-semibold text-gray-900">
                {shoe.avgRating.toFixed(1)}
              </span>
            </div>
          )}
          
          {/* カテゴリバッジ */}
          <div className="absolute left-2 top-2">
            <Badge variant="secondary" className="bg-white/95 text-xs backdrop-blur-sm">
              {shoe.category}
            </Badge>
          </div>
        </div>

        {/* 情報セクション */}
        <CardContent className="p-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
            {shoe.brand}
          </div>
          <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
            {shoe.modelName}
          </h3>
          
          <div className="mt-3 flex items-center justify-between">
            {shoe.officialPrice && (
              <p className="text-sm font-medium text-gray-900">
                ¥{shoe.officialPrice.toLocaleString()}
              </p>
            )}
            {shoe._count && (
              <div className="flex items-center text-xs text-gray-500">
                <Users className="mr-1 h-3 w-3" />
                {shoe._count.reviews}件
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

