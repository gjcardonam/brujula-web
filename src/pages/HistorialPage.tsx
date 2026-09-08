import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, mensajeDe } from '../api/client'
import type { IntentoDetalle, IntentoResumen, Pagina } from '../api/types'
import { Alerta, Cargando, Paginacion, Vacio } from '../components/ui'
import { fechaHora } from '../utils/formato'

/** M-07 · Historial de ejercicios resueltos y detalle del intento (HU-025). */
export function HistorialPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const pagina = Number(params.get('pagina') ?? 0)
  const [datos, setDatos] = useState<Pagina<IntentoResumen> | null>(null)
  const [detalle, setDetalle] = useState<IntentoDetalle | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Pagina<IntentoResumen>>(`/intentos/mios?pagina=${pagina}`).then(setDatos).catch(e => setError(mensajeDe(e)))
  }, [pagina])

  useEffect(() => {
    if (!id) { setDetalle(null); return }
    api<IntentoDetalle>(`/intentos/${id}`).then(setDetalle).catch(e => setError(mensajeDe(e)))
  }, [id])

  return (
    <>
      <h1>Historial</h1>
      <div className="sub">Tus intentos, del más reciente al más antiguo. Cada intento se conserva como un registro independiente.</div>
      {error && <Alerta style={{ marginBottom: 12 }}>{error}</Alerta>}
      <div className="two">
        <div className="col card" style={{ flex: 1.35 }}>
          <h2>Intentos registrados</h2>
          {!datos && <Cargando />}
          {datos && datos.contenido.length === 0 && <Vacio>Aún no has resuelto ningún ejercicio. Ve al banco y practica tu primer ejercicio.</Vacio>}
          {datos && datos.contenido.length > 0 && (
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Ejercicio</th><th>Componente</th><th>Competencia</th><th>Nivel</th><th>Resultado</th><th>Fecha y hora</th></tr></thead>
                <tbody>
                  {datos.contenido.map(i => (
                    <tr key={i.id} className={`click ${i.estadoEjercicio === 'Desactivado' ? 'rowg' : ''} ${String(i.id) === id ? 'on' : ''}`}
                      onClick={() => navigate(`/historial/${i.id}?pagina=${pagina}`)}>
                      <td>#{i.numeroEjercicio}{i.enSimulacro && <span className="note"> · simulacro</span>}</td>
                      <td>{i.componente}</td><td>{i.competencia}</td><td>{i.nivel}</td>
                      <td className={i.estadoEjercicio === 'Desactivado' ? '' : i.esCorrecto ? 'txt-ok' : 'txt-bad'}>{i.esCorrecto ? 'Correcto' : 'Incorrecto'}</td>
                      <td>{fechaHora(i.fechaHora)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {datos && datos.contenido.some(i => i.estadoEjercicio === 'Desactivado') && (
            <div className="note" style={{ marginTop: 9 }}>Las filas grises corresponden a ejercicios que hoy están desactivados: el intento se conserva y puede consultarse, pero no permite volver a intentarlo.</div>
          )}
          {datos && <Paginacion pagina={datos.pagina} totalPaginas={datos.totalPaginas} onCambiar={p => setParams({ pagina: String(p) })} />}
        </div>
        <div className="col card">
          <h2>Detalle del intento</h2>
          {!id && <div className="note">Selecciona un intento de la lista para ver su detalle.</div>}
          {id && !detalle && <Cargando />}
          {detalle && (
            <>
              <div className="note">Ejercicio #{detalle.numeroEjercicio} · {fechaHora(detalle.fechaHora)} · {detalle.componente} · {detalle.competencia} · {detalle.nivel}</div>
              {detalle.estadoEjercicio === 'Desactivado' && <Alerta tipo="warn" style={{ marginTop: 8 }}>Este ejercicio está desactivado actualmente. Puedes consultar el intento, pero no volver a resolverlo.</Alerta>}
              <p style={{ lineHeight: 1.5, marginTop: 8, whiteSpace: 'pre-wrap' }}>{detalle.enunciado}</p>
              {detalle.imagenEnunciado && <img className="enunciado-img" src={detalle.imagenEnunciado} alt="Imagen del enunciado" />}
              {detalle.opciones.map(o => (
                <div key={o.id} className={`opt ${o.seleccionada && !o.esCorrecta ? 'wrong' : ''} ${o.esCorrecta ? 'right' : ''}`} style={{ padding: '8px 12px', cursor: 'default' }}>
                  <div className="r" />
                  <div>{o.letra}. {o.descripcion}{o.seleccionada && ' — tu respuesta'}{o.esCorrecta && ' — respuesta correcta'}
                    {o.imagen && <img src={o.imagen} alt={`Opción ${o.letra}`} />}</div>
                </div>
              ))}
              <div className="note" style={{ margin: '8px 0' }}>Resultado: <b className={detalle.esCorrecto ? 'txt-ok' : 'txt-bad'}>{detalle.esCorrecto ? 'Correcto' : 'Incorrecto'}</b> · Nivel de confianza registrado: {detalle.nivelConfianza} de 5</div>
              <div className="card" style={{ background: detalle.esCorrecto ? '#f0fdf4' : '#fef2f2', borderColor: detalle.esCorrecto ? '#86efac' : '#fca5a5', padding: '12px 14px' }}>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}><b>Retroalimentación:</b> {detalle.retroalimentacion}</div>
              </div>
              <div className="note" style={{ marginTop: 10 }}>El detalle muestra los datos tal como se registraron en su momento.</div>
              {detalle.estadoEjercicio === 'Activo' && <div style={{ marginTop: 10 }}><Link className="btn ghost sm" to={`/ejercicios/${detalle.idEjercicio}`}>Volver a intentar este ejercicio</Link></div>}
            </>
          )}
        </div>
      </div>
    </>
  )
}
