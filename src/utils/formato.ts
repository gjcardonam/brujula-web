export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' · ' +
    d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export function fecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function numero(v: number | null | undefined, decimales = 2): string {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—'
  return Number(v).toLocaleString('es-CO', { maximumFractionDigits: decimales })
}

export function porcentaje(v: number | null | undefined): string {
  const n = numero(v)
  return n === '—' ? n : `${n} %`
}

export function duracion(seg: number | null | undefined): string {
  if (seg === null || seg === undefined || Number.isNaN(Number(seg))) return '—'
  const total = Math.round(Number(seg))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h} h ${m} min`
  if (m > 0) return s ? `${m} min ${s} s` : `${m} min`
  return `${s} s`
}

export function reloj(seg: number): string {
  const s = Math.max(0, Math.floor(seg))
  const h = Math.floor(s / 3600)
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
