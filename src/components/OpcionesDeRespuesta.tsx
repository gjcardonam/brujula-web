import { useRef } from 'react'
import { cn } from 'cn'
import type { OpcionEstudiante } from '@/api/types'
import { urlDeArchivo } from '@/api/client'

export interface Correccion { idOpcionSeleccionada: number; idOpcionCorrecta: number | null }

interface EstiloOpcion { caja: string; ficha: string; texto: string }

function estiloOpcion(o: OpcionEstudiante, seleccion: number | null, correccion: Correccion | null): EstiloOpcion {
  if (!correccion) {
    return seleccion === o.id
      ? {
          caja: 'border-violeta-600 bg-violeta-50',
          ficha: 'bg-violeta-600 text-white',
          texto: 'text-violeta-700',
        }
      : {
          caja: 'border-borde-fuerte bg-superficie hover:border-marino-200 active:translate-y-[3px] active:border-b-2',
          ficha: 'bg-hueso text-texto-suave',
          texto: 'text-marino-800',
        }
  }
  if (o.id === correccion.idOpcionCorrecta) {
    return { caja: 'border-exito-600 bg-exito-50', ficha: 'bg-exito-600 text-white', texto: 'text-exito-700' }
  }
  if (o.id === correccion.idOpcionSeleccionada) {
    return { caja: 'border-error-600 bg-error-50', ficha: 'bg-error-600 text-white', texto: 'text-error-700' }
  }
  return { caja: 'border-borde-fuerte bg-superficie opacity-55', ficha: 'bg-hueso text-texto-suave', texto: 'text-marino-800' }
}

function etiquetaOpcion(o: OpcionEstudiante, correccion: Correccion | null) {
  if (!correccion) return null
  if (o.id === correccion.idOpcionCorrecta) return { texto: 'Respuesta correcta', color: 'text-exito-700' }
  if (o.id === correccion.idOpcionSeleccionada) return { texto: 'Tu respuesta', color: 'text-error-700' }
  return null
}

export function OpcionesDeRespuesta({
  opciones,
  seleccion,
  onSeleccionar,
  correccion,
  disabled,
}: {
  opciones: OpcionEstudiante[]
  seleccion: number | null
  onSeleccionar: (id: number) => void
  correccion: Correccion | null
  disabled?: boolean
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const respondido = correccion !== null
  const indiceFoco = seleccion ? opciones.findIndex(o => o.id === seleccion) : 0

  function alTeclado(e: React.KeyboardEvent, i: number) {
    if (respondido || disabled) return
    const total = opciones.length
    const mapa: Record<string, number> = {
      ArrowDown: (i + 1) % total,
      ArrowRight: (i + 1) % total,
      ArrowUp: (i + total - 1) % total,
      ArrowLeft: (i + total - 1) % total,
      Home: 0,
      End: total - 1,
    }
    const destino = mapa[e.key]
    if (destino === undefined) return
    e.preventDefault()
    onSeleccionar(opciones[destino].id)
    refs.current[destino]?.focus()
  }

  return (
    <div role="radiogroup" aria-label="Opciones de respuesta" className="mt-7 grid gap-3.5 sm:grid-cols-2">
      {opciones.map((o, i) => {
        const est = estiloOpcion(o, seleccion, correccion)
        const etiqueta = etiquetaOpcion(o, correccion)
        return (
          <button
            key={o.id}
            type="button"
            ref={el => { refs.current[i] = el }}
            role="radio"
            aria-checked={seleccion === o.id}
            tabIndex={respondido ? -1 : i === Math.max(0, indiceFoco) ? 0 : -1}
            disabled={respondido || disabled}
            onClick={() => onSeleccionar(o.id)}
            onKeyDown={e => alTeclado(e, i)}
            className={cn(
              'flex items-center gap-4 rounded-tarjeta border-2 border-b-[5px] px-5 py-5 text-left transition-[transform,border-color,background-color,opacity] disabled:cursor-default',
              est.caja,
            )}
          >
            <span
              aria-hidden="true"
              className={cn('grid size-[34px] shrink-0 place-items-center rounded-ficha font-titular text-sm font-bold', est.ficha)}
            >
              {o.letra}
            </span>
            <span className={cn('min-w-0 flex-1 text-lg font-semibold', est.texto)}>
              {o.descripcion}
              {o.imagen && (
                <img
                  src={urlDeArchivo(o.imagen)}
                  alt={`Opción ${o.letra}`}
                  className="mt-2.5 max-h-[220px] w-full rounded-ficha border border-borde object-contain"
                />
              )}
            </span>
            {etiqueta && (
              <span
                className={cn(
                  'max-w-[84px] shrink-0 text-right text-[11px] leading-[1.25] font-bold tracking-[0.06em] uppercase sm:max-w-none',
                  etiqueta.color,
                )}
              >
                {etiqueta.texto}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
