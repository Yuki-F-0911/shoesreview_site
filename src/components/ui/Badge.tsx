import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-neutral-900 bg-neutral-900 text-white',
        outline: 'border-neutral-300 text-neutral-700',
        secondary: 'border-neutral-200 bg-neutral-100 text-neutral-700',
        success: 'border-green-600 bg-green-600 text-white',
        warning: 'border-amber-500 bg-amber-500 text-white',
        destructive: 'border-red-600 bg-red-600 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
