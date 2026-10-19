import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpen, Brain, ChevronDown, Compass, Eye, Footprints, History, Lightbulb, RefreshCw, Wind } from 'lucide-react'
import { cn } from 'cn'
import { api, mensajeDe } from '@/api/client'
import type { ErroresDelEstudiante } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { pct } from '@/utils/formato'

const TIPOS = [
  {
    tipo: 'Error cognitivo', nombre: 'Conceptos por reforzar', etiqueta: 'Cognitivo', icono: Brain,
    color: 'var(--color-violeta-600)', fondo: 'bg-violeta-50', borde: 'border-violeta-200', texto: 'text-violeta-700',
    descripcion: 'Una oportunidad para volver a las bases y conectar las ideas.',
    pista: 'Vuelve al concepto, paso a paso.',
    consejo: 'Antes de pasar al siguiente ejercicio, revisa la explicación y trata de contar con tus palabras por qué esa respuesta es la correcta.',
    pasos: ['Lee la retroalimentación del intento.', 'Identifica el concepto que necesitas repasar.', 'Resuelve otro ejercicio del mismo componente.'],
  },
  {
    tipo: 'Error de hábito', nombre: 'Atención a los detalles', etiqueta: 'Hábito', icono: Eye,
    color: 'var(--color-teal-600)', fondo: 'bg-teal-50', borde: 'border-teal-200', texto: 'text-teal-700',
    descripcion: 'En un tema que conoces, un pequeño detalle puede cambiar la respuesta.',
    pista: 'Dale una segunda mirada.',
    consejo: 'Haz una comprobación breve antes de responder: qué te preguntan, qué datos tienes y si tu resultado tiene sentido.',
    pasos: ['Lee de nuevo lo que pide el enunciado.', 'Revisa signos, unidades y operaciones.', 'Comprueba tu respuesta antes de enviarla.'],
  },
  {
    tipo: 'Error de ansiedad', nombre: 'Una pausa para responder', etiqueta: 'Ansiedad', icono: Wind,
    color: 'var(--color-ocre-600)', fondo: 'bg-ocre-50', borde: 'border-ocre-200', texto: 'text-ocre-700',
    descripcion: 'A veces una respuesta falla incluso cuando te sientes muy seguro.',
    pista: 'Baja el ritmo. Revisa tu razonamiento.',
    consejo: 'Date unos segundos para respirar y revisar el camino que seguiste. Estar seguro es valioso; comprobarlo también.',
    pasos: ['Haz una pausa y respira con calma.', 'Vuelve a recorrer tu razonamiento.', 'Elige tu respuesta después de comprobarla.'],
  },
] as const

function Distribucion({ datos }: { datos: ErroresDelEstudiante }) {
  const clasificados = datos.totalIncorrectos - datos.sinClasificar
  let recorrido = 0
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center lg:gap-7">
      <div className="relative size-48 shrink-0 sm:size-52">
        <svg viewBox="0 0 200 200" className="size-full -rotate-90" role="img" aria-label={`Distribución de ${clasificados} respuestas incorrectas clasificadas`}>
          <circle cx="100" cy="100" r="82" fill="none" stroke="var(--color-hueso)" strokeWidth="17" />
          {TIPOS.map(t => {
            const cantidad = datos.distribucion.find(d => d.tipo === t.tipo)?.cantidad ?? 0
            const porcentaje = clasificados ? cantidad * 100 / clasificados : 0
            const inicio = recorrido
            recorrido += porcentaje
            return porcentaje > 0 && <circle key={t.tipo} cx="100" cy="100" r="82" fill="none" stroke={t.color}
              strokeWidth="17" pathLength="100" strokeDasharray={`${Math.max(0, porcentaje - (porcentaje < 100 ? 1.5 : 0))} 100`}
              strokeDashoffset={-inicio} />
          })}
        </svg>
        <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-titular text-[44px] leading-none font-bold tracking-tight text-marino-800">{clasificados}</span>
          <span className="mt-2 text-center text-xs leading-4 text-texto-suave">{clasificados === 1 ? 'respuesta para' : 'respuestas para'}<br />seguir aprendiendo</span>
        </div>
      </div>
      <ul className="w-full space-y-4 sm:w-auto sm:min-w-44">
        {TIPOS.map(t => {
          const d = datos.distribucion.find(d => d.tipo === t.tipo)
          return <li key={t.tipo} className="flex items-center gap-2.5 text-sm">
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="flex-1 text-texto-suave">{t.etiqueta}</span>
            <span className="ml-5 font-titular font-bold tabular-nums text-marino-800">{pct(d?.porcentaje ?? 0)}</span>
          </li>
        })}
      </ul>
    </div>
  )
}

