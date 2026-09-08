export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export function fecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function pct(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—'
  return Number(v).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %'
}

export function pctEntero(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return Math.round(Number(v)) + ' %'
}

export function minutosDesdeSeg(seg: number | null | undefined): string {
  if (seg === null || seg === undefined) return '—'
  const m = Math.floor(seg / 60)
  const s = Math.round(seg % 60)
  return m > 0 ? `${m} min${s ? ` ${s} s` : ''}` : `${s} s`
}

export function mmss(seg: number): string {
  const s = Math.max(0, Math.floor(seg))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(r).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function numero(v: number | null | undefined, decimales = 2): string {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: decimales })
}
