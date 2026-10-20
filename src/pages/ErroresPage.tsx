import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpen, Brain, ChevronDown, Compass, Eye, Footprints, History, Lightbulb, RefreshCw, Wind } from 'lucide-react'
import { cn } from 'cn'
import { api, mensajeDe } from '@/api/client'
import type { ErroresDelEstudiante } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { Campo } from '@/components/Campo'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { pct } from '@/utils/formato'

const TIPOS = [
  {
    tipo: 'Error cognitivo', nombre: 'Te falta el concepto', etiqueta: 'Cognitivo', icono: Brain,
    color: 'var(--color-violeta-600)', fondo: 'bg-violeta-50', borde: 'border-violeta-200', texto: 'text-violeta-700',
    descripcion: 'No venías acertando en ese tema y no estabas seguro de tu respuesta. Lo más probable es que haga falta repasar la teoría.',
    pista: 'Repasa el concepto antes de seguir practicando.',
    consejo: 'La mayoría de tus errores vienen de temas que todavía no dominas. Lee la explicación de los ejercicios que fallaste y luego resuelve uno parecido sin mirar la respuesta.',
    pasos: ['Abre el ejercicio en tu historial y lee por qué tu opción no era la correcta.', 'Repasa el tema: la definición, la fórmula o el procedimiento.', 'Resuelve otro ejercicio del mismo componente.'],
  },
  {
    tipo: 'Error de hábito', nombre: 'Un descuido', etiqueta: 'Hábito', icono: Eye,
    color: 'var(--color-teal-600)', fondo: 'bg-teal-50', borde: 'border-teal-200', texto: 'text-teal-700',
    descripcion: 'Fallaste en un tema en el que venías acertando. Suele ser un signo, una unidad o una pregunta leída muy rápido.',
    pista: 'Lee el enunciado con calma antes de responder.',
    consejo: 'Sabes resolver estos ejercicios, pero se te están escapando detalles. Antes de marcar, vuelve a leer qué te preguntan y revisa tus operaciones.',
    pasos: ['Identifica qué te piden calcular antes de empezar.', 'Revisa signos, unidades, decimales y porcentajes.', 'Antes de confirmar, mira si el resultado tiene sentido.'],
  },
  {
    tipo: 'Error de ansiedad', nombre: 'Seguro, pero incorrecto', etiqueta: 'Ansiedad', icono: Wind,
    color: 'var(--color-ocre-600)', fondo: 'bg-ocre-50', borde: 'border-ocre-200', texto: 'text-ocre-700',
    descripcion: 'Marcaste que estabas seguro y la respuesta no era la correcta. Pasa mucho cuando se responde rápido o con presión.',
    pista: 'Practica con tiempo medido, como en la prueba.',
    consejo: 'Muchas de tus respuestas incorrectas las marcaste con confianza alta. Practica con un tiempo límite para acostumbrarte a la presión y revisa tu procedimiento antes de confirmar.',
    pasos: ['Ponte un tiempo por ejercicio, como en el Saber 11.', 'Antes de confirmar, revisa tu procedimiento una vez.', 'Si dudas, marca una confianza más baja: también es información útil.'],
  },
] as const

