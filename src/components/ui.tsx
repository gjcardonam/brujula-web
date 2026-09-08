import { useEffect, type ReactNode } from 'react'

export function Alerta({ tipo = 'err', children, style }: { tipo?: 'err' | 'ok' | 'warn'; children: ReactNode; style?: React.CSSProperties }) {
  const cls = tipo === 'ok' ? 'ok' : tipo === 'warn' ? 'warnbox' : 'err'
  return <div className={cls} role={tipo === 'err' ? 'alert' : 'status'} style={style}>{children}</div>
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return <div className="loading">{texto}</div>
}

export function Vacio({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function Modal({ titulo, children, onCerrar }: { titulo: string; children: ReactNode; onCerrar?: () => void }) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar?.() }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [onCerrar])
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="box">
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
  )
}

export function Toast({ texto, tipo = 'ok' }: { texto: string; tipo?: 'ok' | 'warn' | 'bad' }) {
  return <div className={`toast ${tipo}`} role="status">{texto}</div>
}

export function Paginacion({ pagina, totalPaginas, onCambiar }: { pagina: number; totalPaginas: number; onCambiar: (p: number) => void }) {
  if (totalPaginas <= 1) return null                          // HU-008 CA-05
  const paginas: number[] = []
  const desde = Math.max(0, pagina - 2)
  const hasta = Math.min(totalPaginas - 1, pagina + 2)
  for (let i = desde; i <= hasta; i++) paginas.push(i)
  return (
    <nav className="pag" aria-label="Paginación">
      <button className="p" disabled={pagina === 0} onClick={() => onCambiar(pagina - 1)} aria-label="Página anterior">‹</button>
      {desde > 0 && <><button className="p" onClick={() => onCambiar(0)}>1</button>{desde > 1 && <span>…</span>}</>}
      {paginas.map(p => <button key={p} className={`p ${p === pagina ? 'on' : ''}`} onClick={() => onCambiar(p)} aria-current={p === pagina ? 'page' : undefined}>{p + 1}</button>)}
      {hasta < totalPaginas - 1 && <>{hasta < totalPaginas - 2 && <span>…</span>}<button className="p" onClick={() => onCambiar(totalPaginas - 1)}>{totalPaginas}</button></>}
      <button className="p" disabled={pagina >= totalPaginas - 1} onClick={() => onCambiar(pagina + 1)} aria-label="Página siguiente">›</button>
      <span className="note" style={{ marginLeft: 8 }}>Página {pagina + 1} de {totalPaginas}</span>
    </nav>
  )
}

export function Barra({ etiqueta, porcentaje, bajo }: { etiqueta: string; porcentaje: number; bajo?: boolean }) {
  const v = Math.max(0, Math.min(100, Number(porcentaje) || 0))
  return (
    <div className="bar">
      <div className="lbl" title={etiqueta}>{etiqueta}</div>
      <div className="trk"><div className={`fil ${bajo ? 'lo' : ''}`} style={{ width: `${v}%` }} /></div>
      <div className="pct">{Number(porcentaje).toLocaleString('es-CO', { maximumFractionDigits: 2 })} %</div>
    </div>
  )
}

export function Confianza({ valor, onCambiar, disabled }: { valor: number | null; onCambiar: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="conf" role="radiogroup" aria-label="Nivel de confianza">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" className={`b ${valor === n ? 'on' : ''}`} disabled={disabled}
          role="radio" aria-checked={valor === n} onClick={() => onCambiar(n)}>{n}</button>
      ))}
    </div>
  )
}
