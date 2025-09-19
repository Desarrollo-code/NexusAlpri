
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider overflow-hidden shadow-md active:shadow-sm active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary/90 to-primary text-primary-foreground border border-primary/50 shadow-primary/20",
        destructive:
          "bg-gradient-to-b from-destructive/90 to-destructive text-destructive-foreground border border-destructive/50 shadow-destructive/20",
        outline:
          "border-2 border-input bg-background/50 hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-gradient-to-b from-secondary/90 to-secondary text-secondary-foreground border border-secondary/50 shadow-secondary/20",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Pseudo-elemento para el brillo glossy
const glossyEffect = "before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-1/2 before:rounded-full before:bg-gradient-to-b before:from-white/50 before:to-transparent before:opacity-80 before:blur-[1px]"


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isGlossy = variant === "default" || variant === "destructive" || variant === "secondary";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          isGlossy && glossyEffect
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
