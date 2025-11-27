import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Shoe } from '@/types/shoe'

interface ShoeCardProps {
  shoe: Shoe & {
    _count?: {
      reviews: number
    }
  }
}

export function ShoeCard({ shoe }: ShoeCardProps) {
  return (
    <Link href={`/shoes/${shoe.id}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">{shoe.brand}</h3>
          <p className="text-sm text-gray-600">{shoe.modelName}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="outline">{shoe.category}</Badge>
            {shoe._count && (
              <span className="text-sm text-gray-500">
                {shoe._count.reviews}件のレビュー
              </span>
            )}
          </div>
          {shoe.officialPrice && (
            <p className="mt-2 text-sm font-medium text-gray-900">
              ¥{shoe.officialPrice.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

