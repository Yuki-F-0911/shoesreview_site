import { Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ReviewRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  className?: string
}

export function ReviewRating({
  rating,
  maxRating = 10,
  size = 'md',
  showNumber = true, // デフォルトで数値を表示
  className,
}: ReviewRatingProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  // 10.0点満点の場合は数値表示を優先
  const displayRating = typeof rating === 'number' ? rating : parseFloat(String(rating)) || 0

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex items-center">
        <span className={cn('font-bold text-gray-900', sizeClasses[size])}>
          {displayRating.toFixed(1)}
        </span>
        <span className={cn('ml-1 text-gray-500', sizeClasses[size])}>
          / {maxRating.toFixed(1)}
        </span>
      </div>
      {!showNumber && (
        // 星表示が必要な場合（後方互換性のため）
        <div className="flex items-center space-x-0.5">
          {Array.from({ length: 5 }).map((_, index) => {
            const starValue = (index + 1) * 2 // 5段階を10点満点に変換
            const isFilled = starValue <= Math.round(displayRating)

            return (
              <Star
                key={index}
                className={cn(
                  'h-4 w-4',
                  isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                )}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

