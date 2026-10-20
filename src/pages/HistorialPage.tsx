import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { cn } from 'cn'
import { api, mensajeDe, urlDeArchivo } from '@/api/client'
import type { IntentoDetalle, IntentoResumen, Pagina } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Paginacion } from '@/components/Paginacion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fechaHora } from '@/utils/formato'

function EsqueletoDeLista() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14 w-full rounded-ficha" />)}
    </div>
  )
}

function EsqueletoDeDetalle() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-56" />
      <Skeleton className="h-20 w-full rounded-control" />
      <Skeleton className="h-12 w-full rounded-ficha" />
      <Skeleton className="h-12 w-full rounded-ficha" />
    </div>
  )
}

export function HistorialPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const pagina = Number(params.get('pagina') ?? 0)

  const [datos, setDatos] = useState<Pagina<IntentoResumen> | null>(null)
  const [cargandoLista, setCargandoLista] = useState(true)
  const [detalle, setDetalle] = useState<IntentoDetalle | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refDetalle = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!detalle) return
    if (window.matchMedia('(min-width: 1024px)').matches) {
      refDetalle.current?.scrollTo({ top: 0 })
      return
    }
    refDetalle.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    refDetalle.current?.focus({ preventScroll: true })
  }, [detalle])

  useEffect(() => {
    let vivo = true
    setCargandoLista(true)
    api<Pagina<IntentoResumen>>(`/intentos/mios?pagina=${pagina}`)
      .then(d => { if (vivo) { setDatos(d); setError(null) } })
      .catch(e => { if (vivo) { setDatos(null); setError(mensajeDe(e)) } })
      .finally(() => { if (vivo) setCargandoLista(false) })
    return () => { vivo = false }
  }, [pagina])

  useEffect(() => {
    if (!id) { setDetalle(null); return }
    let vivo = true
    setCargandoDetalle(true)
    api<IntentoDetalle>(`/intentos/${id}`)
      .then(d => { if (vivo) setDetalle(d) })
      .catch(e => { if (vivo) { setDetalle(null); setError(mensajeDe(e)) } })
      .finally(() => { if (vivo) setCargandoDetalle(false) })
    return () => { vivo = false }
  }, [id])

  const hayDesactivados = Boolean(datos?.contenido.some(i => i.estadoEjercicio === 'Desactivado'))

  return (
    <div className="animate-entrar space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-marino-800 sm:text-3xl">Historial</h1>
        <p className="mt-1.5 text-base text-texto-suave">
          Tus intentos, del más reciente al más antiguo. Cada intento se conserva como un registro independiente.
        </p>
      </header>

      {error && <Aviso>{error}</Aviso>}

      <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section className="panel min-w-0 space-y-5 p-6 sm:p-7">
          <h2 className="text-xl font-bold text-marino-800">Intentos registrados</h2>

          <div aria-busy={cargandoLista} aria-live="polite">
            {cargandoLista && (
              <>
                <span className="sr-only">Cargando tus intentos</span>
                <EsqueletoDeLista />
              </>
            )}

            {!cargandoLista && datos && datos.contenido.length === 0 && (
              <EstadoVacio
                titulo="Aún no has resuelto ningún ejercicio"
                descripcion="Ve al banco y practica tu primer ejercicio: aquí quedará registrado con todo su detalle."
                accion={<Button asChild variant="acento"><Link to="/banco">Ir al banco</Link></Button>}
              />
            )}

            {!cargandoLista && datos && datos.contenido.length > 0 && (
              <>
              <ul className="divide-y divide-borde border-y border-borde sm:hidden">
                {datos.contenido.map(i => {
                  const seleccionado = String(i.id) === id
                  const desactivado = i.estadoEjercicio === 'Desactivado'
                  return (
                    <li key={i.id}>
                      <Link
                        to={`/historial/${i.id}?pagina=${pagina}`}
                        aria-current={seleccionado ? 'true' : undefined}
                        className={cn(
                          'block px-1 py-3 transition-colors hover:bg-hueso',
                          desactivado && 'bg-hueso',
                          seleccionado && 'bg-marino-50',
                        )}
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-bold text-marino-800">Ejercicio #{i.numeroEjercicio}</span>
                          <span className={cn('text-sm font-bold', desactivado ? 'text-texto-suave' : i.esCorrecto ? 'text-exito-700' : 'text-error-700')}>
                            {i.esCorrecto ? 'Correcto' : 'Incorrecto'}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm text-texto-suave">
                          {i.componente} · {i.competencia} · {i.nivel}
                        </span>
                        <span className="mt-0.5 block text-xs text-texto-suave">{fechaHora(i.fechaHora)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-borde-fuerte text-xs font-bold tracking-wide text-texto-suave uppercase">
                      <th scope="col" className="py-2.5 pr-3">Ejercicio</th>
                      <th scope="col" className="py-2.5 pr-3">Componente</th>
                      <th scope="col" className="py-2.5 pr-3">Competencia</th>
                      <th scope="col" className="py-2.5 pr-3">Nivel</th>
                      <th scope="col" className="py-2.5 pr-3">Resultado</th>
                      <th scope="col" className="py-2.5 pr-3">Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.contenido.map(i => {
                      const seleccionado = String(i.id) === id
                      const desactivado = i.estadoEjercicio === 'Desactivado'
                      return (
                        <tr
                          key={i.id}
                          onClick={() => navigate(`/historial/${i.id}?pagina=${pagina}`)}
                          className={cn(
                            'cursor-pointer border-b border-borde transition-colors hover:bg-hueso',
                            desactivado && 'bg-hueso',
                            seleccionado && 'bg-marino-50',
                          )}
                        >
                          <td className="py-3 pr-3 font-bold text-marino-800">#{i.numeroEjercicio}</td>
                          <td className="py-3 pr-3 text-texto-suave">{i.componente}</td>
                          <td className="py-3 pr-3 text-texto-suave">{i.competencia}</td>
                          <td className="py-3 pr-3 text-texto-suave">{i.nivel}</td>
                          <td className="py-3 pr-3">
                            <span className={cn('font-bold', desactivado ? 'text-texto-suave' : i.esCorrecto ? 'text-exito-700' : 'text-error-700')}>
                              {i.esCorrecto ? 'Correcto' : 'Incorrecto'}
                            </span>
                          </td>
                          <td className="py-3 text-texto-suave">{fechaHora(i.fechaHora)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>

          {hayDesactivados && (
            <p className="text-xs text-texto-suave">
              Las filas grises corresponden a ejercicios que hoy están desactivados: el intento se conserva y puede
              consultarse, pero no permite volver a intentarlo.
            </p>
          )}

          {!cargandoLista && datos && datos.totalPaginas > 1 && (
            <Paginacion
              pagina={datos.pagina}
              totalPaginas={datos.totalPaginas}
              onCambiar={p => setParams({ pagina: String(p) })}
            />
          )}
        </section>

        <section ref={refDetalle} tabIndex={-1} className="panel min-w-0 scroll-mt-24 space-y-5 p-6 outline-none sm:p-7 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
          <h2 className="text-xl font-bold text-marino-800">Detalle del intento</h2>

          {!id && <p className="text-sm text-texto-suave">Selecciona un intento de la lista para ver su detalle.</p>}

          {id && cargandoDetalle && <EsqueletoDeDetalle />}

          {id && !cargandoDetalle && detalle && (
            <div className="space-y-4">
              <p className="text-sm text-texto-suave">
                Ejercicio #{detalle.numeroEjercicio} · {fechaHora(detalle.fechaHora)} · {detalle.componente} ·{' '}
                {detalle.competencia} · {detalle.nivel}
              </p>

              {detalle.estadoEjercicio === 'Activo' && (
                <Button asChild variant="contorno" size="sm">
                  <Link to={`/ejercicios/${detalle.idEjercicio}`}>Volver a intentar este ejercicio</Link>
                </Button>
              )}

              {detalle.estadoEjercicio === 'Desactivado' && (
                <Aviso tono="informacion">
                  Este ejercicio está desactivado actualmente. Puedes consultar el intento, pero no volver a resolverlo.
                </Aviso>
              )}

              <p className="text-md leading-relaxed whitespace-pre-wrap text-marino-800">{detalle.enunciado}</p>
              {detalle.imagenEnunciado && (
                <img src={urlDeArchivo(detalle.imagenEnunciado)} alt="Imagen del enunciado" className="max-h-64 rounded-ficha border border-borde" />
              )}

              <ul className="space-y-2">
                {detalle.opciones.map(o => (
                  <li
                    key={o.id}
                    className={cn(
                      'flex items-start gap-3 rounded-ficha border-2 px-3.5 py-2.5 text-sm',
                      o.esCorrecta ? 'border-exito-200 bg-exito-50' : o.seleccionada ? 'border-error-200 bg-error-50' : 'border-borde bg-superficie',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-ficha text-xs font-bold',
                        o.esCorrecta ? 'bg-exito-600 text-white' : o.seleccionada ? 'bg-error-600 text-white' : 'bg-hueso text-texto-suave',
                      )}
                    >
                      {o.letra}
                    </span>
                    <div className="min-w-0">
                      <span className="text-marino-800">{o.descripcion}</span>
                      {o.seleccionada && <span className="ml-1 font-bold text-texto-suave">— tu respuesta</span>}
                      {o.esCorrecta && <span className="ml-1 font-bold text-exito-700">— respuesta correcta</span>}
                      {o.imagen && <img src={urlDeArchivo(o.imagen)} alt={`Opción ${o.letra}`} className="mt-2 max-h-20 rounded-ficha border border-borde" />}
                    </div>
                  </li>
                ))}
              </ul>

              <p className="text-sm text-texto-suave">
                Resultado:{' '}
                <span className={cn('inline-flex items-center gap-1 font-bold', detalle.esCorrecto ? 'text-exito-700' : 'text-error-700')}>
                  {detalle.esCorrecto ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
                  {detalle.esCorrecto ? 'Correcto' : 'Incorrecto'}
                </span>{' '}
                · Nivel de confianza registrado: {detalle.nivelConfianza} de 5
              </p>

              <div
                className={cn(
                  'rounded-control border-2 px-4 py-3.5 text-sm leading-relaxed',
                  detalle.esCorrecto ? 'border-exito-200 bg-exito-50 text-exito-900' : 'border-error-200 bg-error-50 text-error-900',
                )}
              >
                <b>Retroalimentación:</b> {detalle.retroalimentacion}
                {!detalle.esCorrecto && <p className="mt-2"><b>Tipo de error:</b> {detalle.tipoError ?? "Sin clasificación registrada"}</p>}
              </div>

              <p className="text-xs text-texto-suave">El detalle muestra los datos tal como se registraron en su momento.</p>

            </div>
          )}
        </section>
      </div>
    </div>
  )
}
