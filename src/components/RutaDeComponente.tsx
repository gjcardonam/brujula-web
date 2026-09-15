import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from 'cn'
import type { ComponenteConteo, Tarjeta } from '@/api/types'
import { IconoComponente, tonoDeComponente } from '@/components/Componente'
import { Skeleton } from '@/components/ui/skeleton'

const DIAMETRO = 52
const SEPARACION = 26
const HOLGURA = 8
const MIN_NODOS = 5
const MAX_NODOS = 9

function useNodosQueCaben(ref: React.RefObject<HTMLUListElement | null>) {
  const [cantidad, setCantidad] = useState(MIN_NODOS)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => {
      const caben = Math.floor((el.clientWidth - HOLGURA + SEPARACION) / (DIAMETRO + SEPARACION))
      setCantidad(Math.min(MAX_NODOS, Math.max(MIN_NODOS, caben)))
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [ref])

  return cantidad
}

export function RutaDeComponente({
  componente,
  ejercicios,
}: {
  componente: ComponenteConteo
  ejercicios: Tarjeta[]
}) {
  const tono = tonoDeComponente(componente.nombre)
  const pista = useRef<HTMLUListElement>(null)
  const cabidos = useNodosQueCaben(pista)
  const nodos = ejercicios.slice(0, cabidos)
  const lista = `/banco?componente=${componente.id}`

  return (
    <article className="tarjeta flex flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center sm:gap-[26px]">
      <div className="flex items-center gap-4 sm:gap-[26px]">
        <span
          aria-hidden="true"
          className={cn('grid size-[58px] shrink-0 place-items-center rounded-[18px]', tono.fondoSuave, tono.icono)}
        >
          <IconoComponente nombre={componente.nombre} className="size-[27px]" />
        </span>
        <div className="min-w-0 sm:w-[168px] sm:shrink-0">
          <h3 className="text-md font-bold text-marino-800">{componente.nombre}</h3>
          <p className="text-sm text-texto-suave">
            {componente.cantidad} {componente.cantidad === 1 ? 'ejercicio' : 'ejercicios'}
          </p>
        </div>
      </div>

      {ejercicios.length > 0 ? (
        <ul ref={pista} className="flex w-full min-w-0 flex-1 items-center gap-0 overflow-x-auto py-1">
          {nodos.map((e, i) => (
            <li key={e.id} className="flex shrink-0 items-center">
              {i > 0 && <span aria-hidden="true" className={cn('h-[3px] w-[26px] shrink-0', tono.linea)} />}
              <Link
                to={`/ejercicios/${e.id}?componente=${componente.id}`}
                aria-label={`Ejercicio ${e.numero} de ${componente.nombre}, nivel ${e.nivel.toLowerCase()}`}
                className={cn(
                  'grid size-[52px] shrink-0 place-items-center rounded-full font-titular text-lg font-bold transition-transform',
                  i === 0
                    ? cn('text-white', tono.fondoSolido, tono.peso, tono.anillo, 'active:translate-y-[2px] active:shadow-none')
                    : cn(tono.fondoSuave, tono.texto, 'hover:scale-105'),
                )}
              >
                <span aria-hidden="true">{e.numero}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="min-w-0 flex-1 text-sm text-texto-suave">Todavía no hay ejercicios en este componente.</p>
      )}

      {componente.cantidad > 0 && (
        <Link
          to={lista}
          aria-label={`Ver los ${componente.cantidad} ejercicios de ${componente.nombre}`}
          className={cn('shrink-0 text-base font-bold underline-offset-4 hover:underline', tono.texto)}
        >
          Ver los {componente.cantidad}
        </Link>
      )}
    </article>
  )
}

export function RutaDeComponenteEsqueleto() {
  return (
    <div className="tarjeta flex flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center sm:gap-[26px]">
      <div className="flex items-center gap-4 sm:gap-[26px]">
        <Skeleton className="size-[58px] shrink-0 rounded-[18px]" />
        <div className="space-y-2 sm:w-[168px]">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex flex-1 items-center gap-[26px]">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="size-[52px] shrink-0 rounded-full" />)}
      </div>
      <Skeleton className="h-4 w-20 shrink-0" />
    </div>
  )
}
