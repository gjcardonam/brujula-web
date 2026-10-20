import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from 'cn'

export function FranjaDeCorreccion({
  correcto,
  titulo,
  detalle,
  nota,
  accion,
  enLinea = false,
}: {
  correcto: boolean
  titulo: ReactNode
  detalle: ReactNode
  nota?: ReactNode
  accion?: ReactNode
  enLinea?: boolean
}) {
  const Icono = correcto ? Check : X
  const Titulo = enLinea ? 'h3' : 'h2'
  return (
    <div
      className={cn(
        enLinea ? 'rounded-tarjeta border-2 p-5' : 'animate-subir-franja border-t-2 px-5 py-6 sm:px-10',
        correcto ? 'border-exito-200 bg-exito-50' : 'border-error-200 bg-error-50',
      )}
    >
      <div
        className={cn(
          'flex',
          enLinea
            ? 'items-start gap-4'
            : 'mx-auto w-full max-w-[820px] flex-col gap-4 sm:flex-row sm:items-center sm:gap-[30px]',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-full text-white',
            !enLinea && 'sm:size-[52px]',
            correcto ? 'bg-exito-600' : 'bg-error-600',
          )}
        >
          <Icono className={cn('size-[22px]', !enLinea && 'sm:size-[26px]')} strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          <Titulo className={cn('text-xl font-bold', correcto ? 'text-exito-700' : 'text-error-700')}>{titulo}</Titulo>
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
        {accion && <div className="shrink-0 max-sm:w-full">{accion}</div>}
      </div>
    </div>
  )
}
