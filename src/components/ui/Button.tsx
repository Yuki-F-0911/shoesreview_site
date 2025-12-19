import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cyber-black disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-primary to-primary-dark text-cyber-black font-bold hover:shadow-glow-primary',
        secondary: 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 hover:border-primary',
        destructive: 'bg-neon-red text-white hover:bg-red-600 hover:shadow-glow-accent',
        outline: 'border border-primary/30 bg-transparent text-text-secondary hover:bg-primary/10 hover:text-primary hover:border-primary',
        ghost: 'text-text-secondary hover:bg-primary/10 hover:text-primary',
        link: 'text-primary underline-offset-4 hover:underline',
        accent: 'bg-gradient-to-r from-accent to-accent-secondary text-white font-bold hover:shadow-glow-accent',
        cyber: 'bg-cyber-gray border border-primary text-primary font-bold hover:bg-primary hover:text-cyber-black hover:shadow-glow-primary',
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
