import type { ReactNode } from 'react'
import { cn } from 'cn'
import { IconoComponente, tonoDeComponente } from '@/components/Componente'
import { porcentaje } from '@/utils/formato'

export const UMBRAL_REFUERZO = 60

export function Cifra({ valor, etiqueta, detalle }: { valor: ReactNode; etiqueta: string; detalle?: ReactNode }) {
  return (
    <div className="tarjeta px-5 py-4">
      <p className="font-titular text-2xl font-bold tracking-[-0.02em] text-marino-800">{valor}</p>
      <p className="text-sm font-bold text-texto-suave">{etiqueta}</p>
      {detalle && <p className="mt-0.5 text-xs text-texto-tenue">{detalle}</p>}
    </div>
  )
}

export function BarraDeDesempeno({
  nombre,
  valor,
  detalle,
  esComponente,
}: {
  nombre: string
  valor: number
  detalle: ReactNode
  esComponente?: boolean
}) {
  const tono = tonoDeComponente(nombre)
  const refuerzo = valor < UMBRAL_REFUERZO
  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        {esComponente && (
          <span aria-hidden="true" className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-ficha', tono.fondoSuave, tono.icono)}>
            <IconoComponente nombre={nombre} className="size-[17px]" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 text-base font-bold text-marino-800">{nombre}</p>
            <p className={cn('shrink-0 font-titular text-md font-bold', refuerzo ? 'text-error-700' : 'text-marino-800')}>
              {porcentaje(valor)}
            </p>
          </div>
          <div aria-hidden="true" className="mt-2 h-2.5 overflow-hidden rounded-full bg-hueso">
            <div
              className={cn('h-full rounded-full', refuerzo ? 'bg-error-600' : esComponente ? tono.fondoSolido : 'bg-marino-700')}
              style={{ width: `${Math.min(100, Math.max(0, valor))}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-texto-suave">
            {detalle}
            {refuerzo && <span className="font-bold text-error-700"> · por reforzar</span>}
          </p>
        </div>
      </div>
    </li>
  )
}