const TODOS = 'todos'

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
          <span className="mt-2 text-center text-xs leading-4 text-texto-suave">{clasificados === 1 ? 'respuesta' : 'respuestas'}<br />{clasificados === 1 ? 'incorrecta' : 'incorrectas'}</span>
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
    <span className="sr-only">Cargando tus errores</span>
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
        <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-ocre-700 uppercase"><Compass className="size-4" aria-hidden="true" /> Tu progreso</p>
        <h1 className="text-2xl font-bold text-marino-800 sm:text-3xl">Mis errores</h1>
        <p className="mt-1.5 text-base text-texto-suave">Entiende por qué fallaste y qué hacer en el próximo ejercicio.</p>
      </div>
      <Link to="/historial" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-texto-suave underline-offset-4 transition-colors hover:text-marino-800 hover:underline"><History className="size-4" aria-hidden="true" /> Ver mi historial <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
    </div>

    <section data-sobre-marino className="relative isolate overflow-hidden rounded-panel bg-marino-800 p-6 text-white sm:p-9 lg:px-10 lg:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 -right-4 size-56 rounded-full border border-white/10" />
      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white"><span aria-hidden="true" className="size-1.5 rounded-full bg-ambar-500" /> Saber 11 · Matemáticas</span>
          <h2 className="mt-5 text-[28px] leading-[1.15] font-bold tracking-tight sm:text-[34px]">Revisa en qué te equivocas<br /><span className="text-ambar-500">y llega mejor preparado a la prueba.</span></h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-marino-100">Cada vez que fallas un ejercicio, Brújula mira qué tan seguro estabas y cómo te ha ido en ese tema para darte una idea de qué pasó.</p>
        </div>
        <div className="shrink-0 lg:max-w-64">
          <Button asChild variant="acento" size="lg" className="w-full sm:w-auto lg:w-full"><Link to={practica}>Seguir practicando <ArrowRight aria-hidden="true" /></Link></Button>
          <p className="mt-3 text-xs leading-relaxed text-marino-200">{nombreComponente ? `Ejercicios de ${nombreComponente.toLowerCase()}.` : 'Ejercicios de todos los componentes.'}</p>
        </div>
      </div>
    </section>

    <section aria-labelledby="patrones-titulo" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h2 id="patrones-titulo" className="text-xl font-bold text-marino-800 sm:text-2xl">Tipos de error</h2><p className="mt-1 text-sm text-texto-suave">Filtra por componente para ver dónde se concentran.</p></div>
        <Campo etiqueta="Componente" className="w-full sm:w-60">
          {p => (
            <Select value={componente || TODOS} onValueChange={v => setComponente(v === TODOS ? '' : v)}>
              <SelectTrigger {...p} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos los componentes</SelectItem>
                {datos?.componentesConIntentos.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </Campo>
      </div>

      <div aria-busy={cargando}>
        {cargando && <CargandoErrores />}
        {!cargando && error && <div className="panel space-y-4 p-6"><Aviso>{error}</Aviso><Button onClick={() => setReintento(n => n + 1)} variant="contorno"><RefreshCw aria-hidden="true" /> Volver a intentar</Button></div>}
        {!cargando && !error && datos && <>
          <p role="status" className="sr-only">{datos.totalIncorrectos} respuestas incorrectas{nombreComponente ? ` en ${nombreComponente}` : ''}; {clasificados} clasificadas.</p>
          {datos.totalIncorrectos === 0 ? <EstadoVacio
            titulo={componente ? `No tienes respuestas incorrectas en ${nombreComponente ?? 'este componente'}` : 'Aún no hay suficiente información'}
            descripcion={componente ? 'Aún no hay suficiente información para mostrar tus errores en este componente.' : 'Cuando respondas mal algún ejercicio, aquí vas a ver por qué pudo pasar y qué puedes hacer.'}
            accion={<div className="flex flex-wrap justify-center gap-3"><Button asChild variant="acento"><Link to={practica}>Ir a practicar <ArrowRight aria-hidden="true" /></Link></Button>{componente && <Button variant="contorno" onClick={() => setComponente('')}>Ver todos</Button>}</div>}
          /> : <div className="space-y-5">
            <div className="panel grid gap-7 p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-12">
              <Distribucion datos={datos} />
              <div className="border-t border-borde pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-texto-suave uppercase"><Lightbulb className="size-4 text-ocre-600" aria-hidden="true" /> {predominante ? 'Lo que más se repite' : 'Resumen'}</span>
                <h3 className="mt-3 text-2xl leading-tight font-bold text-marino-800">{predominante?.pista ?? (clasificados ? 'Tus errores están repartidos.' : 'Aún no hay suficiente información.')}</h3>
                <p className="mt-3 text-sm leading-relaxed text-texto-suave">{predominante?.consejo ?? (clasificados ? 'Ningún tipo de error pasa de la mitad. Revisa los tres y empieza por el que tenga más respuestas.' : 'Tus respuestas incorrectas anteriores no tienen un tipo de error registrado. Las próximas sí se van a clasificar.')}</p>
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
                      {principal ? <span className={cn('rounded-full px-3 py-1.5 text-xs font-bold', t.fondo, t.texto)}>El más frecuente</span> : <span className="text-xs text-texto-suave">{d?.cantidad ?? 0} {(d?.cantidad ?? 0) === 1 ? 'respuesta' : 'respuestas'}</span>}
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
                    <Link to={t.tipo === 'Error cognitivo' ? '/historial' : practica} className={cn('mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold underline-offset-4 hover:underline', t.texto)}>{t.tipo === 'Error cognitivo' ? 'Ver mis explicaciones' : 'Practicar'}<ArrowRight className="size-4" aria-hidden="true" /></Link>
                  </div>
                </article>
              })}
            </div>
            {datos.sinClasificar > 0 && <Aviso tono="informacion">{datos.sinClasificar === 1 ? '1 respuesta incorrecta es de antes de que la plataforma clasificara los errores, por eso no entra en los porcentajes.' : `${datos.sinClasificar} respuestas incorrectas son de antes de que la plataforma clasificara los errores, por eso no entran en los porcentajes.`} Puedes verlas en tu <Link to="/historial">historial</Link>.</Aviso>}
          </div>}
        </>}
      </div>
    </section>

    <section className="flex flex-col gap-5 rounded-panel border border-borde-fuerte bg-hueso p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div className="flex items-start gap-4"><span className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-superficie text-marino-700 sm:flex"><Footprints className="size-5" aria-hidden="true" /></span><div><h2 className="text-lg font-bold text-marino-800">¿Listo para otro ejercicio?</h2><p className="mt-1 max-w-lg text-sm text-texto-suave">Escoge uno de los consejos de arriba y pruébalo en tu próximo intento.</p></div></div>
      <Button asChild variant="contorno" className="w-full sm:w-auto"><Link to={practica}>Ir al banco <ArrowRight aria-hidden="true" /></Link></Button>
    </section>
    <details className="group text-sm text-texto-suave">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 py-1 font-bold text-marino-700 [&::-webkit-details-marker]:hidden"><BookOpen className="size-4" aria-hidden="true" /> ¿Cómo se clasifica cada error? <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
      <p className="mt-3 max-w-3xl leading-relaxed">Solo se clasifican las respuestas incorrectas. Si marcaste confianza 4 o 5, cuenta como error de ansiedad. Si venías acertando el 70 % o más de tus últimos intentos en ese componente o competencia, cuenta como error de hábito. En los demás casos cuenta como error cognitivo. Cuando un tipo pasa de la mitad de tus errores, lo destacamos arriba con una recomendación.</p>
    </details>
  </div>
}
