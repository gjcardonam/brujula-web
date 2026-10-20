import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { cn } from 'cn'
import { api, mensajeDe, urlDeArchivo } from '@/api/client'
import type { IntentoDetalle, IntentoResumen, OpcionRevisada, Pagina } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { IconoComponente, tonoDeComponente } from '@/components/Componente'
import { EstadoVacio } from '@/components/EstadoVacio'
import { FranjaDeCorreccion } from '@/components/FranjaDeCorreccion'
import { cajaDeOpcion, ContenidoDeOpcion, estiloOpcion, type EstadoOpcion } from '@/components/Opciones'
import { Paginacion } from '@/components/Paginacion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fechaHora } from '@/utils/formato'

function estadoOpcion(o: OpcionRevisada): EstadoOpcion {
  if (o.esCorrecta) return 'correcta'
  if (o.seleccionada) return 'incorrecta'
  return 'descartada'
}

function PildoraComponente({ nombre, className }: { nombre: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap', tonoDeComponente(nombre).pildora, className)}>
      <IconoComponente nombre={nombre} className="size-[13px]" />
      {nombre}
    </span>
  )
}

function Resultado({ correcto, desactivado }: { correcto: boolean; desactivado: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap',
        desactivado ? 'bg-marino-100 text-texto-suave' : correcto ? 'bg-exito-50 text-exito-700' : 'bg-error-50 text-error-700',
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', desactivado ? 'bg-texto-tenue' : correcto ? 'bg-exito-600' : 'bg-error-600')} />
      {correcto ? 'Correcto' : 'Incorrecto'}
    </span>
  )
}

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
      <Skeleton className="h-[82px] w-full rounded-tarjeta" />
      <Skeleton className="h-[82px] w-full rounded-tarjeta" />
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
                          'block rounded-ficha px-2 py-3 transition-colors hover:bg-hueso',
                          desactivado && 'bg-hueso',
                          seleccionado && 'bg-marino-50',
                        )}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="font-titular font-bold text-marino-800">Ejercicio #{i.numeroEjercicio}</span>
                          <Resultado correcto={i.esCorrecto} desactivado={desactivado} />
                        </span>
                        <span className="mt-2 flex flex-col items-start gap-1.5 text-sm text-texto-suave">
                          <PildoraComponente nombre={i.componente} />
                          <span>{i.competencia} · {i.nivel}</span>
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
                      <th scope="col" className="py-2.5 pr-3 pl-2">Ejercicio</th>
                      <th scope="col" className="py-2.5 pr-3">Componente</th>
                      <th scope="col" className="py-2.5 pr-3">Competencia</th>
                      <th scope="col" className="py-2.5 pr-3">Nivel</th>
                      <th scope="col" className="py-2.5 pr-3">Resultado</th>
                      <th scope="col" className="py-2.5 pr-2">Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.contenido.map(i => {
                      const seleccionado = String(i.id) === id
                      const desactivado = i.estadoEjercicio === 'Desactivado'
                      return (
                        <tr
                          key={i.id}
                          aria-current={seleccionado ? 'true' : undefined}
                          onClick={() => navigate(`/historial/${i.id}?pagina=${pagina}`)}
                          className={cn(
                            'cursor-pointer border-b border-borde transition-colors hover:bg-hueso',
                            desactivado && 'bg-hueso',
                            seleccionado && 'bg-marino-50',
                          )}
                        >
                          <td className="py-3 pr-3 pl-2">
                            <Link
                              to={`/historial/${i.id}?pagina=${pagina}`}
                              aria-label={`Ver el intento del ejercicio ${i.numeroEjercicio}`}
                              onClick={e => e.stopPropagation()}
                              className="font-titular font-bold whitespace-nowrap text-marino-800 underline-offset-4 hover:underline"
                            >
                              #{i.numeroEjercicio}
                            </Link>
                          </td>
                          <td className="py-3 pr-3"><PildoraComponente nombre={i.componente} /></td>
                          <td className="py-3 pr-3 text-texto-suave">{i.competencia}</td>
                          <td className="py-3 pr-3 text-texto-suave">{i.nivel}</td>
                          <td className="py-3 pr-3"><Resultado correcto={i.esCorrecto} desactivado={desactivado} /></td>
                          <td className="py-3 pr-2 text-texto-suave">{fechaHora(i.fechaHora)}</td>
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
              etiqueta="Paginación del historial"
            />
          )}
        </section>

        <section ref={refDetalle} tabIndex={-1} className="panel min-w-0 scroll-mt-24 space-y-5 p-6 outline-none sm:p-7 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
          <h2 className="text-xl font-bold text-marino-800">Detalle del intento</h2>

          {!id && <p className="text-sm text-texto-suave">Selecciona un intento de la lista para ver su detalle.</p>}

          {id && cargandoDetalle && <EsqueletoDeDetalle />}

          {id && !cargandoDetalle && detalle && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm text-texto-suave">
                <span className={cn('inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold', tonoDeComponente(detalle.componente).pildora)}>
                  <IconoComponente nombre={detalle.componente} className="size-[15px]" />
                  {detalle.componente} · {detalle.nivel}
                </span>
                <span>Ejercicio #{detalle.numeroEjercicio} · {fechaHora(detalle.fechaHora)} · {detalle.competencia}</span>
              </div>

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

              <ul aria-label="Opciones de respuesta" className="grid gap-3">
                {detalle.opciones.map(o => {
                  const estado = estadoOpcion(o)
                  return (
                    <li key={o.id} className={cn(cajaDeOpcion, estiloOpcion(estado).caja)}>
                      <ContenidoDeOpcion opcion={o} estado={estado} tuRespuesta={o.seleccionada} />
                    </li>
                  )
                })}
              </ul>

              <FranjaDeCorreccion
                enLinea
                correcto={detalle.esCorrecto}
                titulo={`Resultado: ${detalle.esCorrecto ? 'Correcto' : 'Incorrecto'}`}
                detalle={
                  <>
                    <strong>Retroalimentación:</strong> {detalle.retroalimentacion}
                    {!detalle.esCorrecto && (
                      <span className="mt-2 block"><strong>Tipo de error:</strong> {detalle.tipoError ?? 'Sin clasificación registrada'}</span>
                    )}
                  </>
                }
                nota={`Nivel de confianza registrado: ${detalle.nivelConfianza} de 5`}
              />

              <p className="text-xs text-texto-suave">El detalle muestra los datos tal como se registraron en su momento.</p>

            </div>
          )}
        </section>
      </div>
    </div>
  )
}
