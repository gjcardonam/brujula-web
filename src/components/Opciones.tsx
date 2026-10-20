import { cn } from 'cn'
import { urlDeArchivo } from '@/api/client'

export type EstadoOpcion = 'libre' | 'seleccionada' | 'correcta' | 'incorrecta' | 'descartada'

interface EstiloOpcion { caja: string; ficha: string; texto: string }

const ESTILOS: Record<EstadoOpcion, EstiloOpcion> = {
  libre: {
    caja: 'border-borde-fuerte bg-superficie hover:border-marino-200 active:translate-y-[3px] active:border-b-2',
    ficha: 'bg-hueso text-texto-suave',
    texto: 'text-marino-800',
  },
  seleccionada: { caja: 'border-violeta-600 bg-violeta-50', ficha: 'bg-violeta-600 text-white', texto: 'text-violeta-700' },
  correcta: { caja: 'border-exito-600 bg-exito-50', ficha: 'bg-exito-600 text-white', texto: 'text-exito-700' },
  incorrecta: { caja: 'border-error-600 bg-error-50', ficha: 'bg-error-600 text-white', texto: 'text-error-700' },
  descartada: { caja: 'border-borde-fuerte bg-superficie opacity-55', ficha: 'bg-hueso text-texto-suave', texto: 'text-marino-800' },
}

export const cajaDeOpcion =
  'flex items-center gap-4 rounded-tarjeta border-2 border-b-[5px] px-5 py-5 text-left transition-[transform,border-color,background-color,opacity]'

export function estiloOpcion(estado: EstadoOpcion): EstiloOpcion {
  return ESTILOS[estado]
}

export function etiquetaOpcion(estado: EstadoOpcion) {
  if (estado === 'correcta') return { texto: 'Respuesta correcta', color: 'text-exito-700' }
  if (estado === 'incorrecta') return { texto: 'Tu respuesta', color: 'text-error-700' }
  return null
}

export function ContenidoDeOpcion({
  opcion,
  estado,
  tuRespuesta = false,
}: {
  opcion: { letra: string; descripcion: string | null; imagen: string | null }
  estado: EstadoOpcion
  tuRespuesta?: boolean
}) {
  const est = estiloOpcion(estado)
  const etiqueta = etiquetaOpcion(estado)
  return (
    <>
      <span
        aria-hidden="true"
        className={cn('grid size-[34px] shrink-0 place-items-center rounded-ficha font-titular text-sm font-bold', est.ficha)}
      >
        {opcion.letra}
      </span>
      <span className={cn('min-w-0 flex-1 text-lg font-semibold', est.texto)}>
        {opcion.descripcion}
        {opcion.imagen && (
          <img
            src={urlDeArchivo(opcion.imagen)}
            alt={`Opción ${opcion.letra}`}
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
          {tuRespuesta && estado === 'correcta' && <span className="mt-1 block">Tu respuesta</span>}
        </span>
      )}
    </>
  )
}
