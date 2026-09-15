import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from 'cn'
import type { Tarjeta } from '@/api/types'
import { IconoComponente, tonoDeComponente } from '@/components/Componente'
import { Skeleton } from '@/components/ui/skeleton'

function Cabecera({ tarjeta, mostrarComponente }: { tarjeta: Tarjeta; mostrarComponente: boolean }) {
  const tono = tonoDeComponente(tarjeta.componente)
  return (
    <div className="flex items-center gap-3.5">
      <span
        aria-hidden="true"
        className={cn('grid size-11 shrink-0 place-items-center rounded-[13px]', tono.fondoSuave, tono.icono)}
      >
        <IconoComponente nombre={tarjeta.componente} className="size-[21px]" />
      </span>
      <div className="min-w-0">
        <h3 className="truncate font-titular text-md font-bold tracking-[-0.02em] whitespace-nowrap text-marino-800">
          Ejercicio {tarjeta.numero}
        </h3>
        <p className="truncate text-sm text-texto-suave">
          {mostrarComponente ? tarjeta.componente : `Nivel ${tarjeta.nivel.toLowerCase()}`}
        </p>
      </div>
    </div>
  )
}

export function TarjetaEjercicio({
  tarjeta,
  destino,
  mostrarComponente = true,
}: {
  tarjeta: Tarjeta
  destino: string
  mostrarComponente?: boolean
}) {
  const tono = tonoDeComponente(tarjeta.componente)
  return (
    <Link
      to={destino}
      className={cn(
        'group flex h-full flex-col rounded-tarjeta-lg border-2 border-b-[5px] border-borde-fuerte bg-superficie p-5 transition-[transform,border-color]',
        'hover:border-marino-200 active:translate-y-[3px] active:border-b-2',
        tono.clave === 'teal' && 'hover:border-teal-200',
        tono.clave === 'ocre' && 'hover:border-ocre-200',
        tono.clave === 'violeta' && 'hover:border-violeta-200',
      )}
    >
      <Cabecera tarjeta={tarjeta} mostrarComponente={mostrarComponente} />
      <p className="mt-4 flex-1 text-sm leading-relaxed text-texto-suave">
        {tarjeta.competencia}
        {mostrarComponente && (
          <span className="mt-0.5 block text-texto-suave">Nivel {tarjeta.nivel.toLowerCase()}</span>
        )}
      </p>
      <span className={cn('mt-5 inline-flex items-center gap-2 text-base font-bold', tono.texto)}>
        Resolver
        <ArrowRight className="size-[17px] transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  )
}

export function TarjetaEjercicioAdmin({
  tarjeta,
  mostrarComponente = true,
}: {
  tarjeta: Tarjeta
  mostrarComponente?: boolean
}) {
  const desactivado = tarjeta.estado === 'Desactivado'
  return (
    <article className={cn('tarjeta flex h-full flex-col p-5', desactivado && 'bg-hueso')}>
      <Cabecera tarjeta={tarjeta} mostrarComponente={mostrarComponente} />
      <p className="mt-4 flex-1 text-sm leading-relaxed text-texto-suave">
        {tarjeta.competencia}
        {mostrarComponente && (
          <span className="mt-0.5 block text-texto-suave">Nivel {tarjeta.nivel.toLowerCase()}</span>
        )}
      </p>
      <span
        className={cn(
          'mt-5 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold',
          desactivado ? 'bg-marino-100 text-texto-suave' : 'bg-exito-50 text-exito-700',
        )}
      >
        <span aria-hidden="true" className={cn('size-1.5 rounded-full', desactivado ? 'bg-texto-tenue' : 'bg-exito-600')} />
        {tarjeta.estado}
      </span>
    </article>
  )
}

export function TarjetaEjercicioEsqueleto() {
  return (
    <div className="tarjeta p-5">
      <div className="flex items-center gap-3.5">
        <Skeleton className="size-11 shrink-0 rounded-[13px]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <Skeleton className="mt-5 h-4 w-24" />
    </div>
  )
}
