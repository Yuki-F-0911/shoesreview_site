import React from 'react'
import { cn } from '@/lib/utils/cn'

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-gray-300 border-t-gray-900',
            sizeClasses[size]
          )}
        />
      </div>
    )
  }
)
Spinner.displayName = 'Spinner'

export { Spinner }

