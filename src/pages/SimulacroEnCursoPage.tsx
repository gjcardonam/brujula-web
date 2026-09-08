import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, mensajeDe } from '../api/client'
import type { EjercicioEstudiante, EstadoSimulacro, ResultadoIntento, SiguienteSimulacro } from '../api/types'
import { CuerpoEjercicio, Retroalimentacion } from '../components/Ejercicio'
import { Alerta, Cargando, Modal, Toast } from '../components/ui'
import { mmss } from '../utils/formato'
import { uuid } from '../utils/uuid'

/** M-09 · Simulacro en curso (HU-014, HU-015, HU-016). */
export function SimulacroEnCursoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [estado, setEstado] = useState<EstadoSimulacro | null>(null)
  const [ejercicio, setEjercicio] = useState<EjercicioEstudiante | null>(null)
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [confianza, setConfianza] = useState<number | null>(null)
  const [resultado, setResultado] = useState<ResultadoIntento | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmarFin, setConfirmarFin] = useState(false)
  const [restante, setRestante] = useState<number | null>(null)
  const [toast, setToast] = useState<{ texto: string; tipo: 'ok' | 'warn' | 'bad' } | null>(null)
  const [sinConexion, setSinConexion] = useState(!navigator.onLine)
  const token = useRef<string>(uuid())
  const offsetServidor = useRef(0)        // servidor − cliente, para que el temporizador siga la hora del servidor (HU-016 CA-03)
  const finalizando = useRef(false)
  const pendiente = useRef<{ idOpcion: number; confianza: number } | null>(null)

  const irResultado = useCallback(() => navigate(`/simulacros/${id}/resultado`, { replace: true }), [navigate, id])

  const aplicarEstado = useCallback((e: EstadoSimulacro) => {
    offsetServidor.current = new Date(e.ahora).getTime() - Date.now()
    setEstado(e)
  }, [])

  /** Pide el siguiente ejercicio; si el servidor dice que terminó, va al resultado (HU-015 CA-04). */
  const cargarSiguiente = useCallback(async () => {
    setError(null)
    try {
      const r = await api<SiguienteSimulacro>(`/simulacros/${id}/siguiente-ejercicio`)
      aplicarEstado(r.estado)
      if (r.finalizado || !r.ejercicio) { irResultado(); return }
      setEjercicio(r.ejercicio)
      setSeleccion(null); setConfianza(null); setResultado(null)
      token.current = uuid()
    } catch (e) {
      if (e instanceof ApiError && e.esRed) setSinConexion(true)
      else setError(mensajeDe(e))
    }
  }, [id, aplicarEstado, irResultado])

  useEffect(() => { void cargarSiguiente() }, [cargarSiguiente])

  // Temporizador (HU-013 CA-05, HU-014 CA-02): calcula el restante con el fin previsto por el servidor.
  useEffect(() => {
    if (!estado) return
    const fin = new Date(estado.finPrevisto).getTime()
    const tick = () => {
      const ahora = Date.now() + offsetServidor.current
      const seg = Math.max(0, Math.floor((fin - ahora) / 1000))
      setRestante(seg)
      if (seg <= 0 && !finalizando.current) {
        finalizando.current = true
        // HU-015 CA-01: al llegar a cero, el servidor finaliza y redirige al resultado.
        api<EstadoSimulacro>(`/simulacros/${id}`).then(() => irResultado()).catch(() => { finalizando.current = false })
      }
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [estado, id, irResultado])

  // Conexión (HU-016 CA-04): aviso al perder y al recuperar; al recuperar se reenvía el intento pendiente.
  useEffect(() => {
    const off = () => { setSinConexion(true); setToast({ texto: 'Se perdió la conexión. Tus respuestas confirmadas están a salvo; el tiempo sigue corriendo.', tipo: 'warn' }) }
    const on = () => {
      setSinConexion(false)
      setToast({ texto: 'Conexión restablecida. Tus respuestas confirmadas se conservaron, sin duplicados.', tipo: 'ok' })
      if (pendiente.current) void enviar(pendiente.current.idOpcion, pendiente.current.confianza)
      else if (!ejercicio) void cargarSiguiente()
    }
    window.addEventListener('offline', off)
    window.addEventListener('online', on)
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ejercicio, cargarSiguiente])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  async function enviar(idOpcion: number, nivel: number) {
    if (!ejercicio) return
    setEnviando(true); setError(null)
    try {
      const r = await api<ResultadoIntento>('/intentos', { method: 'POST', body: {
        idEjercicio: ejercicio.id, idOpcion, nivelConfianza: nivel, tokenIdempotencia: token.current, idSimulacro: Number(id),
      } })
      pendiente.current = null
      setResultado(r)
      setEstado(s => s ? { ...s, respondidos: r.repetido ? s.respondidos : s.respondidos + 1, correctas: s.correctas + (r.esCorrecto && !r.repetido ? 1 : 0) } : s)
    } catch (e) {
      if (e instanceof ApiError && e.esRed) {
        pendiente.current = { idOpcion, confianza: nivel }                                      // HU-016 CA-01/CA-02
        setSinConexion(true)
        setToast({ texto: 'Sin conexión: la respuesta se enviará automáticamente cuando vuelva la red.', tipo: 'warn' })
      } else if (e instanceof ApiError && (e.codigo === 'SIMULACRO_FINALIZADO')) {
        irResultado()
      } else if (e instanceof ApiError && e.codigo === 'EJERCICIO_YA_RESPONDIDO') {
        void cargarSiguiente()
      } else setError(mensajeDe(e))
    } finally { setEnviando(false) }
  }

  async function finalizar() {
    setConfirmarFin(false)
    try {
      await api(`/simulacros/${id}/finalizar`, { method: 'POST' })                                   // HU-015 CA-02
      irResultado()
    } catch (e) { setError(mensajeDe(e)) }
  }

  const progresoTiempo = estado && restante !== null ? Math.min(100, 100 * (1 - restante / (estado.duracionMinutos * 60))) : 0

  return (
    <>
      <div className="row keep center" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="steps">Simulacro · {estado?.duracionMinutos ?? '—'} min · respondidos {estado?.respondidos ?? 0}</div>
        <div className="sp" />
        <div className={`timer ${restante !== null && restante < 300 ? 'low' : ''}`} aria-live="polite">⏱ Tiempo restante {restante === null ? '--:--' : mmss(restante)}</div>
        <button className="btn danger sm" onClick={() => setConfirmarFin(true)}>Finalizar simulacro</button>
      </div>
      {sinConexion && <Alerta tipo="warn" style={{ marginBottom: 12 }}>Sin conexión con el servidor. El temporizador sigue corriendo; tus respuestas confirmadas se conservan.</Alerta>}
      {error && <Alerta style={{ marginBottom: 12 }}>{error}</Alerta>}

      <div className="row">
        <div className="col card" style={{ flex: 1.3 }}>
          {!ejercicio ? <Cargando texto="Preparando el siguiente ejercicio…" /> : (
            <>
              <CuerpoEjercicio
                ejercicio={ejercicio} seleccion={seleccion} confianza={confianza} resultado={resultado}
                onSeleccionar={setSeleccion} onConfianza={setConfianza}
                onConfirmar={() => { if (seleccion !== null && confianza !== null) void enviar(seleccion, confianza) }}
                enviando={enviando || !!pendiente.current}
                encabezado={<h2 style={{ marginTop: 4 }}>{ejercicio.componente.nombre} · {ejercicio.competencia.nombre} · {ejercicio.nivel}</h2>}
              />
              {resultado && (
                <div className="row keep" style={{ marginTop: 16 }}>
                  <button className="btn" onClick={() => void cargarSiguiente()}>Siguiente ejercicio</button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="col">
          {resultado && <div style={{ marginBottom: 14 }}><Retroalimentacion resultado={resultado} /></div>}
          <div className="card">
            <h2>Progreso del simulacro</h2>
            <div className="bar"><div className="lbl">Tiempo</div><div className="trk"><div className="fil" style={{ width: `${progresoTiempo}%` }} /></div><div className="pct">{estado ? `${Math.floor(((estado.duracionMinutos * 60) - (restante ?? 0)) / 60)} min` : '—'}</div></div>
            <div className="bar"><div className="lbl">Respondidos</div><div className="trk"><div className="fil" style={{ width: estado && estado.respondidos > 0 ? '100%' : '0%' }} /></div><div className="pct">{estado?.respondidos ?? 0}</div></div>
            <div className="note" style={{ marginTop: 8 }}>Después de confirmar verás la retroalimentación y el botón "Siguiente ejercicio". Al llegar el tiempo a cero el simulacro finaliza automáticamente; una opción seleccionada sin confirmar no se registra.</div>
          </div>
        </div>
      </div>

      {confirmarFin && (
        <Modal titulo="¿Finalizar simulacro?" onCerrar={() => setConfirmarFin(false)}>
          <p className="note" style={{ fontSize: 14 }}>Se conservarán las {estado?.respondidos ?? 0} respuestas confirmadas. No podrás registrar más respuestas.</p>
          <div className="row keep" style={{ marginTop: 12 }}>
            <button className="btn danger sm" onClick={finalizar}>Sí, finalizar</button>
            <button className="btn ghost sm" onClick={() => setConfirmarFin(false)}>Continuar</button>
          </div>
        </Modal>
      )}
      {toast && <Toast texto={toast.texto} tipo={toast.tipo} />}
    </>
  )
}
