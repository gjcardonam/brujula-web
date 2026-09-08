import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, mensajeDe } from '../api/client'
import type { Estadisticas } from '../api/types'
import { Alerta, Barra, Cargando, Vacio } from '../components/ui'
import { minutosDesdeSeg, numero, pct } from '../utils/formato'

const COLORES: Record<string, string> = { 'Error cognitivo': '#1e3a5f', 'Error de hábito': '#f59e0b', 'Error de ansiedad': '#dc2626' }
const CORTO: Record<string, string> = { 'Error cognitivo': 'Cognitivo', 'Error de hábito': 'Hábito', 'Error de ansiedad': 'Ansiedad' }

/** M-11 · Mis estadísticas (HU-019) y distribución de tipos de error (HU-029). */
export function EstadisticasPage() {
  const [datos, setDatos] = useState<Estadisticas | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<number | null>(null)

  useEffect(() => {
    api<Estadisticas>(`/estadisticas/mias${filtro ? `?componente=${filtro}` : ''}`).then(setDatos).catch(e => setError(mensajeDe(e)))
  }, [filtro])

  if (error) return <Alerta>{error}</Alerta>
  if (!datos) return <Cargando />
  if (datos.sinDatos) {
    return (
      <>
        <h1>Mis estadísticas</h1>
        <Vacio>Aún no has resuelto ejercicios ni simulacros. Cuando practiques, aquí verás tu desempeño. <div style={{ marginTop: 12 }}><Link className="btn sm" to="/banco">Ir al banco de ejercicios</Link></div></Vacio>
      </>
    )
  }
  const { resumen, simulacros, errores } = datos

  return (
    <>
      <h1>Mis estadísticas</h1>
      <div className="tiles">
        <div className="tile"><div className="v">{resumen.intentados}</div><div className="l">Ejercicios intentados</div></div>
        <div className="tile"><div className="v">{resumen.correctas}</div><div className="l">Correctas ({pct(resumen.porcentajeAciertos)})</div></div>
        <div className="tile"><div className="v">{resumen.incorrectas}</div><div className="l">Incorrectas ({pct(resumen.porcentajeDesaciertos)})</div></div>
        <div className="tile"><div className="v">{simulacros.cantidad}</div><div className="l">Simulacros{simulacros.cantidad > 0 && ` · ${pct(simulacros.porcentajePromedioAciertos)} prom.`}</div></div>
        <div className="tile"><div className="v">{simulacros.cantidad > 0 ? numero(simulacros.promedioEjercicios, 1) : '—'}</div>
          <div className="l">Ejercicios/simulacro{simulacros.cantidad > 0 && ` · ${numero(simulacros.ejerciciosPorHora, 1)} ej./hora · ${minutosDesdeSeg(simulacros.tiempoPromedioSeg)} prom.`}</div></div>
      </div>

      <div className="row">
        <div className="col card">
          <h2>Desempeño por componente</h2>
          {datos.porComponente.length === 0 && <div className="note">Aún no hay intentos.</div>}
          {datos.porComponente.map(a => <Barra key={a.id} etiqueta={`${a.nombre} (${a.intentados} int.)`} porcentaje={a.porcentajeAciertos} bajo={a.porcentajeAciertos < 60} />)}
          <h2 style={{ marginTop: 14 }}>Desempeño por competencia</h2>
          {datos.porCompetencia.map(a => <Barra key={a.id} etiqueta={`${a.nombre} (${a.intentados} int.)`} porcentaje={a.porcentajeAciertos} bajo={a.porcentajeAciertos < 60} />)}
          <h2 style={{ marginTop: 14 }}>Confianza vs. resultado</h2>
          {datos.porConfianza.length === 0 ? <div className="note">Aún no hay intentos.</div> : (
            <table>
              <thead><tr><th>Nivel</th><th>Intentos</th><th>Correctas</th><th>Incorrectas</th></tr></thead>
              <tbody>
                {datos.porConfianza.map(c => (
                  <tr key={c.nivel}><td>{c.nivel}</td><td>{c.intentados}</td><td>{c.correctas} ({pct(c.porcentajeCorrectas)})</td><td>{c.incorrectas} ({pct(c.porcentajeIncorrectas)})</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="col card">
          <h2>Distribución de tus errores</h2>
          <div className="chips" style={{ marginBottom: 6 }}>
            <button className={`chip sm ${filtro === null ? 'on' : ''}`} onClick={() => setFiltro(null)}>Todos los componentes</button>
            {datos.componentesConIntentos.map(c => <button key={c.id} className={`chip sm ${filtro === c.id ? 'on' : ''}`} onClick={() => setFiltro(c.id)}>{c.nombre}</button>)}
          </div>
          {errores.totalIncorrectos === 0 ? (
            <div className="note" style={{ marginTop: 8 }}>Aún no hay suficiente información{filtro ? ' para este componente' : ''}: no tienes intentos incorrectos registrados.</div>
          ) : (
            <>
              <div className="seg" aria-label="Distribución de tipos de error">
                {errores.distribucion.filter(d => d.cantidad > 0).map(d => (
                  <div key={d.tipo} style={{ width: `${d.porcentaje}%`, background: COLORES[d.tipo], color: d.tipo === 'Error de hábito' ? '#1f2937' : '#fff' }} title={`${d.tipo}: ${pct(d.porcentaje)}`}>
                    {CORTO[d.tipo]} {Math.round(d.porcentaje)} %
                  </div>
                ))}
              </div>
              <div className="note">Sobre {errores.totalIncorrectos} intentos incorrectos. {errores.distribucion.map(d => `${CORTO[d.tipo]}: ${d.cantidad}`).join(' · ')}.</div>
              {errores.mensajeOrientador
                ? <div className="reco" style={{ marginTop: 14 }}>{errores.mensajeOrientador}</div>
                : <div className="note" style={{ marginTop: 14 }}>Ningún tipo de error supera el 50 % de tus fallas; tus errores están repartidos.</div>}
            </>
          )}
          <div className="note" style={{ marginTop: 10 }}>Cognitivo: falta de conocimiento del concepto · Hábito: descuido en un tema que ya dominas · Ansiedad: fallar estando muy seguro.</div>
        </div>
      </div>
    </>
  )
}
