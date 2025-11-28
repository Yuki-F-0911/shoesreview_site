import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
          className
        )}
        {...props}
      >
        {src ? (
          <Image src={src} alt={alt || ''} fill className="object-cover" sizes="40px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-600">
            {fallback ? (
              <span className="text-sm font-medium">{fallback}</span>
            ) : (
              <span className="text-sm font-medium">?</span>
            )}
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export { Avatar }

