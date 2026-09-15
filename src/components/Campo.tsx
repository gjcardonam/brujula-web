import { useId, type ReactNode } from 'react'
import { cn } from 'cn'
import { Label } from '@/components/ui/label'

export interface PropsDeControl {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

export function Campo({
  etiqueta,
  ayuda,
  error,
  className,
  children,
}: {
  etiqueta: ReactNode
  ayuda?: ReactNode
  error?: string | null
  className?: string
  children: (props: PropsDeControl) => ReactNode
}) {
  const base = useId()
  const id = `${base}-control`
  const idAyuda = `${base}-ayuda`
  const idError = `${base}-error`
  const descrito = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(' ')

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{etiqueta}</Label>
      {children({
        id,
        ...(error ? { 'aria-invalid': true as const } : {}),
        ...(descrito ? { 'aria-describedby': descrito } : {}),
      })}
      {ayuda && <p id={idAyuda} className="text-xs text-texto-suave">{ayuda}</p>}
      {error && <p id={idError} className="text-xs font-bold text-error-700">{error}</p>}
    </div>
  )
}
