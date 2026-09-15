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
            "!rounded-md !border !border-marino-700/25 !bg-marino-50 !text-marino-900 !shadow-tarjeta !font-sans",
          description: "!text-gris-700",
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
