import type { ReactNode } from 'react'
import { RosaDeLosVientos } from '@/components/Marca'

export function EstadoVacio({ titulo, descripcion, accion }: { titulo: string; descripcion?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-16 text-center">
      <RosaDeLosVientos grosor={1} className="size-16 text-marino-700 opacity-35" />
      <h2 className="mt-6 text-xl font-bold text-marino-800">{titulo}</h2>
      {descripcion && <p className="mt-2.5 max-w-sm text-base text-texto-suave">{descripcion}</p>}
      {accion && <div className="mt-7">{accion}</div>}
    </div>
  )
}
