import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError, mensajeDe } from '../api/client'
import type { EjercicioEstudiante, ResultadoIntento } from '../api/types'
import { CuerpoEjercicio, Retroalimentacion } from '../components/Ejercicio'
import { Alerta, Cargando } from '../components/ui'
import { fechaHora } from '../utils/formato'

/** M-06 · Resolver un ejercicio en práctica libre (HU-009, HU-010, HU-011, HU-012). */
export function EjercicioPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const componente = params.get('componente') ? Number(params.get('componente')) : null   // HU-009 CA-04
  const navigate = useNavigate()

  const [ejercicio, setEjercicio] = useState<EjercicioEstudiante | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [noDisponible, setNoDisponible] = useState(false)
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [confianza, setConfianza] = useState<number | null>(null)
  const [resultado, setResultado] = useState<ResultadoIntento | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [token, setToken] = useState(() => crypto.randomUUID())
  const [finFiltro, setFinFiltro] = useState<string | null>(null)

  const cargar = useCallback(() => {
    setEjercicio(null); setError(null); setNoDisponible(false)
    setSeleccion(null); setConfianza(null); setResultado(null); setFinFiltro(null)
    setToken(crypto.randomUUID())
    api<EjercicioEstudiante>(`/ejercicios/${id}`)
      .then(setEjercicio)
      .catch(e => { if (e instanceof ApiError && e.estado === 410) setNoDisponible(true); else setError(mensajeDe(e)) })
  }, [id])
  useEffect(cargar, [cargar])

  async function confirmar() {
    if (!ejercicio || seleccion === null || confianza === null) return
    setEnviando(true); setError(null)
    try {
      const r = await api<ResultadoIntento>('/intentos', { method: 'POST', body: {
        idEjercicio: ejercicio.id, idOpcion: seleccion, nivelConfianza: confianza, tokenIdempotencia: token,
      } })
      setResultado(r)
    } catch (e) {
      if (e instanceof ApiError && e.estado === 410) setNoDisponible(true)                  // HU-010 CA-10
      else setError(mensajeDe(e))
    } finally { setEnviando(false) }
  }

  async function siguiente() {                                                                // HU-010 CA-07/CA-08/CA-09
    if (!ejercicio) return
    try {
      const r = await api<{ hayMas: boolean; idEjercicio?: number; mensaje?: string }>(`/ejercicios/${ejercicio.id}/siguiente${componente ? `?componente=${componente}` : ''}`)
      if (r.hayMas && r.idEjercicio) navigate(`/ejercicios/${r.idEjercicio}${componente ? `?componente=${componente}` : ''}`)
      else setFinFiltro(r.mensaje ?? 'No hay más ejercicios disponibles.')
    } catch (e) { setError(mensajeDe(e)) }
  }

  const volver = `/banco${componente ? `?componente=${componente}` : ''}`

  if (noDisponible) {
    return (
      <div className="card" style={{ maxWidth: 600 }}>
        <h2>Este ejercicio ya no está disponible</h2>
        <p>Fue desactivado por el administrador. Elige otro ejercicio del banco.</p>
        <Link className="btn" to={volver}>Volver al banco</Link>
      </div>
    )
  }
  if (error && !ejercicio) return <Alerta>{error}</Alerta>
  if (!ejercicio) return <Cargando texto="Cargando ejercicio…" />

  return (
    <div className="row">
      <div className="col card" style={{ flex: 1.25 }}>
        <CuerpoEjercicio
          ejercicio={ejercicio} seleccion={seleccion} confianza={confianza} resultado={resultado}
          onSeleccionar={setSeleccion} onConfianza={setConfianza} onConfirmar={confirmar} enviando={enviando}
          encabezado={
            <>
              <div className="steps">Banco › {ejercicio.componente.nombre} › Ejercicio #{ejercicio.numero}</div>
              <h2 style={{ marginTop: 8 }}>Ejercicio #{ejercicio.numero} · {ejercicio.competencia.nombre} · {ejercicio.nivel}</h2>
            </>
          }
        />
        {error && <Alerta style={{ marginTop: 12 }}>{error}</Alerta>}
        {resultado && (
          <div className="row keep" style={{ marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn sec" onClick={siguiente}>Siguiente Ejercicio</button>
            <button className="btn ghost" onClick={cargar}>Intentar de nuevo</button>
            <Link className="btn ghost" to={volver}>Volver al banco</Link>
          </div>
        )}
        {!resultado && (
          <div className="row keep" style={{ marginTop: 10 }}><Link className="btn ghost sm" to={volver}>Volver al banco</Link></div>
        )}
        {finFiltro && <Alerta tipo="warn" style={{ marginTop: 12 }}>{finFiltro}</Alerta>}
      </div>
      <div className="col">
        {resultado ? (
          <>
            <Retroalimentacion resultado={resultado} />
            <div className="card" style={{ marginTop: 14 }}>
              <h2>Tu intento quedó registrado</h2>
              <div className="note">{fechaHora(resultado.fechaHora)} · Confianza: {resultado.nivelConfianza}/5 · Intento {resultado.numeroIntento} de este ejercicio.</div>
            </div>
          </>
        ) : (
          <div className="card soft">
            <div className="note">
              <b>Cómo funciona:</b> elige una opción y tu nivel de confianza; el botón "Confirmar Respuesta" se habilita cuando ambos estén seleccionados.
              Después verás si acertaste y por qué. {ejercicio.intentosPrevios > 0 && <>Ya has intentado este ejercicio {ejercicio.intentosPrevios} {ejercicio.intentosPrevios === 1 ? 'vez' : 'veces'}.</>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
