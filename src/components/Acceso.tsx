import type { ReactNode } from 'react'

/** Marco de las pantallas sin sesión (M-01, M-02, M-03): panel de marca a la izquierda y tarjeta a la derecha. */
export function Acceso({ titulo, texto, nota, children }: { titulo?: ReactNode; texto: ReactNode; nota?: ReactNode; children: ReactNode }) {
  return (
    <div className="acceso">
      <div className="brand">
        <h1>{titulo ?? <>Brú<span>jula</span></>}</h1>
        <p>{texto}</p>
        {nota && <p className="small">{nota}</p>}
      </div>
      <div className="panel">{children}</div>
    </div>
  )
}
