import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2.5 font-titular font-bold tracking-[-0.01em] whitespace-nowrap outline-none transition-[transform,box-shadow,background-color,border-color,color] select-none disabled:pointer-events-none disabled:opacity-55 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.15em]",
  {
    variants: {
      variant: {
        principal:
          "bg-marino-800 text-white shadow-[0_4px_0_var(--color-marino-900)] hover:bg-marino-700 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-marino-900)]",
        acento:
          "bg-ambar-500 text-marino-800 shadow-[0_4px_0_var(--color-ambar-700)] hover:bg-ambar-600 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-ambar-700)]",
        contorno:
          "border-2 border-borde-fuerte bg-superficie text-marino-800 shadow-[0_3px_0_var(--color-borde-fuerte)] hover:border-marino-200 active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-borde-fuerte)]",
        fantasma:
          "text-texto-suave hover:bg-hueso hover:text-marino-800",
        enlace:
          "font-sans font-bold text-marino-700 underline decoration-2 underline-offset-4 hover:text-violeta-600",
      },
      size: {
        sm: "h-10 rounded-control px-4 text-sm",
        default: "h-12 rounded-control px-6 text-md",
        lg: "h-14 rounded-control-lg px-8 text-md",
        bloque: "h-13 w-full rounded-control-lg px-6 text-md",
        icono: "size-10 rounded-control",
        "icono-sm": "size-9 rounded-ficha [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "principal",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "principal",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
