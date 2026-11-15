import type { ReactNode } from 'react'
import { Brain, Eye, Wind } from 'lucide-react'
import { cn } from 'cn'
import type { TipoDeError } from '@/retro/mensajes'

// Mismos colores e íconos de cada tipo que en Mis errores, para que el estudiante conecte ambas pantallas.
const ESTILO: Record<TipoDeError, { icono: typeof Brain; fondo: string; borde: string; circulo: string; texto: string }> = {
  'Error cognitivo': { icono: Brain, fondo: 'bg-violeta-50', borde: 'border-violeta-200', circulo: 'bg-violeta-600', texto: 'text-violeta-700' },
  'Error de hábito': { icono: Eye, fondo: 'bg-teal-50', borde: 'border-teal-200', circulo: 'bg-teal-600', texto: 'text-teal-700' },
  'Error de ansiedad': { icono: Wind, fondo: 'bg-ocre-50', borde: 'border-ocre-200', circulo: 'bg-ocre-600', texto: 'text-ocre-700' },
}

export function TarjetaDeError({ tipo, mensaje, accion }: { tipo: TipoDeError; mensaje: string; accion?: ReactNode }) {
  const e = ESTILO[tipo]
  const Icono = e.icono
  return (
    <div className={cn('mt-3 flex flex-col gap-3 rounded-tarjeta border-2 p-4 sm:flex-row sm:items-center', e.fondo, e.borde)}>
      <div className="flex flex-1 items-start gap-3">
        <span aria-hidden="true" className={cn('grid size-10 shrink-0 place-items-center rounded-full text-white', e.circulo)}>
          <Icono className="size-5" strokeWidth={2.5} />
        </span>
        <p className={cn('text-sm leading-relaxed font-semibold', e.texto)}>{mensaje}</p>
      </div>
      {accion && <div className="shrink-0">{accion}</div>}
    </div>
  )
}
