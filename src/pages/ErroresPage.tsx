import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, mensajeDe } from '@/api/client'
import type { ErroresDelEstudiante } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { pct } from '@/utils/formato'

export function ErroresPage() {
  const [componente, setComponente] = useState('')
  const [datos, setDatos] = useState<ErroresDelEstudiante | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    let vigente = true
    setCargando(true); setError(null)
    api<ErroresDelEstudiante>(`/estadisticas/errores${componente ? `?componente=${componente}` : ''}`)
      .then(d => { if (vigente) setDatos(d) })
      .catch(e => { if (vigente) setError(mensajeDe(e)) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [componente])
  return <div className="space-y-6">
    <h1 className="text-3xl font-bold text-marino-800">Mis errores</h1>
    <p>Conoce cómo se distribuyen tus respuestas incorrectas y qué puedes mejorar.</p>
    <label className="block space-y-2"><span>Componente</span>
      <select className="block rounded-control border border-borde bg-superficie p-3" value={componente} onChange={e => setComponente(e.target.value)}>
        <option value="">Todos los componentes</option>
        {datos?.componentesConIntentos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select>
    </label>
    <div aria-live="polite" aria-busy={cargando}>
      {error && <Aviso>{error}</Aviso>}
      {cargando && <Skeleton className="h-40 w-full" />}
      {!cargando && !error && datos && <section className="panel space-y-5 p-6">
        {datos.totalIncorrectos === 0 ? <><p>Aún no tienes respuestas incorrectas{componente ? ' en este componente' : ''}.</p><Button asChild><Link to="/banco">Practicar</Link></Button></> : <>
          <p>{datos.totalIncorrectos} respuestas incorrectas. Los porcentajes se calculan sobre {datos.totalIncorrectos - datos.sinClasificar} errores clasificados.</p>
          {datos.sinClasificar > 0 && <Aviso tono="informacion">{datos.sinClasificar} intentos antiguos no tienen clasificación registrada y no se incluyen en los porcentajes.</Aviso>}
          {datos.distribucion.map(d => <div key={d.tipo} className="space-y-2">
            <p className="font-bold">{d.tipo}: {d.cantidad} ({pct(d.porcentaje)})</p>
            <div role="progressbar" aria-label={d.tipo} aria-valuenow={d.porcentaje} aria-valuemin={0} aria-valuemax={100} className="h-4 overflow-hidden rounded-full bg-hueso">
              <div className="h-full bg-marino-800" style={{width: `${d.porcentaje}%`}} />
            </div>
          </div>)}
          <p>{datos.mensajeOrientador ?? (datos.totalIncorrectos === datos.sinClasificar ? 'Aún no hay errores clasificados para generar una orientación.' : 'Ningún tipo de error supera el 50 %; tus errores están repartidos.')}</p>
        </>}
        <p className="text-sm text-texto-suave">Cognitivo: refuerzo de conceptos. Hábito: revisar descuidos en áreas que venías dominando. Ansiedad: fallos con confianza alta. Esta clasificación orienta tu práctica.</p>
      </section>}
    </div>
  </div>
}
