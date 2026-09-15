import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from 'cn'
import type { Tarjeta } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="shrink-0 text-gris-500">{etiqueta}</dt>
      <dd className="min-w-0 text-gris-700">{valor}</dd>
    </div>
  )
}

export function TarjetaEjercicio({ tarjeta, destino }: { tarjeta: Tarjeta; destino: string }) {
  const navigate = useNavigate()
  return (
    <article className="superficie group flex h-full flex-col p-5 transition-shadow hover:shadow-elevada">
      <h3 className="text-base font-semibold text-gris-900">Ejercicio #{tarjeta.numero}</h3>
      <dl className="mt-3 flex-1 space-y-1 text-sm">
        <Dato etiqueta="Componente:" valor={tarjeta.componente} />
        <Dato etiqueta="Competencia:" valor={tarjeta.competencia} />
        <Dato etiqueta="Nivel:" valor={tarjeta.nivel} />
      </dl>
      <div className="mt-5 pt-1">
        <Button size="sm" onClick={() => navigate(destino)}>
          Resolver
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          <span className="sr-only">el ejercicio {tarjeta.numero}</span>
        </Button>
      </div>
    </article>
  )
}

export function TarjetaEjercicioAdmin({ tarjeta }: { tarjeta: Tarjeta }) {
  const desactivado = tarjeta.estado === 'Desactivado'
  return (
    <article className={cn('superficie flex h-full flex-col p-5', desactivado && 'bg-gris-50')}>
      <div className="flex items-start justify-between gap-3">
        <h3 className={cn('text-base font-semibold', desactivado ? 'text-gris-500' : 'text-gris-900')}>
          Ejercicio #{tarjeta.numero}
        </h3>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            desactivado ? 'bg-gris-200 text-gris-700' : 'bg-exito-50 text-exito-700',
          )}
        >
          <span
            aria-hidden="true"
            className={cn('size-1.5 rounded-full', desactivado ? 'bg-gris-500' : 'bg-exito-600')}
          />
          {tarjeta.estado}
        </span>
      </div>
      <p className={cn('mt-3 flex-1 text-sm', desactivado ? 'text-gris-500' : 'text-gris-700')}>
        {tarjeta.componente} · {tarjeta.competencia} · {tarjeta.nivel}
      </p>
    </article>
  )
}

export function TarjetaEjercicioEsqueleto() {
  return (
    <div className="superficie p-5">
      <Skeleton className="h-5 w-32" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <Skeleton className="mt-5 h-9 w-28" />
    </div>
  )
}
