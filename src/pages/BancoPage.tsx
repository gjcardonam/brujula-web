import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, mensajeDe } from '../api/client'
import type { Componentes, EjercicioAdmin, Pagina, Tarjeta } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Alerta, Cargando, Modal, Paginacion, Toast, Vacio } from '../components/ui'

/** M-05 (estudiante) y M-12 (administrador) · Banco de ejercicios (HU-006, HU-007, HU-008, HU-009, HU-023, HU-024). */
export function BancoPage() {
  const { esAdmin } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const componente = params.get('componente') ? Number(params.get('componente')) : null
  const pagina = Number(params.get('pagina') ?? 0)

  const [componentes, setComponentes] = useState<Componentes | null>(null)
  const [datos, setDatos] = useState<Pagina<Tarjeta> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [confirmar, setConfirmar] = useState<Tarjeta | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    api<Componentes>('/ejercicios/componentes').then(setComponentes).catch(e => setError(mensajeDe(e)))
  }, [datos])

  useEffect(() => {
    let vivo = true
    setCargando(true)
    const q = new URLSearchParams()
    if (componente) q.set('componente', String(componente))
    q.set('pagina', String(pagina))
    api<Pagina<Tarjeta>>(`/ejercicios?${q}`)
      .then(d => { if (vivo) { setDatos(d); setError(null) } })
      .catch(e => { if (vivo) setError(mensajeDe(e)) })
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [componente, pagina])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function filtrar(id: number | null) {                                                  // HU-007 CA-09, HU-008 CA-04
    const q = new URLSearchParams()
    if (id) q.set('componente', String(id))
    q.set('pagina', '0')
    setParams(q)
  }
  function irPagina(p: number) {                                                          // HU-008 CA-03
    const q = new URLSearchParams(params)
    q.set('pagina', String(p))
    setParams(q)
  }

  async function cambiarEstado(t: Tarjeta) {
    const nuevo = t.estado === 'Activo' ? 'Desactivado' : 'Activo'
    setProcesando(true)
    try {
      await api<EjercicioAdmin>(`/ejercicios/${t.id}/estado`, { method: 'PATCH', body: { estado: nuevo } })
      setToast(nuevo === 'Activo' ? `El ejercicio #${t.numero} fue activado exitosamente.` : `El ejercicio #${t.numero} fue desactivado exitosamente.`)
      setConfirmar(null)
      setDatos(d => d ? { ...d, contenido: d.contenido.map(x => x.id === t.id ? { ...x, estado: nuevo } : x) } : d)
    } catch (e) { setError(mensajeDe(e)); setConfirmar(null) } finally { setProcesando(false) }
  }

  const nombreComponente = componentes?.componentes.find(c => c.id === componente)?.nombre
  const vacio = datos && datos.contenido.length === 0

  return (
    <>
      <div className="row keep center" style={{ marginBottom: 6 }}>
        <h1 style={{ flex: 1 }}>Banco de ejercicios</h1>
        {esAdmin && <Link className="btn acc" to="/admin/ejercicios/nuevo">+ Crear Ejercicio</Link>}
      </div>
      <div className="sub">{esAdmin ? 'Consulta, crea, edita, activa o desactiva los ejercicios del banco.' : 'Filtra por componente y elige un ejercicio para practicar.'}</div>

      {componentes && (
        <div className="chips" role="group" aria-label="Filtrar por componente">
          <button className={`chip ${componente === null ? 'on' : ''}`} onClick={() => filtrar(null)}>Todos ({componentes.total})</button>
          {componentes.componentes.map(c => (
            <button key={c.id} className={`chip ${componente === c.id ? 'on' : ''}`} onClick={() => filtrar(c.id)}>{c.nombre} ({c.cantidad})</button>
          ))}
        </div>
      )}

      {error && <Alerta style={{ marginBottom: 12 }}>{error}</Alerta>}
      {cargando && !datos && <Cargando />}

      {vacio && (
        <Vacio>
          {componente
            ? `Aún no hay ejercicios disponibles para este componente${nombreComponente ? ` (${nombreComponente})` : ''}.`
            : esAdmin ? 'Aún no hay ejercicios registrados' : 'Aún no hay ejercicios disponibles'}
        </Vacio>
      )}

      {datos && datos.contenido.length > 0 && (
        <div className="grid" style={{ opacity: cargando ? .6 : 1 }}>
          {datos.contenido.map(t => (
            <article key={t.id} className={`ex ${t.estado === 'Desactivado' ? 'off' : ''}`}>
              <div className="n">
                <span>Ejercicio #{t.numero}</span>
                {esAdmin && <span className={`pill ${t.estado === 'Desactivado' ? 'off' : ''}`}>{t.estado}</span>}
              </div>
              <div className="m">
                {esAdmin ? (
                  <>{t.componente} · {t.competencia} · {t.nivel}<br />Intentos registrados: {t.intentos ?? 0}</>
                ) : (
                  <>Componente: {t.componente}<br />Competencia: {t.competencia}<br />Nivel: {t.nivel}</>
                )}
              </div>
              <div className="a">
                {esAdmin ? (
                  <>
                    <Link className="btn ghost sm" to={`/admin/ejercicios/${t.id}/editar`}>Editar</Link>
                    <Link className="btn ghost sm" to={`/admin/ejercicios/${t.id}`}>Ver más</Link>
                    {t.estado === 'Activo'
                      ? <button className="btn danger sm" onClick={() => setConfirmar(t)}>Desactivar</button>
                      : <button className="btn sm" onClick={() => setConfirmar(t)}>Activar</button>}
                  </>
                ) : (
                  <button className="btn sm" onClick={() => navigate(`/ejercicios/${t.id}${componente ? `?componente=${componente}` : ''}`)}>Resolver</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {datos && (
        <div style={{ marginTop: 'auto' }}>
          <Paginacion pagina={datos.pagina} totalPaginas={datos.totalPaginas} onCambiar={irPagina} />
          {datos.totalElementos > 0 && <div className="note" style={{ textAlign: 'center', marginTop: 8 }}>
            Mostrando {datos.contenido.length} de {datos.totalElementos} ejercicios · máximo {datos.tamano} tarjetas por página
          </div>}
        </div>
      )}

      {confirmar && (
        <Modal titulo={confirmar.estado === 'Activo' ? `¿Desactivar el ejercicio #${confirmar.numero}?` : `¿Activar el ejercicio #${confirmar.numero}?`} onCerrar={() => setConfirmar(null)}>
          <p className="note" style={{ fontSize: 14 }}>
            {confirmar.estado === 'Activo'
              ? <>Dejará de estar disponible para los estudiantes. No se elimina ni se pierden sus {confirmar.intentos ?? 0} intentos.</>
              : <>Volverá a estar disponible para los estudiantes en el banco y en los filtros.</>}
          </p>
          <div className="row keep" style={{ marginTop: 12 }}>
            <button className={`btn sm ${confirmar.estado === 'Activo' ? 'danger' : ''}`} disabled={procesando} onClick={() => cambiarEstado(confirmar)}>
              {confirmar.estado === 'Activo' ? 'Desactivar' : 'Activar'}
            </button>
            <button className="btn ghost sm" onClick={() => setConfirmar(null)}>Cancelar</button>
          </div>
        </Modal>
      )}
      {toast && <Toast texto={toast} />}
    </>
  )
}
