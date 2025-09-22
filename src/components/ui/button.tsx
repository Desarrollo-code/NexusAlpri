import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider overflow-hidden shadow-[0_4px_6px_rgba(0,0,0,0.1),_0_1px_3px_rgba(0,0,0,0.08)] active:shadow-[0_2px_4px_rgba(0,0,0,0.08),_0_1px_2px_rgba(0,0,0,0.05)] active:translate-y-[1px]",
  {
    variants: {
      variant: {
        // Estilo para el botón de SIGN UP (rosa a púrpura)
        signUp:
          "bg-gradient-to-br from-[#ff00a0] to-[#8a2be2] text-white hover:from-[#ff33bb] hover:to-[#a042e8] border-b-2 border-transparent",
        // Estilo para el botón de LOGIN (azul a púrpura)
        login:
          "bg-gradient-to-br from-[#6a00ff] to-[#4b0082] text-white hover:from-[#8000ff] hover:to-[#5c009d] border-b-2 border-transparent",
        // Estilo para el botón de PLAY (verde azulado a azul)
        play:
          "bg-gradient-to-br from-[#00c6ff] to-[#0072ff] text-white hover:from-[#33d9ff] hover:to-[#338dff] border-b-2 border-transparent",
        // Estilo para el botón de SETTINGS (azul a azul más oscuro)
        settings:
          "bg-gradient-to-br from-[#007bff] to-[#0056b3] text-white hover:from-[#3395ff] hover:to-[#006bd7] border-b-2 border-transparent",
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 border-b-4 border-primary/70",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-b-4 border-destructive/70",
        outline:
          "border-2 border-input bg-background/50 hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-b-4 border-secondary/70",
        ghost: "hover:bg-accent hover:text-accent-foreground shadow-none border-0",
        link: "text-primary underline-offset-4 hover:underline shadow-none border-0",
      },
      size: {
        default: "h-12 px-8 py-3", // Un poco más grandes para el estilo de la imagen
        sm: "h-10 rounded-md px-5",
        lg: "h-14 rounded-md px-10 text-base",
        icon: "h-12 w-12",
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
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), "inline-flex items-center justify-center gap-2")}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
