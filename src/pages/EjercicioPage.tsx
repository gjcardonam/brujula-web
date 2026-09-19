import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from 'cn'
import { api, ApiError, mensajeDe } from '@/api/client'
import type { EjercicioEstudiante, OpcionEstudiante, ResultadoIntento, SiguienteEjercicio } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { IconoComponente, tonoDeComponente } from '@/components/Componente'
import { FranjaDeCorreccion } from '@/components/FranjaDeCorreccion'
import { SelectorDeConfianza } from '@/components/SelectorDeConfianza'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fechaHora } from '@/utils/formato'
import { uuid } from '@/utils/uuid'

interface EstiloOpcion { caja: string; ficha: string; texto: string }

function estiloOpcion(o: OpcionEstudiante, seleccion: number | null, resultado: ResultadoIntento | null): EstiloOpcion {
  if (!resultado) {
    return seleccion === o.id
      ? {
          caja: 'border-violeta-600 bg-violeta-50',
          ficha: 'bg-violeta-600 text-white',
          texto: 'text-violeta-700',
        }
      : {
          caja: 'border-borde-fuerte bg-superficie hover:border-marino-200 active:translate-y-[3px] active:border-b-2',
          ficha: 'bg-hueso text-texto-suave',
          texto: 'text-marino-800',
        }
  }
  if (o.id === resultado.idOpcionCorrecta) {
    return { caja: 'border-exito-600 bg-exito-50', ficha: 'bg-exito-600 text-white', texto: 'text-exito-700' }
  }
  if (o.id === resultado.idOpcionSeleccionada) {
    return { caja: 'border-error-600 bg-error-50', ficha: 'bg-error-600 text-white', texto: 'text-error-700' }
  }
  return { caja: 'border-borde-fuerte bg-superficie opacity-55', ficha: 'bg-hueso text-texto-suave', texto: 'text-marino-800' }
}

function etiquetaOpcion(o: OpcionEstudiante, resultado: ResultadoIntento | null) {
  if (!resultado) return null
  if (o.id === resultado.idOpcionCorrecta) return { texto: 'Respuesta correcta', color: 'text-exito-700' }
  if (o.id === resultado.idOpcionSeleccionada) return { texto: 'Tu respuesta', color: 'text-error-700' }
  return null
}

function Esqueleto() {
  return (
    <div className="w-full max-w-[820px]">
      <Skeleton className="h-8 w-full rounded-control" />
      <Skeleton className="mt-3 h-8 w-4/5 rounded-control" />
      <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[82px] w-full rounded-tarjeta" />)}
      </div>
      <Skeleton className="mt-7 h-[100px] w-full rounded-[20px]" />
    </div>
  )
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fondo px-5 py-10">
      <div className="panel w-full max-w-lg p-7 text-center sm:p-9">{children}</div>
    </div>
  )
}

