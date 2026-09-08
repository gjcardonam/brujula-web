import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError, mensajeDe } from '../api/client'
import type { ResultadoSimulacro } from '../api/types'
import { Alerta, Barra, Cargando } from '../components/ui'
import { fecha, fechaHora, minutosDesdeSeg, pct } from '../utils/formato'

/** M-10 · Resultado del simulacro y recomendaciones (HU-017, HU-018). */
export function ResultadoSimulacroPage() {
  const { id } = useParams()
  const [r, setR] = useState<ResultadoSimulacro | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enCurso, setEnCurso] = useState(false)
  const [verDetalle, setVerDetalle] = useState(false)

  useEffect(() => {
    api<ResultadoSimulacro>(`/simulacros/${id}/resultado`).then(setR).catch(e => {
      if (e instanceof ApiError && e.codigo === 'SIMULACRO_EN_CURSO') setEnCurso(true)
      else setError(mensajeDe(e))
    })
  }, [id])

  if (enCurso) return <div className="card"><h2>El simulacro aún está en curso</h2><Link className="btn" to={`/simulacros/${id}`}>Continuar simulacro</Link></div>
  if (error) return <Alerta>{error}</Alerta>
  if (!r) return <Cargando texto="Calculando resultados…" />

  const umbralBajo = (p: number) => p < 60

  return (
    <>
      <h1>Resultado del simulacro · {fecha(r.fechaInicio)}</h1>
      <div className="sub">Iniciado {fechaHora(r.fechaInicio)} · finalizado {fechaHora(r.fechaFin)}</div>
      <div className="tiles">
        <div className="tile"><div className="v">{r.duracionMinutos} min</div><div className="l">Duración configurada</div></div>
        <div className="tile"><div className="v">{minutosDesdeSeg(r.tiempoUtilizadoSeg)}</div><div className="l">Tiempo utilizado</div></div>
        <div className="tile"><div className="v">{r.respondidos}</div><div className="l">Ejercicios resueltos</div></div>
        <div className="tile"><div className="v">{r.correctas}</div><div className="l">Correctas</div></div>
        <div className="tile"><div className="v">{r.incorrectas}</div><div className="l">Incorrectas</div></div>
        <div className="tile"><div className="v">{r.respondidos === 0 ? '—' : pct(r.porcentajeAciertos)}</div><div className="l">Aciertos</div></div>
      </div>

      {r.respondidos === 0 && <Alerta tipo="warn" style={{ marginBottom: 14 }}>{r.mensajeRecomendacion}</Alerta>}

      <div className="row">
        <div className="col card">
          <h2>Desempeño por componente</h2>
          {r.porComponente.length === 0 && <div className="note">Sin ejercicios respondidos.</div>}
          {r.porComponente.map(a => <Barra key={a.id} etiqueta={`${a.nombre} (${a.correctas}/${a.intentos})`} porcentaje={a.porcentaje} bajo={umbralBajo(a.porcentaje)} />)}
          <h2 style={{ marginTop: 16 }}>Desempeño por competencia</h2>
          {r.porCompetencia.length === 0 && <div className="note">Sin ejercicios respondidos.</div>}
          {r.porCompetencia.map(a => <Barra key={a.id} etiqueta={`${a.nombre} (${a.correctas}/${a.intentos})`} porcentaje={a.porcentaje} bajo={umbralBajo(a.porcentaje)} />)}
          {r.detalle.length > 0 && (
            <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => setVerDetalle(v => !v)}>
              {verDetalle ? 'Ocultar detalle de respuestas' : 'Ver detalle de respuestas (opción elegida, resultado, confianza y retroalimentación)'}
            </button>
          )}
        </div>
        <div className="col card">
          <h2>Recomendaciones de estudio</h2>
          <div className="note" style={{ marginBottom: 10 }}>Áreas con menos del 60 % de aciertos, de mayor a menor dificultad.</div>
          {r.recomendaciones.map(rec => (
            <div key={rec.orden} className="reco"><b>{rec.orden}. {rec.area} ({pct(rec.porcentaje)})</b><br />{rec.mensaje}</div>
          ))}
          {r.recomendaciones.length === 0 && r.respondidos > 0 && <Alerta tipo="ok">{r.mensajeRecomendacion}</Alerta>}
          {r.recomendaciones.length === 0 && r.respondidos === 0 && <div className="note">No hay recomendaciones porque no se registraron respuestas.</div>}
          <div className="row keep" style={{ marginTop: 18, flexWrap: 'wrap' }}>
            {r.recomendaciones.find(x => x.idComponente) && (
              <Link className="btn sm" to={`/banco?componente=${r.recomendaciones.find(x => x.idComponente)!.idComponente}`}>
                Practicar {r.recomendaciones.find(x => x.idComponente)!.area}
              </Link>
            )}
            <Link className="btn ghost sm" to="/simulacros">Volver a simulacros</Link>
          </div>
        </div>
      </div>

      {verDetalle && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Detalle de respuestas</h2>
          {r.detalle.map((d, i) => (
            <div key={d.id} className="card soft" style={{ marginBottom: 10 }}>
              <div className="note">{i + 1}. Ejercicio #{d.numeroEjercicio} · {d.componente} · {d.competencia} · {d.nivel} · {fechaHora(d.fechaHora)}</div>
              <p style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{d.enunciado}</p>
              {d.opciones.filter(o => o.seleccionada || o.esCorrecta).map(o => (
                <div key={o.id} className={`opt ${o.seleccionada && !o.esCorrecta ? 'wrong' : ''} ${o.esCorrecta ? 'right' : ''}`} style={{ padding: '6px 10px', cursor: 'default', marginBottom: 6 }}>
                  <div className="r" /><div>{o.letra}. {o.descripcion}{o.seleccionada && ' — tu respuesta'}{o.esCorrecta && ' — respuesta correcta'}</div>
                </div>
              ))}
              <div className="note">Resultado: <b className={d.esCorrecto ? 'txt-ok' : 'txt-bad'}>{d.esCorrecto ? 'Correcto' : 'Incorrecto'}</b> · Confianza {d.nivelConfianza}/5 · <b>Retroalimentación:</b> {d.retroalimentacion}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
