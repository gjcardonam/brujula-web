import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from 'cn'
import { api, ApiError, mensajeDe } from '@/api/client'
import type { EjercicioEstudiante, OpcionEstudiante, ResultadoIntento, SiguienteEjercicio } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { SelectorDeConfianza } from '@/components/SelectorDeConfianza'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fechaHora } from '@/utils/formato'
import { uuid } from '@/utils/uuid'

function estiloOpcion(o: OpcionEstudiante, seleccion: number | null, resultado: ResultadoIntento | null) {
  if (!resultado) {
    return seleccion === o.id
      ? 'border-marino-800 bg-marino-50 ring-1 ring-marino-800'
      : 'border-gris-200 bg-superficie hover:border-marino-700 hover:bg-marino-50/60'
  }
  if (o.id === resultado.idOpcionCorrecta) return 'border-exito-600 bg-exito-50'
  if (o.id === resultado.idOpcionSeleccionada) return 'border-error-700 bg-error-50'
  return 'border-gris-200 bg-superficie opacity-70'
}

function Punto({ marcado, tono }: { marcado: boolean; tono: 'neutro' | 'exito' | 'error' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors',
        tono === 'exito' ? 'border-exito-600' : tono === 'error' ? 'border-error-700' : marcado ? 'border-marino-800' : 'border-gris-300',
      )}
    >
      {marcado && (
        <span className={cn('size-2 rounded-full', tono === 'exito' ? 'bg-exito-600' : tono === 'error' ? 'bg-error-700' : 'bg-marino-800')} />
      )}
    </span>
  )
}

