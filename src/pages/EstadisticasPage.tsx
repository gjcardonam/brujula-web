import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, mensajeDe } from '@/api/client'
import type { Estadisticas, PorArea } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { BarraDeDesempeno, Cifra } from '@/components/Desempeno'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { duracion, numero, porcentaje } from '@/utils/formato'

function Seccion({ id, titulo, descripcion, children }: { id: string; titulo: string; descripcion?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="tarjeta px-6 py-5">
      <h2 id={id} className="text-lg font-bold text-marino-800">{titulo}</h2>
      {descripcion && <p className="text-sm text-texto-suave">{descripcion}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ListaDeAreas({ areas, esComponente }: { areas: PorArea[]; esComponente?: boolean }) {
  const conIntentos = areas.filter(a => a.intentados > 0)
  if (conIntentos.length === 0) return <p className="text-sm text-texto-suave">Todavía no hay intentos.</p>
  return (
    <ul className="divide-y divide-borde">
      {conIntentos.map(a => (
        <BarraDeDesempeno
          key={a.id}
          nombre={a.nombre}
          valor={a.porcentajeAciertos}
          esComponente={esComponente}
          detalle={
            esComponente
              ? `${a.intentados} ${a.intentados === 1 ? 'intento' : 'intentos'} · ${a.correctas} ${a.correctas === 1 ? 'correcta' : 'correctas'} · ${a.incorrectas} ${a.incorrectas === 1 ? 'incorrecta' : 'incorrectas'} (${porcentaje(a.porcentajeDesaciertos)})`
              : `${a.intentados} ${a.intentados === 1 ? 'intento' : 'intentos'}`
          }
        />
      ))}
    </ul>
  )
}

export function EstadisticasPage() {
  const [datos, setDatos] = useState<Estadisticas | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    let vivo = true
    setError(null)
    api<Estadisticas>('/estadisticas/mias')
      .then(d => { if (vivo) setDatos(d) })
      .catch(e => { if (vivo) setError(mensajeDe(e)) })
    return () => { vivo = false }
  }, [reintento])

  const cabecera = (
    <header>
      <h1 className="text-2xl font-bold text-marino-800 sm:text-3xl">Mis estadísticas</h1>
      <p className="mt-1.5 text-base text-texto-suave">Cómo vas en la práctica y en los simulacros.</p>
    </header>
  )

  if (error) {
    return (
      <div className="animate-entrar space-y-6">
        {cabecera}
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
      </div>
    )
  }

  if (!datos) {
    return (
      <div className="space-y-6">
        {cabecera}
        <div aria-busy="true" aria-live="polite" className="space-y-6">
          <span className="sr-only">Cargando tus estadísticas</span>
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[92px] rounded-tarjeta-lg" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-[260px] rounded-tarjeta-lg" />
            <Skeleton className="h-[260px] rounded-tarjeta-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (datos.sinDatos) {
    return (
      <div className="animate-entrar space-y-6">
        {cabecera}
        <EstadoVacio
          titulo="Todavía no hay nada que medir"
          descripcion="Resuelve ejercicios o haz un simulacro y aquí verás cómo vas en cada componente y competencia."
          accion={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="acento"><Link to="/banco">Ir a practicar</Link></Button>
              <Button asChild variant="contorno"><Link to="/simulacros">Hacer un simulacro</Link></Button>
            </div>
          }
        />
      </div>
    )
  }

  const { resumen, simulacros } = datos
  const porConfianza = datos.porConfianza.filter(c => c.intentados > 0).sort((a, b) => a.nivel - b.nivel)

  return (
    <div className="animate-entrar space-y-8">
      {cabecera}

      <section aria-label="Resumen general" className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Cifra valor={resumen.intentados} etiqueta={resumen.intentados === 1 ? 'Ejercicio intentado' : 'Ejercicios intentados'} />
        <Cifra
          valor={resumen.intentados > 0 ? porcentaje(resumen.porcentajeAciertos) : '—'}
          etiqueta="De aciertos"
          detalle={resumen.intentados > 0 ? `${porcentaje(resumen.porcentajeDesaciertos)} de desaciertos` : undefined}
        />
        <Cifra valor={resumen.correctas} etiqueta={resumen.correctas === 1 ? 'Correcta' : 'Correctas'} />
        <Cifra valor={resumen.incorrectas} etiqueta={resumen.incorrectas === 1 ? 'Incorrecta' : 'Incorrectas'} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Seccion id="titulo-componentes" titulo="Por componente">
          <ListaDeAreas areas={datos.porComponente} esComponente />
        </Seccion>
        <Seccion id="titulo-competencias" titulo="Por competencia">
          <ListaDeAreas areas={datos.porCompetencia} />
        </Seccion>
      </div>

      <Seccion
        id="titulo-confianza"
        titulo="Según tu confianza"
        descripcion="Cuántas acertaste según lo seguro que dijiste estar."
      >
        {porConfianza.length === 0 ? (
          <p className="text-sm text-texto-suave">Todavía no hay intentos.</p>
        ) : (
          <div className="-mx-6 overflow-x-auto px-6">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-borde text-xs tracking-[0.06em] text-texto-suave uppercase">
                  <th scope="col" className="py-2.5 pr-4 font-bold">Confianza</th>
                  <th scope="col" className="py-2.5 pr-4 font-bold">Intentos</th>
                  <th scope="col" className="py-2.5 pr-4 font-bold">Correctas</th>
                  <th scope="col" className="py-2.5 font-bold">Incorrectas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {porConfianza.map(c => (
                  <tr key={c.nivel}>
                    <th scope="row" className="py-3 pr-4">
                      <span className="inline-grid size-9 place-items-center rounded-control border-2 border-borde-fuerte font-titular text-base font-bold text-marino-800">
                        {c.nivel}
                      </span>
                      <span className="sr-only"> de 5</span>
                    </th>
                    <td className="py-3 pr-4 font-bold text-marino-800">{c.intentados}</td>
                    <td className="py-3 pr-4 text-marino-800">
                      <span className="font-bold text-exito-700">{c.correctas}</span>{' '}
                      <span className="text-texto-suave">({porcentaje(c.porcentajeCorrectas)})</span>
                    </td>
                    <td className="py-3 text-marino-800">
                      <span className="font-bold text-error-700">{c.incorrectas}</span>{' '}
                      <span className="text-texto-suave">({porcentaje(c.porcentajeIncorrectas)})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>

      <section aria-labelledby="titulo-simulacros" className="space-y-4">
        <h2 id="titulo-simulacros" className="text-xl font-bold text-marino-800">Simulacros</h2>
        {simulacros.cantidad === 0 ? (
          <div className="tarjeta flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base text-texto-suave">Aún no has terminado ningún simulacro.</p>
            <Button asChild variant="contorno" size="sm"><Link to="/simulacros">Hacer un simulacro</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
            <Cifra valor={simulacros.cantidad} etiqueta={simulacros.cantidad === 1 ? 'Simulacro realizado' : 'Simulacros realizados'} />
            <Cifra valor={porcentaje(simulacros.porcentajePromedioAciertos)} etiqueta="Aciertos en promedio" />
            <Cifra valor={numero(simulacros.promedioEjercicios)} etiqueta="Ejercicios por simulacro" />
            <Cifra valor={duracion(simulacros.tiempoPromedioSeg)} etiqueta="Tiempo promedio" />
            <Cifra valor={numero(simulacros.ejerciciosPorHora)} etiqueta="Ejercicios por hora" />
          </div>
        )}
      </section>
    </div>
  )
}
