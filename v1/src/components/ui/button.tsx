import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from 'lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-erp-danger text-destructive-foreground hover:bg-destructive/90', // TODO: Esses customs parecem não funcionar. Verificar
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground text-[#155366] border-[#155366]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'font-bold hover:bg-accent hover:text-accent-foreground text-[#155366]',
        link: 'text-primary underline-offset-4 hover:underline',
        erpPrimary:
          'bg-erp-button-primary-normal font-bold text-erp-button-primary-textNomal hover:bg-erp-button-primary-hover disabled:bg-erp-button-primary-disabled disabled:text-erp-button-primary-textDisabled text-[#155366]',
        erpSecondary:
          'bg-erp-button-secondary-normal font-bold text-erp-button-secondary-textNomal border border-erp-button-secondary-textNormal hover:bg-erp-button-secondary-hover hover:text-black hover:border-[#248DAD] disabled:bg-erp-button-secondary-disabled disabled:text-erp-button-secondary-textDisabled disabled:border-erp-button-secondary-textDisabled',
        erpReturn:
          'w-12 h-12 rounded-lg bg-[#EBF9FE] border border-erp-primary p-0 shadow-[0_4px_22px_0_rgba(0,0,0,0.05)]',
        erpPositive:
          'bg-erp-positive font-bold text-erp-button-primary-textNomal hover:bg-erp-positive/80 disabled:bg-erp-button-primary-disabled disabled:text-erp-button-primary-textDisabled text-white',
        outlinedSecondary:
          'border border-input bg-[#32C6F4] hover:bg-[#32C6F4]/80 hover:text-accent-foreground text-[#155366]',
        outlinedFullWidth:
          'w-full border border-[#155366] bg-[#EBF9FE] hover:bg-[#EBF9FE]/80 hover:text-accent-foreground text-[#155366]',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
        full: 'h-full',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