function CargandoErrores() {
  return <div role="status" className="space-y-5">
    <span className="sr-only">Cargando tus patrones y recomendaciones</span>
    <Skeleton className="h-72 w-full rounded-panel" />
    <div className="grid gap-4 md:grid-cols-3">{TIPOS.map(t => <Skeleton key={t.tipo} className="h-64 w-full rounded-tarjeta-lg" />)}</div>
  </div>
}

export function ErroresPage() {
  const [componente, setComponente] = useState('')
  const [datos, setDatos] = useState<ErroresDelEstudiante | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [reintento, setReintento] = useState(0)
  const [abierto, setAbierto] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setCargando(true)
    setError(null)
    api<ErroresDelEstudiante>(`/estadisticas/errores${componente ? `?componente=${componente}` : ''}`, { signal: controller.signal })
      .then(d => {
        if (controller.signal.aborted) return
        setDatos(d)
        setAbierto(d.tipoPredominante)
      })
      .catch(e => { if (!controller.signal.aborted) setError(mensajeDe(e)) })
      .finally(() => { if (!controller.signal.aborted) setCargando(false) })
    return () => controller.abort()
  }, [componente, reintento])

  const practica = componente ? `/banco?componente=${componente}` : '/banco'
  const clasificados = datos ? datos.totalIncorrectos - datos.sinClasificar : 0
  const predominante = TIPOS.find(t => t.tipo === datos?.tipoPredominante)
  const nombreComponente = datos?.componentesConIntentos.find(c => String(c.id) === componente)?.nombre

  return <div className="space-y-8 sm:space-y-10">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-ocre-700 uppercase"><Compass className="size-4" aria-hidden="true" /> Tu ruta de aprendizaje</p>
        <h1 className="text-3xl font-bold text-marino-800 sm:text-[36px] sm:leading-tight">Mis errores</h1>
        <p className="mt-2 text-texto-suave">Entiende lo que pasó. Descubre qué intentar después.</p>
      </div>
      <Link to="/historial" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-marino-800 underline-offset-4 hover:underline"><History className="size-4" aria-hidden="true" /> Revisar mis intentos <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
    </div>

    <section data-sobre-marino className="relative isolate overflow-hidden rounded-panel bg-marino-800 p-6 text-white sm:p-9 lg:px-10 lg:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 -right-4 size-56 rounded-full border border-white/10" />
      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white"><span aria-hidden="true" className="size-1.5 rounded-full bg-ambar-500" /> Cada intento cuenta</span>
          <h2 className="mt-5 text-[28px] leading-[1.15] font-bold tracking-tight sm:text-[34px]">Un error no te define.<br /><span className="text-ambar-500">Te muestra por dónde seguir.</span></h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-marino-100">Aquí tus respuestas se convierten en pistas: qué repasar, dónde prestar atención y cuándo hacer una pausa.</p>
        </div>
        <div className="shrink-0 lg:max-w-64">
          <Button asChild variant="acento" size="lg" className="w-full sm:w-auto lg:w-full"><Link to={practica}>Seguir practicando <ArrowRight aria-hidden="true" /></Link></Button>
          <p className="mt-3 text-xs leading-relaxed text-marino-200">{nombreComponente ? `Vuelve a intentarlo en ${nombreComponente.toLowerCase()}.` : 'Un ejercicio a la vez, a tu ritmo.'}</p>
        </div>
      </div>
    </section>

    <section aria-labelledby="patrones-titulo" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h2 id="patrones-titulo" className="text-xl font-bold text-marino-800 sm:text-2xl">Las pistas de tus respuestas</h2><p className="mt-1 text-sm text-texto-suave">Mira el panorama completo o explora un componente.</p></div>
        <label className="relative block w-full sm:w-60">
          <span className="mb-1.5 block text-xs font-bold text-texto-suave">Componente</span>
          <select value={componente} onChange={e => setComponente(e.target.value)} className="h-12 w-full appearance-none rounded-control border-2 border-borde-fuerte bg-superficie pr-10 pl-4 text-sm font-bold text-marino-800 transition-colors hover:border-marino-200">
            <option value="">Todos los componentes</option>
            {datos?.componentesConIntentos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select><ChevronDown className="pointer-events-none absolute right-3.5 bottom-4 size-4 text-texto-suave" aria-hidden="true" />
        </label>
      </div>

      <div aria-busy={cargando}>
        {cargando && <CargandoErrores />}
        {!cargando && error && <div className="panel space-y-4 p-6"><Aviso>{error}</Aviso><Button onClick={() => setReintento(n => n + 1)} variant="contorno"><RefreshCw aria-hidden="true" /> Volver a intentar</Button></div>}
        {!cargando && !error && datos && <>
          <p role="status" className="sr-only">{datos.totalIncorrectos} respuestas incorrectas{nombreComponente ? ` en ${nombreComponente}` : ''}; {clasificados} clasificadas.</p>
          {datos.totalIncorrectos === 0 ? <EstadoVacio
            titulo={componente ? 'Un nuevo componente, nuevas oportunidades' : 'Tu próxima pista empieza practicando'}
            descripcion={componente ? 'Todavía no hay respuestas incorrectas en este componente. Puedes seguir practicando o explorar todos los componentes.' : 'Cuando una respuesta no salga como esperabas, aquí encontrarás pistas para entenderla y volver a intentarlo.'}
            accion={<div className="flex flex-wrap justify-center gap-3"><Button asChild variant="acento"><Link to={practica}>Ir a practicar <ArrowRight aria-hidden="true" /></Link></Button>{componente && <Button variant="contorno" onClick={() => setComponente('')}>Ver todos</Button>}</div>}
          /> : <div className="space-y-5">
            <div className="panel grid gap-7 p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-12">
              <Distribucion datos={datos} />
              <div className="border-t border-borde pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-texto-suave uppercase"><Lightbulb className="size-4 text-ocre-600" aria-hidden="true" /> {predominante ? 'Una pista para empezar' : 'Tu punto de partida'}</span>
                <h3 className="mt-3 text-2xl leading-tight font-bold text-marino-800">{predominante?.pista ?? (clasificados ? 'Cada patrón tiene algo que enseñarte.' : 'Tus próximos intentos nos darán más pistas.')}</h3>
                <p className="mt-3 text-sm leading-relaxed text-texto-suave">{predominante?.consejo ?? (clasificados ? 'No hay un tipo que reúna más de la mitad de tus errores. Explora las tres pistas de abajo y elige la que más te ayude hoy.' : 'Los intentos anteriores se conservan, aunque no tengan un tipo de error registrado. Sigue practicando para descubrir tus patrones.')}</p>
                <p className="mt-4 text-xs text-texto-suave">{clasificados} {clasificados === 1 ? 'respuesta incorrecta clasificada' : 'respuestas incorrectas clasificadas'}{nombreComponente ? ` · ${nombreComponente}` : ' · Todos los componentes'}</p>
              </div>
            </div>

            <div className="grid items-start gap-4 md:grid-cols-3">
              {TIPOS.map((t, i) => {
                const d = datos.distribucion.find(d => d.tipo === t.tipo)
                const Icono = t.icono
                const expandido = abierto === t.tipo
                const principal = datos.tipoPredominante === t.tipo
                return <article key={t.tipo} className={cn('overflow-hidden rounded-tarjeta-lg border-2 border-b-[5px] bg-superficie', t.borde)}>
                  <div className="p-5 xl:p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('grid size-11 place-items-center rounded-control', t.fondo, t.texto)}><Icono className="size-6" aria-hidden="true" /></span>
                      {principal ? <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', t.fondo, t.texto)}>Tu pista principal</span> : <span className="text-xs text-texto-suave">{d?.cantidad ?? 0} {(d?.cantidad ?? 0) === 1 ? 'respuesta' : 'respuestas'}</span>}
                    </div>
                    <div className="mt-5 flex items-end gap-2"><span className={cn('font-titular text-[34px] leading-none font-bold tabular-nums', t.texto)}>{pct(d?.porcentaje ?? 0)}</span><span className="pb-0.5 text-xs text-texto-suave">de tus errores clasificados</span></div>
                    <h3 className="mt-4 text-lg font-bold text-marino-800">{t.nombre}</h3>
                    <p className={cn('mt-1 text-xs font-bold', t.texto)}>Error {t.etiqueta === 'Cognitivo' ? 'cognitivo' : `de ${t.etiqueta.toLowerCase()}`}</p>
                    <p className="mt-3 min-h-16 text-sm leading-relaxed text-texto-suave">{t.descripcion}</p>
                    <button type="button" aria-expanded={expandido} aria-controls={`consejo-error-${i}`} onClick={() => setAbierto(expandido ? null : t.tipo)} className={cn('mt-4 flex min-h-11 w-full items-center justify-between gap-2 border-t pt-3 text-left text-sm font-bold', t.borde, t.texto)}>
                      {expandido ? 'Ocultar consejo' : 'Qué puedo hacer'}<ChevronDown className={cn('size-4 shrink-0 transition-transform', expandido && 'rotate-180')} aria-hidden="true" />
                    </button>
                  </div>
                  <div id={`consejo-error-${i}`} hidden={!expandido} className={cn('border-t px-5 py-5 xl:px-6', t.fondo, t.borde)}>
                    <ol className="space-y-3">{t.pasos.map((paso, n) => <li key={paso} className="flex gap-2.5 text-sm leading-relaxed text-marino-800"><span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-superficie text-xs font-bold', t.texto)}>{n + 1}</span><span>{paso}</span></li>)}</ol>
                    <Link to={t.tipo === 'Error cognitivo' ? '/historial' : practica} className={cn('mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold underline-offset-4 hover:underline', t.texto)}>{t.tipo === 'Error cognitivo' ? 'Revisar una explicación' : 'Ponerlo en práctica'}<ArrowRight className="size-4" aria-hidden="true" /></Link>
                  </div>
                </article>
              })}
            </div>
            {datos.sinClasificar > 0 && <p className="flex items-start gap-2 rounded-control bg-hueso px-4 py-3 text-xs leading-relaxed text-texto-suave"><History className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{datos.sinClasificar} {datos.sinClasificar === 1 ? 'intento anterior no tiene clasificación y no se incluye' : 'intentos anteriores no tienen clasificación y no se incluyen'} en estos porcentajes. Puedes consultarlos en tu historial.</p>}
          </div>}
        </>}
      </div>
    </section>

    <section className="flex flex-col gap-5 rounded-panel border border-borde-fuerte bg-hueso p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div className="flex items-start gap-4"><span className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-superficie text-marino-700 sm:flex"><Footprints className="size-5" aria-hidden="true" /></span><div><h2 className="text-lg font-bold text-marino-800">Una pista. Un nuevo intento.</h2><p className="mt-1 max-w-lg text-sm text-texto-suave">Elige un consejo y llévalo al siguiente ejercicio. Aprender también es volver a intentarlo.</p></div></div>
      <Button asChild variant="contorno" className="w-full sm:w-auto"><Link to={practica}>Volver a mi ruta <ArrowRight aria-hidden="true" /></Link></Button>
    </section>
    <details className="group text-sm text-texto-suave">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 py-1 font-bold text-marino-700"><BookOpen className="size-4" aria-hidden="true" /> ¿Cómo leer estas pistas? <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
      <p className="mt-3 max-w-3xl leading-relaxed">Se analizan tus respuestas incorrectas, tu confianza al responder y tus resultados anteriores. Los porcentajes corresponden a los errores clasificados en el componente que elegiste. Son pistas para orientar tu práctica, no etiquetas sobre ti. La pista principal aparece cuando un tipo supera el 50 %.</p>
    </details>
  </div>
}
