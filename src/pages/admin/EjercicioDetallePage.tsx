import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api, mensajeDe } from '../../api/client'
import type { EjercicioAdmin } from '../../api/types'
import { Alerta, Barra, Cargando, Modal, Toast } from '../../components/ui'
import { fecha, pct } from '../../utils/formato'

/** M-14 · Detalle administrativo de un ejercicio (HU-022) con activar/desactivar (HU-023, HU-024). */
export function EjercicioDetallePage() {
  const { id } = useParams()
  const loc = useLocation()
  const [e, setE] = useState<EjercicioAdmin | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const [toast, setToast] = useState<string | null>((loc.state as { aviso?: string } | null)?.aviso ?? null)
  const [procesando, setProcesando] = useState(false)

  useEffect(() => { api<EjercicioAdmin>(`/ejercicios/${id}`).then(setE).catch(err => setError(mensajeDe(err))) }, [id])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  async function cambiarEstado() {
    if (!e) return
    const nuevo = e.estado === 'Activo' ? 'Desactivado' : 'Activo'
    setProcesando(true)
    try {
      const r = await api<EjercicioAdmin>(`/ejercicios/${e.id}/estado`, { method: 'PATCH', body: { estado: nuevo } })
      setE(r); setConfirmar(false)
      setToast(nuevo === 'Activo' ? 'El ejercicio fue activado exitosamente.' : 'El ejercicio fue desactivado exitosamente.')
    } catch (err) { setError(mensajeDe(err)); setConfirmar(false) } finally { setProcesando(false) }
  }

  if (error) return <Alerta>{error}</Alerta>
  if (!e) return <Cargando />
  const activo = e.estado === 'Activo'

  return (
    <>
      <div className="steps">Banco de ejercicios › Ejercicio #{e.numero} › Detalle</div>
      <h1 style={{ marginTop: 6 }}>Ejercicio #{e.numero} <span className={`pill ${activo ? '' : 'off'}`} style={{ fontSize: 13, verticalAlign: 'middle' }}>{e.estado}</span></h1>
      <div className="two">
        <div className="col card" style={{ flex: 1.3 }}>
          <h2>Contenido</h2>
          <p style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{e.enunciado}</p>
          {e.imagenEnunciado && <img className="enunciado-img" src={e.imagenEnunciado} alt="Imagen del enunciado" />}
          <div className="tbl-wrap">
            <table>
              <thead><tr><th style={{ width: 34 }}>✓</th><th>Opción</th><th>Retroalimentación</th><th>Tipo de error</th></tr></thead>
              <tbody>
                {e.opciones.map(o => (
                  <tr key={o.id} style={{ background: o.esCorrecta ? '#f0fdf4' : undefined }}>
                    <td>{o.esCorrecta ? '●' : '○'}</td>
                    <td>{o.letra}. {o.descripcion}{o.imagen && <div><img src={o.imagen} alt={`Opción ${o.letra}`} style={{ maxHeight: 80, marginTop: 4, borderRadius: 4 }} /></div>}</td>
                    <td>{o.retroalimentacion}</td>
                    <td>{o.esCorrecta ? '—' : (o.tipoError?.nombre.replace('Error ', '').replace('de ', '') ?? 'Sin clasificar')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row keep" style={{ marginTop: 14, flexWrap: 'wrap' }}>
            <Link className="btn ghost sm" to={`/admin/ejercicios/${e.id}/editar`}>Editar</Link>
            {activo ? <button className="btn danger sm" onClick={() => setConfirmar(true)}>Desactivar</button>
              : <button className="btn sm" onClick={() => setConfirmar(true)}>Activar</button>}
            <Link className="btn ghost sm" to="/admin/banco">Volver al banco</Link>
          </div>
        </div>
        <div className="col">
          <div className="card">
            <h2>Información administrativa</h2>
            <table>
              <tbody>
                <tr><td>Componente</td><td>{e.componente.nombre}</td></tr>
                <tr><td>Competencia</td><td>{e.competencia.nombre}</td></tr>
                <tr><td>Nivel</td><td>{e.nivel.nombre}</td></tr>
                <tr><td>Estado</td><td>{e.estado}</td></tr>
                <tr><td>Creado por</td><td>{e.creadoPor}</td></tr>
                <tr><td>Fecha de creación</td><td>{fecha(e.creadoEn)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <h2>Desempeño histórico</h2>
            <div className="tiles" style={{ marginBottom: 10 }}>
              <div className="tile"><div className="v">{e.uso.intentos}</div><div className="l">Intentos</div></div>
              <div className="tile"><div className="v">{e.uso.intentos === 0 ? '—' : pct(e.uso.porcentajeAciertos)}</div><div className="l">Aciertos</div></div>
            </div>
            {e.uso.errores.length === 0 ? <div className="note">Aún no hay intentos incorrectos clasificados.</div> :
              e.uso.errores.map(d => <Barra key={d.tipo} etiqueta={d.tipo.replace('Error ', '').replace('de ', '')} porcentaje={d.porcentaje} />)}
            <div className="note" style={{ marginTop: 8 }}>Consultar el detalle no modifica el ejercicio ni sus intentos.</div>
          </div>
        </div>
      </div>

      {confirmar && (
        <Modal titulo={activo ? `¿Desactivar el ejercicio #${e.numero}?` : `¿Activar el ejercicio #${e.numero}?`} onCerrar={() => setConfirmar(false)}>
          <p className="note" style={{ fontSize: 14 }}>{activo ? `Dejará de estar disponible para los estudiantes. No se elimina ni se pierden sus ${e.uso.intentos} intentos.` : 'Volverá a estar disponible para los estudiantes en el banco y en los filtros.'}</p>
          <div className="row keep" style={{ marginTop: 12 }}>
            <button className={`btn sm ${activo ? 'danger' : ''}`} onClick={cambiarEstado} disabled={procesando}>{activo ? 'Desactivar' : 'Activar'}</button>
            <button className="btn ghost sm" onClick={() => setConfirmar(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
      {toast && <Toast texto={toast} />}
    </>
  )
}
