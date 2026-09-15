import type { ReactNode } from 'react'
import { RosaDeLosVientos } from '@/components/Marca'

export function EstadoVacio({ titulo, descripcion, accion }: { titulo: string; descripcion?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="superficie flex flex-col items-center px-6 py-14 text-center">
      <RosaDeLosVientos className="size-12 text-marino-700/25" />
      <h2 className="mt-5 text-base font-semibold text-gris-900">{titulo}</h2>
      {descripcion && <p className="mt-2 max-w-sm text-sm text-gris-500">{descripcion}</p>}
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  )
}
