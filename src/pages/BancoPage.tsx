import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import { cn } from 'cn'
import { api, mensajeDe } from '@/api/client'
import type { Componentes, Pagina, Tarjeta } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Aviso } from '@/components/Aviso'
import { IconoComponente, tonoDeComponente } from '@/components/Componente'
import { EstadoVacio } from '@/components/EstadoVacio'
import { RosaDeLosVientos } from '@/components/Marca'
import { Paginacion } from '@/components/Paginacion'
import { RutaDeComponente, RutaDeComponenteEsqueleto } from '@/components/RutaDeComponente'
import { TarjetaEjercicio, TarjetaEjercicioAdmin, TarjetaEjercicioEsqueleto } from '@/components/TarjetaEjercicio'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const NUMEROS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']

function enPalabras(n: number): string {
  return NUMEROS[n] ?? String(n)
}

function Pildora({
  activo,
  nombre,
  cantidad,
  onClick,
  conIcono,
}: {
  activo: boolean
  nombre: string
  cantidad: number
  onClick: () => void
  conIcono: boolean
}) {
  const tono = tonoDeComponente(nombre)
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full border-2 px-4 text-sm font-bold transition-colors',
        conIcono
          ? activo
            ? cn(tono.borde, tono.fondoSuave, tono.texto)
            : 'border-borde-fuerte bg-superficie text-marino-800 hover:border-marino-200'
          : activo
            ? 'border-marino-800 bg-marino-50 text-marino-800'
            : 'border-borde-fuerte bg-superficie text-marino-800 hover:border-marino-200',
      )}
    >
      {conIcono && <IconoComponente nombre={nombre} className={cn('size-[17px]', activo ? '' : tono.icono)} />}
      {nombre}
      <span className={activo ? 'opacity-70' : 'text-texto-suave'}>{cantidad}</span>
    </button>
  )
}

function CabeceraDeLista({
  nombre,
  cantidad,
  volver,
}: {
  nombre: string
  cantidad: number
  volver: string
}) {
  const tono = tonoDeComponente(nombre)
  return (
    <div>
      <Link
        to={volver}
        className="inline-flex items-center gap-2 text-sm font-bold text-texto-suave transition-colors hover:text-marino-800"
      >
        <ArrowLeft className="size-[17px]" aria-hidden="true" />
        Volver a la ruta
      </Link>
      <div className="mt-4 flex items-center gap-4">
        <span
          aria-hidden="true"
          className={cn('grid size-[58px] shrink-0 place-items-center rounded-[18px]', tono.fondoSuave, tono.icono)}
        >
          <IconoComponente nombre={nombre} className="size-[27px]" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-marino-800 sm:text-3xl">{nombre}</h1>
          <p className="text-base text-texto-suave">
            {cantidad} {cantidad === 1 ? 'ejercicio' : 'ejercicios'} para practicar
          </p>
        </div>
      </div>
    </div>
  )
}

