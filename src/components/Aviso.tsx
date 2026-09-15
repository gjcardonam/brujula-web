import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { cn } from 'cn'

type Tono = 'error' | 'confirmacion' | 'informacion'

const tonos: Record<Tono, { caja: string; icono: typeof Info; color: string }> = {
  error: { caja: 'border-error-200 bg-error-50 text-error-900', icono: CircleAlert, color: 'text-error-600' },
  confirmacion: { caja: 'border-exito-200 bg-exito-50 text-exito-900', icono: CircleCheck, color: 'text-exito-600' },
  informacion: { caja: 'border-ambar-500/40 bg-ambar-50 text-marino-800', icono: Info, color: 'text-ambar-600' },
}

export function Aviso({ tono = 'error', children, className }: { tono?: Tono; children: ReactNode; className?: string }) {
  const { caja, icono: Icono, color } = tonos[tono]
  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-control-lg border-2 px-4 py-3.5 text-sm leading-relaxed', caja, className)}
    >
      <Icono className={cn('mt-px size-[18px] shrink-0', color)} aria-hidden="true" />
      <div className="min-w-0 [&_a]:underline [&_a]:underline-offset-4">{children}</div>
    </div>
  )
}
