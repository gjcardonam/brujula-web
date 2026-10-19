import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { api, mensajeDe, urlDeArchivo } from '@/api/client'
import type { EjercicioAdmin } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { fecha, nombreDeError, pct } from '@/utils/formato'

function Esqueleto() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="panel space-y-5 p-6 sm:p-7">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-20 w-full rounded-control" />
        <Skeleton className="h-40 w-full rounded-tarjeta" />
      </div>
      <div className="space-y-6">
        <div className="panel space-y-4 p-6 sm:p-7">
          <Skeleton className="h-6 w-44" />
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
        <div className="panel space-y-4 p-6 sm:p-7">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-16 w-full rounded-control" />
        </div>
      </div>
    </div>
  )
}

function BarraDeError({ tipo, porcentaje }: { tipo: string; porcentaje: number }) {
  const ancho = Math.max(0, Math.min(100, porcentaje))
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-marino-800">{nombreDeError(tipo)}</span>
        <span className="text-sm text-texto-suave">{pct(porcentaje)}</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-hueso">
        <div className="h-full rounded-full bg-marino-700" style={{ width: `${ancho}%` }} />
      </div>
    </div>
  )
}

export function EjercicioDetallePage() {
  const { id } = useParams()
  const [ejercicio, setEjercicio] = useState<EjercicioAdmin | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    let vivo = true
    api<EjercicioAdmin>(`/ejercicios/${id}`)
      .then(e => { if (vivo) setEjercicio(e) })
      .catch(e => { if (vivo) setError(mensajeDe(e)) })
    return () => { vivo = false }
  }, [id])

  async function cambiarEstado() {
    if (!ejercicio) return
    const nuevo = ejercicio.estado === 'Activo' ? 'Desactivado' : 'Activo'
    setProcesando(true)
    try {
      const r = await api<EjercicioAdmin>(`/ejercicios/${ejercicio.id}/estado`, {
        method: 'PATCH',
        body: { estado: nuevo },
      })
      setEjercicio(r)
      setConfirmar(false)
      toast(nuevo === 'Activo' ? `Activamos el ejercicio ${r.numero}` : `Desactivamos el ejercicio ${r.numero}`, {
        description: nuevo === 'Activo'
          ? 'Ya está disponible para los estudiantes.'
          : 'Dejó de estar disponible, pero conserva sus intentos.',
      })
    } catch (e) {
      setError(mensajeDe(e))
      setConfirmar(false)
    } finally {
      setProcesando(false)
    }
  }

  if (error && !ejercicio) {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <Aviso>{error}</Aviso>
        <Button asChild variant="contorno"><Link to="/admin/banco">Volver al banco</Link></Button>
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

  const activo = ejercicio.estado === 'Activo'
  const uso = ejercicio.uso

  return (
    <div className="animate-entrar space-y-6">
      <header>
        <Link
          to="/admin/banco"
          className="inline-flex items-center gap-2 text-sm font-bold text-texto-suave transition-colors hover:text-marino-800"
        >
          <ArrowLeft className="size-[17px]" aria-hidden="true" />
          Volver al banco
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-marino-800 sm:text-3xl">Ejercicio {ejercicio.numero}</h1>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold',
              activo ? 'bg-exito-50 text-exito-700' : 'bg-marino-100 text-texto-suave',
            )}
          >
            <span aria-hidden="true" className={cn('size-1.5 rounded-full', activo ? 'bg-exito-600' : 'bg-texto-tenue')} />
            {ejercicio.estado}
          </span>
        </div>
      </header>

      {error && <Aviso>{error}</Aviso>}

      <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="panel space-y-5 p-6 sm:p-7">
          <h2 className="text-xl font-bold text-marino-800">Contenido</h2>
          <p className="text-md leading-relaxed whitespace-pre-wrap text-marino-800">{ejercicio.enunciado}</p>
          {ejercicio.imagenEnunciado && (
            <img
              src={urlDeArchivo(ejercicio.imagenEnunciado)}
              alt="Imagen del enunciado"
              className="max-h-72 rounded-ficha border border-borde"
            />
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-borde-fuerte text-xs font-bold tracking-wide text-texto-suave uppercase">
                  <th scope="col" className="w-10 py-2.5">Respuesta</th>
                  <th scope="col" className="py-2.5">Opción</th>
                  <th scope="col" className="py-2.5">Retroalimentación</th>
                  <th scope="col" className="py-2.5">Tipo de error</th>
                </tr>
              </thead>
              <tbody>
                {ejercicio.opciones.map(o => (
                  <tr key={o.id} className={cn('border-b border-borde align-top', o.esCorrecta && 'bg-exito-50')}>
                    <td className="py-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'grid size-7 place-items-center rounded-ficha text-xs font-bold',
                          o.esCorrecta ? 'bg-exito-600 text-white' : 'bg-hueso text-texto-suave',
                        )}
                      >
                        {o.letra}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-bold text-marino-800">{o.descripcion ?? '—'}</span>
                      {o.imagen && (
                        <img src={urlDeArchivo(o.imagen)} alt={`Opción ${o.letra}`} className="mt-2 max-h-20 rounded-ficha border border-borde" />
                      )}
                    </td>
                    <td className="py-3 pr-4 text-texto-suave">{o.retroalimentacion}</td>
                    <td className="py-3 text-texto-suave">
                      {o.esCorrecta ? '—' : o.tipoError ? o.tipoError.nombre : 'Sin clasificar'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-borde pt-5">
            <Button asChild variant="contorno">
              <Link to={`/admin/ejercicios/${ejercicio.id}/editar`}>Editar</Link>
            </Button>
            <Button type="button" variant={activo ? 'contorno' : 'acento'} onClick={() => setConfirmar(true)}>
              {activo ? 'Desactivar' : 'Activar'}
            </Button>
            <Button asChild variant="fantasma">
              <Link to="/admin/banco">Volver al banco</Link>
            </Button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="panel p-6 sm:p-7">
            <h2 className="text-xl font-bold text-marino-800">Información administrativa</h2>
            <dl className="mt-4 divide-y divide-borde text-sm">
              {[
                ['Componente', ejercicio.componente.nombre],
                ['Competencia', ejercicio.competencia.nombre],
                ['Nivel', ejercicio.nivel.nombre],
                ['Estado', ejercicio.estado],
                ['Creado por', ejercicio.creadoPor],
                ['Fecha de creación', fecha(ejercicio.creadoEn)],
              ].map(([etiqueta, valor]) => (
                <div key={etiqueta} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-texto-suave">{etiqueta}</dt>
                  <dd className="text-right font-bold text-marino-800">{valor}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="panel space-y-4 p-6 sm:p-7">
            <h2 className="text-xl font-bold text-marino-800">Desempeño histórico</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-tarjeta border-2 border-borde bg-hueso p-4 text-center">
                <div className="font-titular text-2xl font-bold text-marino-800">{uso.intentos}</div>
                <div className="text-xs text-texto-suave">Intentos</div>
              </div>
              <div className="rounded-tarjeta border-2 border-borde bg-hueso p-4 text-center">
                <div className="font-titular text-2xl font-bold text-marino-800">
                  {uso.intentos === 0 ? '—' : pct(uso.porcentajeAciertos)}
                </div>
                <div className="text-xs text-texto-suave">Aciertos</div>
              </div>
            </div>

            {uso.errores.length === 0 ? (
              <p className="text-sm text-texto-suave">
                Aún no hay intentos incorrectos clasificados para este ejercicio.
              </p>
            ) : (
              <div className="space-y-3.5">
                <p className="text-sm font-bold text-marino-800">Distribución de errores</p>
                {uso.errores.map(d => <BarraDeError key={d.tipo} tipo={d.tipo} porcentaje={d.porcentaje} />)}
              </div>
            )}

            <p className="text-xs text-texto-suave">Consultar el detalle no modifica el ejercicio ni sus intentos.</p>
          </section>
        </div>
      </div>

      <Dialog open={confirmar} onOpenChange={setConfirmar}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {activo ? `¿Desactivar el ejercicio ${ejercicio.numero}?` : `¿Activar el ejercicio ${ejercicio.numero}?`}
            </DialogTitle>
            <DialogDescription>
              {activo
                ? `Dejará de estar disponible para los estudiantes. No se elimina y conserva sus ${uso.intentos} ${uso.intentos === 1 ? 'intento' : 'intentos'}.`
                : 'Volverá a estar disponible para los estudiantes en el banco y en los filtros.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button type="button" variant={activo ? 'principal' : 'acento'} disabled={procesando} onClick={cambiarEstado}>
              {procesando && <Loader2 className="animate-spin" aria-hidden="true" />}
              {activo ? 'Desactivar' : 'Activar'}
            </Button>
            <Button type="button" variant="contorno" onClick={() => setConfirmar(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
