import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-control border-2 border-borde-fuerte bg-superficie px-4 py-3 text-base text-marino-800 outline-none transition-colors",
        "placeholder:text-texto-suave",
        "hover:border-marino-200 focus-visible:border-marino-700 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:bg-hueso disabled:opacity-60",
        "aria-invalid:border-error-600 aria-invalid:hover:border-error-600",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
