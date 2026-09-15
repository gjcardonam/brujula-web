import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { cn } from 'cn'

type Tono = 'error' | 'confirmacion' | 'informacion'

const tonos: Record<Tono, { caja: string; icono: typeof Info }> = {
  error: { caja: 'border-error-300 bg-error-50 text-error-700', icono: CircleAlert },
  confirmacion: { caja: 'border-exito-200 bg-exito-50 text-exito-700', icono: CircleCheck },
  informacion: { caja: 'border-ambar-500/35 bg-ambar-50 text-gris-900', icono: Info },
}

export function Aviso({ tono = 'error', children, className }: { tono?: Tono; children: ReactNode; className?: string }) {
  const { caja, icono: Icono } = tonos[tono]
  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm', caja, className)}
    >
      <Icono className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 [&_a]:underline [&_a]:underline-offset-2">{children}</div>
    </div>
  )
}
