import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-ink hover:bg-primary-hover shadow-none",
        destructive:
          "bg-destructive text-primary-ink hover:bg-destructive/90 shadow-none",
        outline:
          "border border-hairline bg-shell text-ink hover:bg-wash shadow-none",
        secondary:
          "bg-wash text-ink hover:bg-wash/80 border border-hairline shadow-none",
        ghost:
          "text-ink hover:bg-wash shadow-none",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-[36px] px-4 py-2",
        sm: "h-[32px] rounded-md px-3 text-xs",
        lg: "h-[40px] rounded-md px-6 text-base",
        icon: "h-[36px] w-[36px]",
        "icon-sm": "h-[28px] w-[28px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
