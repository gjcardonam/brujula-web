import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError, mensajeDe } from '../api/client'
import type { Catalogos, EstadoSimulacro, Pagina, ResumenSimulacro } from '../api/types'
import { Alerta, Cargando, Modal, Paginacion, Vacio } from '../components/ui'
import { fecha, minutosDesdeSeg, pct } from '../utils/formato'

/** M-08 · Configurar simulacro (HU-013) e historial de simulacros (HU-026). */
export function SimulacrosPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const pagina = Number(params.get('pagina') ?? 0)
  const [duraciones, setDuraciones] = useState<Catalogos['duraciones']>([])
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [enCurso, setEnCurso] = useState<EstadoSimulacro | null>(null)
  const [historial, setHistorial] = useState<Pagina<ResumenSimulacro> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    api<Catalogos>('/catalogos').then(c => setDuraciones(c.duraciones)).catch(e => setError(mensajeDe(e)))
    api<EstadoSimulacro | undefined>('/simulacros/en-curso').then(s => setEnCurso(s ?? null)).catch(() => setEnCurso(null))
  }, [])
  useEffect(() => {
    api<Pagina<ResumenSimulacro>>(`/simulacros/mios?pagina=${pagina}`).then(setHistorial).catch(e => setError(mensajeDe(e)))
  }, [pagina])

  const dur = duraciones.find(d => d.id === seleccion)

  async function iniciar() {
    if (!seleccion) return
    setCreando(true); setError(null)
    try {
      const s = await api<EstadoSimulacro>('/simulacros', { method: 'POST', body: { idDuracion: seleccion } })
      navigate(`/simulacros/${s.id}`)
    } catch (e) {
      if (e instanceof ApiError && e.codigo === 'SIMULACRO_EN_CURSO' && e.extra.idSimulacro) {
        navigate(`/simulacros/${e.extra.idSimulacro}`)
      } else setError(mensajeDe(e))
      setConfirmando(false)
    } finally { setCreando(false) }
  }

  return (
    <>
      <h1>Iniciar Simulacro</h1>
      <div className="sub">Selecciona la duración. Una vez iniciado, no podrás cambiarla ni reiniciar el temporizador.</div>
      {error && <Alerta style={{ marginBottom: 12 }}>{error}</Alerta>}

      {enCurso && (
        <div className="card info" style={{ marginBottom: 16 }}>
          <b>Tienes un simulacro en curso</b> de {enCurso.duracionMinutos} minutos con {enCurso.respondidos} respuestas registradas.
          <div style={{ marginTop: 10 }}><Link className="btn acc sm" to={`/simulacros/${enCurso.id}`}>Continuar simulacro</Link></div>
        </div>
      )}

      <div className="card">
        <h2>Duración del simulacro</h2>
        {duraciones.length === 0 ? <Cargando /> : (
          <div className="dur" role="radiogroup" aria-label="Duración">
            {duraciones.map(d => (
              <button key={d.id} type="button" className={`d ${seleccion === d.id ? 'on' : ''}`} role="radio" aria-checked={seleccion === d.id}
                onClick={() => setSeleccion(d.id)} disabled={!!enCurso}>{d.minutos} min</button>
            ))}
          </div>
        )}
        <div className="row keep" style={{ marginTop: 22, alignItems: 'center' }}>
          <div className="card info" style={{ flex: 1 }}>
            <b>Resumen:</b> duración seleccionada <b>{dur ? `${dur.minutos} minutos` : '—'}</b> · ejercicios de todos los componentes activos · un ejercicio a la vez, sin repetir · retroalimentación después de cada respuesta.
          </div>
        </div>
        <div className="row keep" style={{ marginTop: 22 }}>
          <button className="btn acc" disabled={!seleccion || !!enCurso} onClick={() => setConfirmando(true)}>Confirmar e iniciar</button>
          <button className="btn ghost" onClick={() => setSeleccion(null)} disabled={!seleccion}>Cancelar</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Historial de simulacros</h2>
        {!historial && <Cargando />}
        {historial && historial.contenido.length === 0 && <Vacio>Aún no has realizado ningún simulacro. Configura uno para comenzar a practicar.</Vacio>}
        {historial && historial.contenido.length > 0 && (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Duración</th><th>Tiempo usado</th><th>Respondidos</th><th>Correctas</th><th>Incorrectas</th><th>% aciertos</th><th></th></tr></thead>
              <tbody>
                {historial.contenido.map(s => (
                  <tr key={s.id}>
                    <td>{fecha(s.fechaInicio)}</td><td>{s.duracionMinutos} min</td><td>{minutosDesdeSeg(s.tiempoUtilizadoSeg)}</td>
                    <td>{s.respondidos}</td><td>{s.correctas}</td><td>{s.incorrectas}</td>
                    <td>{s.respondidos === 0 ? <span className="note">Sin resultados suficientes</span> : pct(s.porcentajeAciertos)}</td>
                    <td><Link className="btn ghost sm" to={`/simulacros/${s.id}/resultado`}>Ver resultado</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {historial && <Paginacion pagina={historial.pagina} totalPaginas={historial.totalPaginas} onCambiar={p => setParams({ pagina: String(p) })} />}
      </div>

      {confirmando && dur && (
        <Modal titulo={`¿Iniciar un simulacro de ${dur.minutos} minutos?`} onCerrar={() => setConfirmando(false)}>
          <p style={{ lineHeight: 1.5 }}>El temporizador empieza de inmediato y no puede pausarse ni reiniciarse. Al llegar a cero, el simulacro finaliza automáticamente.</p>
          <div className="row keep" style={{ marginTop: 12 }}>
            <button className="btn acc" onClick={iniciar} disabled={creando}>{creando ? 'Iniciando…' : 'Sí, iniciar'}</button>
            <button className="btn ghost" onClick={() => setConfirmando(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </>
  )
}