export function BancoPage() {
  const { esAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const componente = params.get('componente') ? Number(params.get('componente')) : null
  const pagina = Number(params.get('pagina') ?? 0)
  const modoRuta = !esAdmin && componente === null

  const [componentes, setComponentes] = useState<Componentes | null>(null)
  const [cargandoComponentes, setCargandoComponentes] = useState(true)
  const [destacado, setDestacado] = useState<Tarjeta | null>(null)
  const [porComponente, setPorComponente] = useState<Record<number, Tarjeta[]>>({})
  const [cargandoRuta, setCargandoRuta] = useState(true)
  const [datos, setDatos] = useState<Pagina<Tarjeta> | null>(null)
  const [cargandoLista, setCargandoLista] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    let vivo = true
    setCargandoComponentes(true)
    api<Componentes>('/ejercicios/componentes')
      .then(c => { if (vivo) { setComponentes(c); setError(null) } })
      .catch(e => { if (vivo) { setComponentes(null); setError(mensajeDe(e)) } })
      .finally(() => { if (vivo) setCargandoComponentes(false) })
    return () => { vivo = false }
  }, [reintento])

  const listaComponentes = useMemo(() => componentes?.componentes ?? [], [componentes])

  useEffect(() => {
    if (!modoRuta || !componentes) return
    let vivo = true
    setCargandoRuta(true)
    Promise.all([
      api<Pagina<Tarjeta>>('/ejercicios?pagina=0'),
      ...listaComponentes.map(c => api<Pagina<Tarjeta>>(`/ejercicios?componente=${c.id}&pagina=0`)),
    ])
      .then(([banco, ...listas]) => {
        if (!vivo) return
        const mapa: Record<number, Tarjeta[]> = {}
        listaComponentes.forEach((c, i) => { mapa[c.id] = listas[i]?.contenido ?? [] })
        setPorComponente(mapa)
        setDestacado(banco.contenido[0] ?? null)
        setError(null)
      })
      .catch(e => { if (vivo) { setPorComponente({}); setDestacado(null); setError(mensajeDe(e)) } })
      .finally(() => { if (vivo) setCargandoRuta(false) })
    return () => { vivo = false }
  }, [modoRuta, componentes, listaComponentes, reintento])

  useEffect(() => {
    if (modoRuta) return
    let vivo = true
    setCargandoLista(true)
    const q = new URLSearchParams()
    if (componente) q.set('componente', String(componente))
    q.set('pagina', String(pagina))
    api<Pagina<Tarjeta>>(`/ejercicios?${q}`)
      .then(d => { if (vivo) { setDatos(d); setError(null) } })
      .catch(e => { if (vivo) { setDatos(null); setError(mensajeDe(e)) } })
      .finally(() => { if (vivo) setCargandoLista(false) })
    return () => { vivo = false }
  }, [modoRuta, componente, pagina, reintento])

  const filtrar = useCallback((id: number | null) => {
    const q = new URLSearchParams()
    if (id) q.set('componente', String(id))
    q.set('pagina', '0')
    setParams(q)
  }, [setParams])

  const irPagina = useCallback((p: number) => {
    const q = new URLSearchParams(params)
    q.set('pagina', String(p))
    setParams(q)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [params, setParams])

  const nombreComponente = listaComponentes.find(c => c.id === componente)?.nombre
  const cantidadComponente = listaComponentes.find(c => c.id === componente)?.cantidad ?? 0

  const avisoDeError = error && (
    <Aviso>
      <p>{error}</p>
      <button
        type="button"
        className="mt-2 font-bold underline decoration-2 underline-offset-4"
        onClick={() => setReintento(n => n + 1)}
      >
        Reintentar
      </button>
    </Aviso>
  )

  if (modoRuta) {
    const cargando = cargandoComponentes || (componentes !== null && cargandoRuta)
    const vacio = !cargando && !error && componentes !== null && componentes.total === 0

    return (
      <div className="animate-entrar space-y-6">
        {avisoDeError}

        {cargando && (
          <div aria-busy="true" aria-live="polite" className="space-y-6">
            <span className="sr-only">Cargando tu ruta de práctica</span>
            <Skeleton className="h-[164px] w-full rounded-panel" />
            <Skeleton className="h-6 w-64" />
            <div className="space-y-3.5">
              {Array.from({ length: 3 }, (_, i) => <RutaDeComponenteEsqueleto key={i} />)}
            </div>
          </div>
        )}

        {vacio && (
          <EstadoVacio
            titulo="El banco todavía está vacío"
            descripcion="Vuelve más tarde: tu profesor aún no ha publicado ejercicios para practicar."
          />
        )}

        {!cargando && !vacio && componentes && (
          <>
            {destacado && (
              <section
                data-sobre-marino
                className="relative isolate overflow-hidden rounded-panel bg-marino-800 px-7 py-8 sm:px-[34px] sm:py-[30px]"
              >
                <RosaDeLosVientos
                  className="pointer-events-none absolute -top-[46px] -right-[34px] -z-10 size-[220px] text-white opacity-[0.16]"
                />
                <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-[34px]">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold tracking-[0.1em] text-ambar-500 uppercase">Empieza por aquí</p>
                    <h2 className="mt-2.5 max-w-[620px] text-2xl leading-[1.2] font-bold text-white sm:text-3xl">
                      {destacado.componente} · Ejercicio {destacado.numero}
                    </h2>
                    <p className="mt-2 max-w-[560px] text-md leading-relaxed text-marino-200">
                      {destacado.competencia} · Nivel {destacado.nivel.toLowerCase()}
                    </p>
                  </div>
                  <Button asChild variant="acento" size="lg" className="max-sm:w-full">
                    <Link to={`/ejercicios/${destacado.id}`}>
                      Empezar
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </section>
            )}

            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
              <h1 className="text-xl font-bold text-marino-800">Tu ruta de práctica</h1>
              <p className="text-base text-texto-suave">
                {componentes.total} ejercicios en {enPalabras(listaComponentes.length)} componentes
              </p>
            </div>

            <div className="space-y-3.5">
              {listaComponentes.map(c => (
                <RutaDeComponente key={c.id} componente={c} ejercicios={porComponente[c.id] ?? []} />
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  const cargando = cargandoLista
  const vacio = !cargando && !error && datos !== null && datos.contenido.length === 0

  return (
    <div className="animate-entrar space-y-6">
      {esAdmin ? (
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-marino-800 sm:text-3xl">Banco de ejercicios</h1>
            <p className="mt-1.5 text-base text-texto-suave">Revisa lo publicado y agrega ejercicios nuevos.</p>
          </div>
          <Button asChild variant="acento">
            <Link to="/admin/ejercicios/nuevo">
              <Plus aria-hidden="true" />
              Crear ejercicio
            </Link>
          </Button>
        </header>
      ) : nombreComponente ? (
        <CabeceraDeLista nombre={nombreComponente} cantidad={cantidadComponente} volver="/banco" />
      ) : null}

      {componentes ? (
        <div role="group" aria-label="Filtrar por componente" className="flex flex-wrap gap-2.5">
          <Pildora
            activo={componente === null}
            nombre={esAdmin ? 'Todos' : 'Mi ruta'}
            cantidad={componentes.total}
            conIcono={false}
            onClick={() => filtrar(null)}
          />
          {listaComponentes.map(c => (
            <Pildora
              key={c.id}
              activo={componente === c.id}
              nombre={c.nombre}
              cantidad={c.cantidad}
              conIcono
              onClick={() => filtrar(c.id)}
            />
          ))}
        </div>
      ) : cargandoComponentes ? (
        <div className="flex flex-wrap gap-2.5" aria-hidden="true">
          {[92, 168, 132, 140].map((w, i) => <Skeleton key={i} className="h-11 rounded-full" style={{ width: w }} />)}
        </div>
      ) : null}

      {avisoDeError}

      <div aria-busy={cargando} aria-live="polite">
        {cargando && (
          <>
            <span className="sr-only">Cargando ejercicios</span>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => <TarjetaEjercicioEsqueleto key={i} />)}
            </div>
          </>
        )}

        {vacio && (
          <EstadoVacio
            titulo={componente ? 'Todavía no hay ejercicios aquí' : 'El banco todavía está vacío'}
            descripcion={
              componente
                ? `Aún no hay ejercicios de ${nombreComponente ?? 'este componente'}. Prueba con otro.`
                : esAdmin
                  ? 'Crea el primer ejercicio para que los estudiantes puedan practicar.'
                  : 'Vuelve más tarde: tu profesor aún no ha publicado ejercicios.'
            }
            accion={
              componente
                ? <Button variant="contorno" onClick={() => filtrar(null)}>{esAdmin ? 'Ver todo el banco' : 'Volver a la ruta'}</Button>
                : esAdmin
                  ? <Button asChild variant="acento"><Link to="/admin/ejercicios/nuevo">Crear ejercicio</Link></Button>
                  : undefined
            }
          />
        )}

        {!cargando && datos && datos.contenido.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {datos.contenido.map(t =>
              esAdmin
                ? <TarjetaEjercicioAdmin key={t.id} tarjeta={t} mostrarComponente={componente === null} />
                : (
                    <TarjetaEjercicio
                      key={t.id}
                      tarjeta={t}
                      mostrarComponente={componente === null}
                      destino={`/ejercicios/${t.id}${componente ? `?componente=${componente}` : ''}`}
                    />
                  ),
            )}
          </div>
        )}
      </div>

      {!cargando && datos && datos.totalPaginas > 1 && (
        <div className="pt-2">
          <Paginacion pagina={datos.pagina} totalPaginas={datos.totalPaginas} onCambiar={irPagina} />
        </div>
      )}
    </div>
  )
}
