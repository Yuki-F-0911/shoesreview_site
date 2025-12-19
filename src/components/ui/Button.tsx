import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow',
        secondary: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300',
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 py-2 px-5 text-sm rounded-lg',
        sm: 'h-9 px-4 text-sm rounded-lg',
        lg: 'h-12 px-8 text-base rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
