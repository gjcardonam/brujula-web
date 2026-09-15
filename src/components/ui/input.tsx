import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-control border-2 border-borde-fuerte bg-superficie px-4 text-base text-marino-800 outline-none transition-colors",
        "placeholder:text-texto-suave selection:bg-marino-800 selection:text-white",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-semibold",
        "hover:border-marino-200 focus-visible:border-marino-700 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:bg-hueso disabled:opacity-60",
        "read-only:bg-hueso read-only:text-texto-suave",
        "aria-invalid:border-error-600 aria-invalid:hover:border-error-600",
        className
      )}
      {...props}
    />
  )
}

export { Input }
