import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { cn } from 'cn'
import { api, mensajeDe } from '@/api/client'
import type { Componentes, Pagina, Tarjeta } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Aviso } from '@/components/Aviso'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Paginacion } from '@/components/Paginacion'
import { TarjetaEjercicio, TarjetaEjercicioAdmin, TarjetaEjercicioEsqueleto } from '@/components/TarjetaEjercicio'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function BancoPage() {
  const { esAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const componente = params.get('componente') ? Number(params.get('componente')) : null
  const pagina = Number(params.get('pagina') ?? 0)

  const [componentes, setComponentes] = useState<Componentes | null>(null)
  const [cargandoFiltros, setCargandoFiltros] = useState(true)
  const [datos, setDatos] = useState<Pagina<Tarjeta> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    let vivo = true
    setCargandoFiltros(true)
    api<Componentes>('/ejercicios/componentes')
      .then(c => { if (vivo) setComponentes(c) })
      .catch(() => { if (vivo) setComponentes(null) })
      .finally(() => { if (vivo) setCargandoFiltros(false) })
    return () => { vivo = false }
  }, [reintento])

  useEffect(() => {
    let vivo = true
    setCargando(true)
    const q = new URLSearchParams()
    if (componente) q.set('componente', String(componente))
    q.set('pagina', String(pagina))
    api<Pagina<Tarjeta>>(`/ejercicios?${q}`)
      .then(d => { if (vivo) { setDatos(d); setError(null) } })
      .catch(e => { if (vivo) { setError(mensajeDe(e)); setDatos(null) } })
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [componente, pagina, reintento])

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

  const nombreComponente = componentes?.componentes.find(c => c.id === componente)?.nombre
  const vacio = !cargando && datos !== null && datos.contenido.length === 0

  return (
    <div className="animate-subir">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gris-900 sm:text-3xl">Banco de ejercicios</h1>
          <p className="mt-1.5 max-w-prose text-sm text-gris-500">
            {esAdmin
              ? 'Consulta los ejercicios del banco y agrega nuevos.'
              : 'Filtra por componente y elige un ejercicio para practicar.'}
          </p>
        </div>
        {esAdmin && (
          <Button asChild variant="acento">
            <Link to="/admin/ejercicios/nuevo">
              <Plus className="size-4" aria-hidden="true" />
              Crear ejercicio
            </Link>
          </Button>
        )}
      </header>

      {componentes ? (
        <div role="group" aria-label="Filtrar por componente" className="mb-6 flex flex-wrap gap-2">
          {[{ id: null as number | null, nombre: 'Todos', cantidad: componentes.total }, ...componentes.componentes].map(c => {
            const activo = componente === c.id
            return (
              <button
                key={c.id ?? 'todos'}
                type="button"
                aria-pressed={activo}
                onClick={() => filtrar(c.id)}
                className={cn(
                  'inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors',
                  activo
                    ? 'border-marino-800 bg-marino-800 font-medium text-white'
                    : 'border-gris-200 bg-superficie text-gris-700 hover:border-marino-700 hover:text-marino-900',
                )}
              >
                {c.nombre}
                <span className={cn('ml-1.5', activo ? 'text-white/65' : 'text-gris-500')}>{c.cantidad}</span>
              </button>
            )
          })}
        </div>
      ) : cargandoFiltros ? (
        <div className="mb-6 flex flex-wrap gap-2" aria-hidden="true">
          {[64, 128, 96, 104].map((w, i) => <Skeleton key={i} className="h-9 rounded-full" style={{ width: w }} />)}
        </div>
      ) : null}

      {error && (
        <Aviso className="mb-6">
          <p>{error}</p>
          <button
            type="button"
            className="mt-2 rounded-sm font-medium underline underline-offset-4"
            onClick={() => setReintento(n => n + 1)}
          >
            Reintentar
          </button>
        </Aviso>
      )}

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
            titulo={componente ? 'Todavía no hay ejercicios en este componente' : 'El banco todavía está vacío'}
            descripcion={
              componente
                ? `Aún no hay ejercicios de ${nombreComponente ?? 'este componente'}. Prueba con otro o mira todo el banco.`
                : esAdmin
                  ? 'Crea el primer ejercicio para que los estudiantes puedan practicar.'
                  : 'Vuelve más tarde: tu profesor todavía no ha publicado ejercicios.'
            }
            accion={
              componente
                ? <Button variant="outline" onClick={() => filtrar(null)}>Ver todo el banco</Button>
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
                ? <TarjetaEjercicioAdmin key={t.id} tarjeta={t} />
                : <TarjetaEjercicio key={t.id} tarjeta={t} destino={`/ejercicios/${t.id}${componente ? `?componente=${componente}` : ''}`} />,
            )}
          </div>
        )}
      </div>

      {!cargando && datos && datos.totalPaginas > 1 && (
        <div className="mt-8">
          <Paginacion pagina={datos.pagina} totalPaginas={datos.totalPaginas} onCambiar={irPagina} />
        </div>
      )}
    </div>
  )
}