export function EjercicioPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const componente = params.get('componente') ? Number(params.get('componente')) : null
  const navigate = useNavigate()
  const refOpciones = useRef<(HTMLButtonElement | null)[]>([])
  const refResultado = useRef<HTMLDivElement>(null)

  const [ejercicio, setEjercicio] = useState<EjercicioEstudiante | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [noDisponible, setNoDisponible] = useState(false)
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [confianza, setConfianza] = useState<number | null>(null)
  const [resultado, setResultado] = useState<ResultadoIntento | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [buscandoSiguiente, setBuscandoSiguiente] = useState(false)
  const [sinMas, setSinMas] = useState<string | null>(null)
  const [token, setToken] = useState(() => uuid())
  const [altoFranja, setAltoFranja] = useState(0)

  const cargar = useCallback(() => {
    setEjercicio(null); setError(null); setNoDisponible(false)
    setSeleccion(null); setConfianza(null); setResultado(null); setSinMas(null)
    setToken(uuid())
    api<EjercicioEstudiante>(`/ejercicios/${id}`)
      .then(setEjercicio)
      .catch(e => {
        if (e instanceof ApiError && e.estado === 410) setNoDisponible(true)
        else setError(mensajeDe(e))
      })
  }, [id])

  useEffect(cargar, [cargar])

  useEffect(() => {
    if (!resultado) return
    refResultado.current?.focus({ preventScroll: true })
  }, [resultado])

  useEffect(() => {
    const el = refResultado.current
    if (!el || !resultado) { setAltoFranja(0); return }
    const medir = () => setAltoFranja(el.offsetHeight)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [resultado])

  const volver = `/banco${componente ? `?componente=${componente}` : ''}`

  async function confirmar() {
    if (!ejercicio || seleccion === null || confianza === null) return
    setEnviando(true); setError(null)
    try {
      const r = await api<ResultadoIntento>('/intentos', {
        method: 'POST',
        body: { idEjercicio: ejercicio.id, idOpcion: seleccion, nivelConfianza: confianza, tokenIdempotencia: token },
      })
      setResultado(r)
    } catch (e) {
      if (e instanceof ApiError && e.estado === 410) setNoDisponible(true)
      else setError(mensajeDe(e))
    } finally {
      setEnviando(false)
    }
  }

  async function siguiente() {
    if (!ejercicio) return
    setBuscandoSiguiente(true); setError(null)
    try {
      const r = await api<SiguienteEjercicio>(`/ejercicios/${ejercicio.id}/siguiente${componente ? `?componente=${componente}` : ''}`)
      if (r.hayMas && r.idEjercicio) navigate(`/ejercicios/${r.idEjercicio}${componente ? `?componente=${componente}` : ''}`)
      else setSinMas(r.mensaje ?? 'Ya resolviste todos los ejercicios disponibles con este filtro.')
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setBuscandoSiguiente(false)
    }
  }

  function teclasOpciones(e: React.KeyboardEvent, i: number) {
    if (!ejercicio || resultado) return
    const total = ejercicio.opciones.length
    const mapa: Record<string, number> = {
      ArrowDown: (i + 1) % total,
      ArrowRight: (i + 1) % total,
      ArrowUp: (i + total - 1) % total,
      ArrowLeft: (i + total - 1) % total,
      Home: 0,
      End: total - 1,
    }
    const destino = mapa[e.key]
    if (destino === undefined) return
    e.preventDefault()
    setSeleccion(ejercicio.opciones[destino].id)
    refOpciones.current[destino]?.focus()
  }

  if (noDisponible) {
    return (
      <Marco>
        <h1 className="text-xl font-bold text-marino-800">Este ejercicio ya no está disponible</h1>
        <p className="mt-2.5 text-base text-texto-suave">Fue retirado del banco. Elige otro y sigue practicando.</p>
        <Button asChild className="mt-7">
          <Link to={volver}>Volver a la ruta</Link>
        </Button>
      </Marco>
    )
  }

  if (error && !ejercicio) {
    return (
      <Marco>
        <Aviso className="text-left">{error}</Aviso>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={cargar}>Reintentar</Button>
          <Button asChild variant="contorno"><Link to={volver}>Volver a la ruta</Link></Button>
        </div>
      </Marco>
    )
  }

  const respondido = resultado !== null
  const tono = tonoDeComponente(ejercicio?.componente.nombre)
  const opcionCorrecta = resultado && ejercicio
    ? ejercicio.opciones.find(o => o.id === resultado.idOpcionCorrecta) ?? null
    : null
  const indiceFoco = ejercicio && seleccion ? ejercicio.opciones.findIndex(o => o.id === seleccion) : 0

  return (
    <div className="flex min-h-screen flex-col bg-fondo">
      <header className="flex min-h-[66px] shrink-0 flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3 sm:px-10">
        <Link
          to={volver}
          className="inline-flex items-center gap-2.5 text-base font-bold text-texto-suave transition-colors hover:text-marino-800"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
          Salir de la práctica
        </Link>
        {ejercicio && (
          <span
            className={cn('ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold max-sm:ml-0', tono.pildora)}
          >
            <IconoComponente nombre={ejercicio.componente.nombre} className="size-[15px]" />
            {ejercicio.componente.nombre} · {ejercicio.nivel}
          </span>
        )}
      </header>

      <main
        className="flex flex-1 flex-col items-center px-5 pt-5 pb-12 sm:px-10"
        style={altoFranja ? { paddingBottom: altoFranja + 32 } : undefined}
      >
        {!ejercicio ? (
          <div aria-busy="true" aria-live="polite" className="my-auto w-full max-w-[820px]">
            <span className="sr-only">Cargando el ejercicio</span>
            <Esqueleto />
          </div>
        ) : (
          <div className="my-auto w-full max-w-[820px] animate-entrar">
            {ejercicio.intentosPrevios > 0 && (
              <p className="mb-3 text-xs font-bold tracking-[0.08em] text-texto-suave uppercase">
                Ya lo resolviste {ejercicio.intentosPrevios} {ejercicio.intentosPrevios === 1 ? 'vez' : 'veces'}
              </p>
            )}

            <h1
              className={
                ejercicio.enunciado.length > 180
                  ? 'font-sans text-[17px] leading-[1.65] font-medium tracking-normal whitespace-pre-line text-marino-800 [text-wrap:pretty] sm:text-[19px]'
                  : 'text-2xl leading-[1.35] font-semibold whitespace-pre-line text-marino-800 [text-wrap:pretty] sm:text-[29px]'
              }
            >
              {ejercicio.enunciado}
            </h1>

            {ejercicio.imagenEnunciado && (
              <img
                src={ejercicio.imagenEnunciado}
                alt="Ilustración del enunciado"
                className="mt-6 max-h-[460px] w-full rounded-tarjeta border border-borde object-contain"
              />
            )}

            <div role="radiogroup" aria-label="Opciones de respuesta" className="mt-7 grid gap-3.5 sm:grid-cols-2">
              {ejercicio.opciones.map((o, i) => {
                const est = estiloOpcion(o, seleccion, resultado)
                const etiqueta = etiquetaOpcion(o, resultado)
                return (
                  <button
                    key={o.id}
                    type="button"
                    ref={el => { refOpciones.current[i] = el }}
                    role="radio"
                    aria-checked={seleccion === o.id}
                    tabIndex={respondido ? -1 : i === Math.max(0, indiceFoco) ? 0 : -1}
                    disabled={respondido || enviando}
                    onClick={() => setSeleccion(o.id)}
                    onKeyDown={e => teclasOpciones(e, i)}
                    className={cn(
                      'flex items-center gap-4 rounded-tarjeta border-2 border-b-[5px] px-5 py-5 text-left transition-[transform,border-color,background-color,opacity] disabled:cursor-default',
                      est.caja,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn('grid size-[34px] shrink-0 place-items-center rounded-ficha font-titular text-sm font-bold', est.ficha)}
                    >
                      {o.letra}
                    </span>
                    <span className={cn('min-w-0 flex-1 text-lg font-semibold', est.texto)}>
                      {o.descripcion}
                      {o.imagen && (
                        <img
                          src={o.imagen}
                          alt={`Opción ${o.letra}`}
                          className="mt-2.5 max-h-[220px] w-full rounded-ficha border border-borde object-contain"
                        />
                      )}
                    </span>
                    {etiqueta && (
                      <span
                        className={cn(
                          'max-w-[84px] shrink-0 text-right text-[11px] leading-[1.25] font-bold tracking-[0.06em] uppercase sm:max-w-none',
                          etiqueta.color,
                        )}
                      >
                        {etiqueta.texto}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="tarjeta mt-6 flex flex-col gap-5 rounded-[20px] px-6 py-5 sm:flex-row sm:items-center sm:gap-[22px]">
              <div className="shrink-0">
                <p className="font-titular text-md font-bold tracking-[-0.02em] text-marino-800">
                  {respondido ? '¿Qué tan seguro estabas?' : '¿Qué tan seguro estás?'}
                </p>
                <p className="text-xs text-texto-suave">Nos dice por qué fallaste, no solo que fallaste</p>
              </div>
              <div className="flex flex-1 sm:justify-end">
                <SelectorDeConfianza
                  valor={confianza}
                  onCambiar={setConfianza}
                  disabled={respondido || enviando}
                  etiqueta="Nivel de confianza, de 1 a 5"
                />
              </div>
            </div>

            {error && <Aviso className="mt-6">{error}</Aviso>}

            {!respondido && (
              <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-texto-suave">
                  {seleccion === null
                    ? 'Elige una opción para continuar.'
                    : confianza === null
                      ? 'Marca qué tan seguro estás de tu respuesta.'
                      : 'Al confirmar te explicamos la opción que elegiste.'}
                </p>
                <Button
                  type="button"
                  size="lg"
                  onClick={confirmar}
                  disabled={seleccion === null || confianza === null || enviando}
                  className="max-sm:w-full"
                >
                  {enviando && <Loader2 className="animate-spin" aria-hidden="true" />}
                  {enviando ? 'Registrando' : 'Confirmar respuesta'}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <div ref={refResultado} tabIndex={-1} aria-live="polite" className="fixed inset-x-0 bottom-0 z-30 outline-none">
        {resultado && (
          <FranjaDeCorreccion
            correcto={resultado.esCorrecto}
            titulo={resultado.esCorrecto ? 'Respuesta correcta' : 'No es la respuesta correcta'}
            detalle={
              <>
                {resultado.retroalimentacionDisponible
                  ? resultado.retroalimentacion
                  : 'Todavía no hay una explicación escrita para la opción que elegiste.'}
                {!resultado.esCorrecto && opcionCorrecta && (
                  <>
                    {' '}La respuesta correcta es{' '}
                    <strong>
                      {opcionCorrecta.letra}
                      {opcionCorrecta.descripcion ? `. ${opcionCorrecta.descripcion}` : ''}
                    </strong>.
                  </>
                )}
              </>
            }
            nota={
              sinMas ??
              `Intento ${resultado.numeroIntento} · ${fechaHora(resultado.respondidoEn)} · confianza ${resultado.nivelConfianza} de 5`
            }
            accion={
              sinMas ? (
                <Button asChild size="lg" className="max-sm:w-full">
                  <Link to={volver}>Volver a la ruta</Link>
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={siguiente} disabled={buscandoSiguiente} className="max-sm:w-full">
                  {buscandoSiguiente && <Loader2 className="animate-spin" aria-hidden="true" />}
                  Siguiente
                  {!buscandoSiguiente && <ArrowRight aria-hidden="true" strokeWidth={2.5} />}
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  )
}
