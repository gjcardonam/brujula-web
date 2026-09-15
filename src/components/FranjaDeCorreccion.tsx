import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from 'cn'

export function FranjaDeCorreccion({
  correcto,
  titulo,
  detalle,
  nota,
  accion,
}: {
  correcto: boolean
  titulo: string
  detalle: ReactNode
  nota?: ReactNode
  accion: ReactNode
}) {
  const Icono = correcto ? Check : X
  return (
    <div
      className={cn(
        'animate-subir-franja border-t-2 px-5 py-6 sm:px-10',
        correcto ? 'border-exito-200 bg-exito-50' : 'border-error-200 bg-error-50',
      )}
    >
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-4 sm:flex-row sm:items-center sm:gap-[30px]">
        <span
          aria-hidden="true"
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-full text-white sm:size-[52px]',
            correcto ? 'bg-exito-600' : 'bg-error-600',
          )}
        >
          <Icono className="size-[22px] sm:size-[26px]" strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className={cn('text-xl font-bold', correcto ? 'text-exito-700' : 'text-error-700')}>{titulo}</h2>
          <div
            className={cn(
              'mt-1.5 max-w-[560px] text-md leading-relaxed [&_strong]:font-bold',
              correcto ? 'text-exito-900' : 'text-error-900',
            )}
          >
            {detalle}
          </div>
          {nota && <p className={cn('mt-2.5 text-xs', correcto ? 'text-exito-700' : 'text-error-700')}>{nota}</p>}
        </div>
        <div className="shrink-0 max-sm:w-full">{accion}</div>
      </div>
    </div>
  )
}
