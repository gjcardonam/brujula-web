import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-tarjeta !border-2 !border-borde-fuerte !bg-superficie !text-marino-800 !font-sans !shadow-[0_4px_0_var(--color-borde-fuerte)]",
          description: "!text-texto-suave",
        },
      }}
      style={
        {
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