function Esqueleto() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="superficie space-y-4 p-5 sm:p-6">
        <Skeleton className="h-3.5 w-52" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <div className="space-y-3 pt-3">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      </div>
      <div className="superficie space-y-3 p-5 sm:p-6">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
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
    refResultado.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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
      <div className="superficie mx-auto max-w-lg p-6 text-center sm:p-8">
        <h1 className="text-xl font-semibold text-gris-900">Este ejercicio ya no está disponible</h1>
        <p className="mt-2 text-sm text-gris-500">Fue retirado del banco. Elige otro y sigue practicando.</p>
        <Button asChild className="mt-6">
          <Link to={volver}>Volver al banco</Link>
        </Button>
      </div>
    )
  }

  if (error && !ejercicio) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Aviso>{error}</Aviso>
        <div className="flex gap-3">
          <Button onClick={cargar}>Reintentar</Button>
          <Button asChild variant="outline"><Link to={volver}>Volver al banco</Link></Button>
        </div>
      </div>
    )
  }

  if (!ejercicio) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Cargando el ejercicio</span>
        <Esqueleto />
      </div>
    )
  }

  const respondido = resultado !== null
  const indiceFoco = seleccion ? ejercicio.opciones.findIndex(o => o.id === seleccion) : 0

  return (
    <div className="grid animate-subir items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
      <section className="superficie p-5 sm:p-6">
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1 text-xs text-gris-500">
          <Link to={volver} className="rounded-sm hover:text-marino-700 hover:underline">Banco</Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <span>{ejercicio.componente.nombre}</span>
          <ChevronRight className="size-3" aria-hidden="true" />
          <span aria-current="page" className="text-gris-700">Ejercicio #{ejercicio.numero}</span>
        </nav>

        <h1 className="mt-3 text-2xl font-bold text-gris-900">Ejercicio #{ejercicio.numero}</h1>
        <p className="mt-1 text-sm text-gris-500">
          {ejercicio.componente.nombre} · {ejercicio.competencia.nombre} · {ejercicio.nivel}
        </p>

        <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-gris-900">{ejercicio.enunciado}</p>

        {ejercicio.imagenEnunciado && (
          <img
            src={ejercicio.imagenEnunciado}
            alt="Ilustración del enunciado"
            className="mt-4 max-h-80 w-full rounded-md border border-gris-200 object-contain"
          />
        )}

        <div role="radiogroup" aria-label="Opciones de respuesta" className="mt-6 space-y-2.5">
          {ejercicio.opciones.map((o, i) => {
            const marcado = resultado
              ? o.id === resultado.idOpcionSeleccionada || o.id === resultado.idOpcionCorrecta
              : seleccion === o.id
            const tono = !resultado
              ? 'neutro'
              : o.id === resultado.idOpcionCorrecta
                ? 'exito'
                : o.id === resultado.idOpcionSeleccionada ? 'error' : 'neutro'
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
                  'flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left text-sm transition-all disabled:cursor-default',
                  estiloOpcion(o, seleccion, resultado),
                )}
              >
                <Punto marcado={marcado} tono={tono as 'neutro' | 'exito' | 'error'} />
                <span className="min-w-0 flex-1">
                  <span className="text-gris-900">
                    <span className="font-semibold">{o.letra}.</span> {o.descripcion}
                  </span>
                  {resultado && o.id === resultado.idOpcionCorrecta && (
                    <span className="ml-2 font-semibold text-exito-700">— respuesta correcta</span>
                  )}
                  {resultado && o.id === resultado.idOpcionSeleccionada && !resultado.esCorrecto && (
                    <span className="ml-2 font-semibold text-error-700">— tu respuesta</span>
                  )}
                  {o.imagen && (
                    <img src={o.imagen} alt={`Opción ${o.letra}`} className="mt-2 max-h-28 rounded-sm border border-gris-200" />
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-gris-200 pt-5">
          <p className="max-w-[16rem] text-sm text-gris-700">
            {respondido ? '¿Qué tan seguro estabas?' : '¿Qué tan seguro estás?'}
            <span className="block text-xs text-gris-500">1 es nada, 5 es muy seguro</span>
          </p>
          <SelectorDeConfianza
            valor={confianza}
            onCambiar={setConfianza}
            disabled={respondido || enviando}
            etiqueta="Nivel de confianza"
          />
        </div>

        {error && <Aviso className="mt-5">{error}</Aviso>}
        {sinMas && <Aviso tono="informacion" className="mt-5">{sinMas}</Aviso>}

        <div className="mt-6 flex flex-wrap gap-3">
          {!respondido ? (
            <>
              <Button type="button" onClick={confirmar} disabled={seleccion === null || confianza === null || enviando}>
                {enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {enviando ? 'Registrando' : 'Confirmar respuesta'}
              </Button>
              <Button asChild variant="ghost">
                <Link to={volver}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Volver al banco
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button type="button" onClick={siguiente} disabled={buscandoSiguiente || sinMas !== null}>
                {buscandoSiguiente && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Siguiente ejercicio
                {!buscandoSiguiente && <ArrowRight className="size-4" aria-hidden="true" />}
              </Button>
              <Button asChild variant="outline">
                <Link to={volver}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Volver al banco
                </Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <div ref={refResultado} tabIndex={-1} aria-live="polite" className="space-y-4 focus:outline-none">
        {resultado ? (
          <>
            <section
              className={cn(
                'superficie animate-subir border-l-4 p-5 sm:p-6',
                resultado.esCorrecto ? 'border-l-exito-600' : 'border-l-error-700',
              )}
            >
              <h2 className={cn('text-xl font-semibold', resultado.esCorrecto ? 'text-exito-700' : 'text-error-700')}>
                {resultado.esCorrecto ? 'Respuesta correcta' : 'Respuesta incorrecta'}
              </h2>
              {resultado.retroalimentacionDisponible ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gris-700">
                  <strong className="font-semibold text-gris-900">
                    {resultado.esCorrecto ? 'Por qué es correcta: ' : 'Por qué no es correcta: '}
                  </strong>
                  {resultado.retroalimentacion}
                </p>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-gris-500">
                  Todavía no hay una explicación escrita para la opción que elegiste.
                </p>
              )}
            </section>

            <section className="superficie p-5 sm:p-6">
              <h2 className="text-base font-semibold text-gris-900">Tu intento quedó registrado</h2>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-gris-500">Fecha</dt>
                <dd className="text-gris-700">{fechaHora(resultado.respondidoEn)}</dd>
                <dt className="text-gris-500">Confianza</dt>
                <dd className="text-gris-700">{resultado.nivelConfianza} de 5</dd>
                <dt className="text-gris-500">Intento</dt>
                <dd className="text-gris-700">{resultado.numeroIntento} de este ejercicio</dd>
              </dl>
            </section>
          </>
        ) : (
          <section className="superficie bg-marino-50/60 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-marino-900">Al confirmar verás por qué</h2>
            <p className="mt-2 text-sm leading-relaxed text-gris-700">
              Te explicamos la opción que elegiste, no solo si acertaste.
            </p>
            {ejercicio.intentosPrevios > 0 && (
              <p className="mt-3 text-sm text-gris-500">
                Ya resolviste este ejercicio {ejercicio.intentosPrevios} {ejercicio.intentosPrevios === 1 ? 'vez' : 'veces'}.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
