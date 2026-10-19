import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, Loader2, Lock, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { api, mensajeDe, urlDeArchivo } from '@/api/client'
import type { Catalogos, EjercicioAdmin, EjercicioRequest, ImagenSubida } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { Campo } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { enfocarPrimerError } from '@/utils/foco'

interface OpcionForm {
  clave: string
  id: number | null
  descripcion: string
  imagen: string | null
  esCorrecta: boolean
  retroalimentacion: string
  idTipoError: number | null
  usada: boolean
}

type ErroresOpcion = { contenido?: string; retroalimentacion?: string }
type Errores = {
  enunciado?: string
  componente?: string
  competencia?: string
  nivel?: string
  correcta?: string
  opciones?: Record<string, ErroresOpcion>
}

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGEN = 5 * 1024 * 1024
const letra = (i: number) => String.fromCharCode(65 + i)

function nuevaOpcion(): OpcionForm {
  return {
    clave: Math.random().toString(36).slice(2),
    id: null,
    descripcion: '',
    imagen: null,
    esCorrecta: false,
    retroalimentacion: '',
    idTipoError: null,
    usada: false,
  }
}

function Esqueleto() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="panel space-y-5 p-6 sm:p-7">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-28 w-full rounded-control" />
        <Skeleton className="h-12 w-full rounded-control" />
        <Skeleton className="h-12 w-full rounded-control" />
      </div>
      <div className="panel space-y-4 p-6 sm:p-7">
        <Skeleton className="h-7 w-56" />
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-32 w-full rounded-tarjeta" />)}
      </div>
    </div>
  )
}

export function EjercicioFormPage() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navigate = useNavigate()

  const [cat, setCat] = useState<Catalogos | null>(null)
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null)
  const [cargandoEjercicio, setCargandoEjercicio] = useState(editando)
  const [numero, setNumero] = useState<number | null>(null)
  const [tieneIntentos, setTieneIntentos] = useState(false)
  const [enunciado, setEnunciado] = useState('')
  const [imagen, setImagen] = useState<string | null>(null)
  const [idComponente, setIdComponente] = useState<number | null>(null)
  const [idCompetencia, setIdCompetencia] = useState<number | null>(null)
  const [idNivel, setIdNivel] = useState<number | null>(null)
  const [opciones, setOpciones] = useState<OpcionForm[]>(() => [nuevaOpcion(), nuevaOpcion(), nuevaOpcion(), nuevaOpcion()])
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const archivos = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    let vivo = true
    api<Catalogos>('/catalogos')
      .then(c => { if (vivo) setCat(c) })
      .catch(e => { if (vivo) setErrorCatalogos(mensajeDe(e)) })
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (!editando) return
    let vivo = true
    setCargandoEjercicio(true)
    api<EjercicioAdmin>(`/ejercicios/${id}`)
      .then(e => {
        if (!vivo) return
        setEnunciado(e.enunciado)
        setImagen(e.imagenEnunciado)
        setIdComponente(e.componente.id)
        setIdCompetencia(e.competencia.id)
        setIdNivel(e.nivel.id)
        setNumero(e.numero)
        setTieneIntentos(e.tieneIntentos)
        setOpciones(e.opciones.map(o => ({
          clave: Math.random().toString(36).slice(2),
          id: o.id,
          descripcion: o.descripcion ?? '',
          imagen: o.imagen,
          esCorrecta: o.esCorrecta,
          retroalimentacion: o.retroalimentacion,
          idTipoError: o.tipoError?.id ?? null,
          usada: o.usadaEnIntentos,
        })))
      })
      .catch(e => { if (vivo) setError(mensajeDe(e)) })
      .finally(() => { if (vivo) setCargandoEjercicio(false) })
    return () => { vivo = false }
  }, [editando, id])

  function cambiar(clave: string, cambio: Partial<OpcionForm>) {
    setOpciones(ops => ops.map(o => (o.clave === clave ? { ...o, ...cambio } : o)))
  }

  function marcarCorrecta(clave: string) {
    setOpciones(ops => ops.map(o => ({ ...o, esCorrecta: o.clave === clave, idTipoError: o.clave === clave ? null : o.idTipoError })))
    setErrores(e => ({ ...e, correcta: undefined }))
  }

  async function subir(archivo: File, destino: 'enunciado' | string) {
    setError(null)
    if (!TIPOS_IMAGEN.includes(archivo.type)) { setError('La imagen debe estar en formato JPG, PNG o WEBP.'); return }
    if (archivo.size > MAX_IMAGEN) { setError('La imagen pesa más de 5 MB. Usa una más liviana.'); return }
    const form = new FormData()
    form.append('archivo', archivo)
    setSubiendo(destino)
    try {
      const r = await api<ImagenSubida>('/archivos', { method: 'POST', form })
      if (destino === 'enunciado') setImagen(r.url)
      else cambiar(destino, { imagen: r.url })
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setSubiendo(null)
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    setError(null)

    const nuevos: Errores = { opciones: {} }
    if (!enunciado.trim()) nuevos.enunciado = 'Escribe el enunciado del ejercicio.'
    if (!idComponente) nuevos.componente = 'Elige un componente.'
    if (!idCompetencia) nuevos.competencia = 'Elige una competencia.'
    if (!idNivel) nuevos.nivel = 'Elige un nivel de dificultad.'
    if (opciones.filter(o => o.esCorrecta).length !== 1) nuevos.correcta = 'Marca cuál es la opción correcta.'
    if (opciones.length < 2) nuevos.correcta = nuevos.correcta ?? 'Deja al menos dos opciones de respuesta.'
    opciones.forEach(o => {
      const e: ErroresOpcion = {}
      if (!o.descripcion.trim() && !o.imagen) e.contenido = 'Escribe el texto de la opción o sube una imagen.'
      if (!o.retroalimentacion.trim()) e.retroalimentacion = 'Explica por qué esta opción es correcta o no lo es.'
      if (Object.keys(e).length) nuevos.opciones![o.clave] = e
    })

    const hayErrores = Boolean(nuevos.enunciado || nuevos.componente || nuevos.competencia || nuevos.nivel || nuevos.correcta) ||
      Object.keys(nuevos.opciones!).length > 0
    setErrores(nuevos)
    if (hayErrores) {
      setError('Revisa los campos marcados para poder guardar.')
      enfocarPrimerError(form)
      return
    }

    const body: EjercicioRequest = {
      enunciado: enunciado.trim(),
      imagenEnunciado: imagen,
      idComponente,
      idCompetencia,
      idNivelDificultad: idNivel,
      opciones: opciones.map(o => ({
        id: o.id,
        descripcion: o.descripcion.trim(),
        imagen: o.imagen,
        esCorrecta: o.esCorrecta,
        retroalimentacion: o.retroalimentacion.trim(),
        idTipoError: o.esCorrecta ? null : o.idTipoError,
      })),
    }

    setGuardando(true)
    try {
      const r = editando
        ? await api<EjercicioAdmin>(`/ejercicios/${id}`, { method: 'PUT', body })
        : await api<EjercicioAdmin>('/ejercicios', { method: 'POST', body })
      toast(editando ? `Actualizamos el ejercicio ${r.numero}` : `Guardamos el ejercicio ${r.numero}`, {
        description: editando
          ? 'Los cambios ya están publicados.'
          : 'Ya está disponible para los estudiantes.',
      })
      navigate(`/admin/ejercicios/${r.id}`, { replace: true })
    } catch (err) {
      setError(mensajeDe(err))
    } finally {
      setGuardando(false)
    }
  }

  if (errorCatalogos) {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <Aviso>{errorCatalogos}</Aviso>
        <Button asChild variant="contorno"><Link to="/admin/banco">Volver al banco</Link></Button>
      </div>
    )
  }

  if (!cat || cargandoEjercicio) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Cargando el formulario</span>
        <Esqueleto />
      </div>
    )
  }

  return (
    <form onSubmit={guardar} noValidate className="animate-entrar">
      <header className="mb-7">
        <Link
          to={editando ? `/admin/ejercicios/${id}` : '/admin/banco'}
          className="inline-flex items-center gap-2 text-sm font-bold text-texto-suave transition-colors hover:text-marino-800"
        >
          <ArrowLeft className="size-[17px]" aria-hidden="true" />
          {editando ? `Volver al ejercicio ${numero}` : 'Volver al banco'}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-marino-800 sm:text-3xl">
          {editando ? `Editar ejercicio ${numero}` : 'Crear ejercicio'}
        </h1>
        <p className="mt-1.5 text-base text-texto-suave">
          {editando
            ? 'La edición no cambia el número ni el estado del ejercicio.'
            : 'Queda activo y con número propio en cuanto lo guardes.'}
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="panel space-y-6 p-6 sm:p-7 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-marino-800">Datos del ejercicio</h2>

          <Campo etiqueta="Enunciado" error={errores.enunciado}>
            {p => (
              <Textarea
                {...p}
                rows={5}
                value={enunciado}
                placeholder="Plantea la situación y la pregunta que debe resolver el estudiante."
                onChange={e => { setEnunciado(e.target.value); setErrores(x => ({ ...x, enunciado: undefined })) }}
              />
            )}
          </Campo>

          <div className="space-y-2">
            <p className="text-sm font-bold text-marino-800">Imagen del enunciado</p>
            {imagen ? (
              <div className="flex flex-wrap items-center gap-3">
                <img src={urlDeArchivo(imagen)} alt="Imagen del enunciado" className="max-h-24 rounded-ficha border border-borde" />
                <Button type="button" variant="contorno" size="sm" onClick={() => setImagen(null)}>
                  <Trash2 aria-hidden="true" />
                  Quitar
                </Button>
              </div>
            ) : (
              <>
                <input
                  ref={el => { archivos.current.enunciado = el }}
                  type="file"
                  accept={TIPOS_IMAGEN.join(',')}
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) void subir(f, 'enunciado') }}
                />
                <Button
                  type="button"
                  variant="contorno"
                  size="sm"
                  disabled={subiendo === 'enunciado'}
                  onClick={() => archivos.current.enunciado?.click()}
                >
                  {subiendo === 'enunciado'
                    ? <Loader2 className="animate-spin" aria-hidden="true" />
                    : <ImagePlus aria-hidden="true" />}
                  {subiendo === 'enunciado' ? 'Subiendo' : 'Subir imagen'}
                </Button>
              </>
            )}
            <p className="text-xs text-texto-suave">Opcional. JPG, PNG o WEBP de hasta 5 MB.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Campo etiqueta="Componente" error={errores.componente}>
              {p => (
                <Select
                  value={idComponente ? String(idComponente) : undefined}
                  onValueChange={v => { setIdComponente(Number(v)); setErrores(x => ({ ...x, componente: undefined })) }}
                >
                  <SelectTrigger {...p} className="w-full">
                    <SelectValue placeholder="Elige un componente" />
                  </SelectTrigger>
                  <SelectContent>
                    {cat.componentes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </Campo>

            <Campo etiqueta="Competencia" error={errores.competencia}>
              {p => (
                <Select
                  value={idCompetencia ? String(idCompetencia) : undefined}
                  onValueChange={v => { setIdCompetencia(Number(v)); setErrores(x => ({ ...x, competencia: undefined })) }}
                >
                  <SelectTrigger {...p} className="w-full">
                    <SelectValue placeholder="Elige una competencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {cat.competencias.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </Campo>
          </div>

          <Campo etiqueta="Nivel de dificultad" error={errores.nivel} className="sm:max-w-[16rem]">
            {p => (
              <Select
                value={idNivel ? String(idNivel) : undefined}
                onValueChange={v => { setIdNivel(Number(v)); setErrores(x => ({ ...x, nivel: undefined })) }}
              >
                <SelectTrigger {...p} className="w-full">
                  <SelectValue placeholder="Elige un nivel" />
                </SelectTrigger>
                <SelectContent>
                  {cat.niveles.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </Campo>

          {error && <Aviso>{error}</Aviso>}

          <div className="flex flex-wrap gap-3 border-t border-borde pt-6">
            <Button type="submit" disabled={guardando || subiendo !== null}>
              {guardando && <Loader2 className="animate-spin" aria-hidden="true" />}
              {guardando ? 'Guardando' : editando ? 'Guardar cambios' : 'Guardar ejercicio'}
            </Button>
            <Button asChild variant="contorno">
              <Link to={editando ? `/admin/ejercicios/${id}` : '/admin/banco'}>Cancelar</Link>
            </Button>
          </div>
        </section>

        <section className="panel space-y-5 p-6 sm:p-7">
          <div>
            <h2 className="text-xl font-bold text-marino-800">Opciones de respuesta</h2>
            <p className="mt-1.5 text-base text-texto-suave">
              Marca la correcta y explica cada una: esa explicación es la que verá el estudiante.
            </p>
          </div>

          {tieneIntentos && (
            <Aviso tono="informacion">
              Este ejercicio ya tiene intentos registrados. Las opciones marcadas como «usada en intentos» no pueden
              modificarse ni eliminarse; solo su retroalimentación y su tipo de error.
            </Aviso>
          )}

          {errores.correcta && <Aviso>{errores.correcta}</Aviso>}

          <div className="space-y-4">
            {opciones.map((o, i) => {
              const err = errores.opciones?.[o.clave]
              return (
                <fieldset
                  key={o.clave}
                  className={cn(
                    'rounded-tarjeta border-2 p-4 transition-colors sm:p-5',
                    o.esCorrecta ? 'border-exito-600 bg-exito-50' : 'border-borde-fuerte bg-superficie',
                    o.usada && 'bg-hueso',
                  )}
                >
                  <legend className="sr-only">Opción {letra(i)}</legend>

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grid size-[34px] shrink-0 place-items-center rounded-ficha font-titular text-sm font-bold',
                        o.esCorrecta ? 'bg-exito-600 text-white' : 'bg-hueso text-texto-suave',
                      )}
                    >
                      {letra(i)}
                    </span>

                    <label
                      className={cn(
                        'inline-flex cursor-pointer items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors',
                        o.esCorrecta
                          ? 'border-exito-600 bg-superficie text-exito-700'
                          : 'border-borde-fuerte bg-superficie text-texto-suave hover:border-marino-200',
                        o.usada && 'cursor-not-allowed opacity-70',
                      )}
                    >
                      <input
                        type="radio"
                        name="opcion-correcta"
                        checked={o.esCorrecta}
                        disabled={o.usada}
                        onChange={() => marcarCorrecta(o.clave)}
                        className="size-4 accent-[var(--color-exito-600)]"
                      />
                      {o.esCorrecta ? 'Es la correcta' : 'Marcar correcta'}
                    </label>

                    {o.usada && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-marino-100 px-3 py-1.5 text-xs font-bold text-texto-suave">
                        <Lock className="size-3.5" aria-hidden="true" />
                        usada en intentos
                      </span>
                    )}

                    <div className="ml-auto flex items-center gap-1">
                      {!o.imagen && !o.usada && (
                        <>
                          <input
                            ref={el => { archivos.current[o.clave] = el }}
                            type="file"
                            accept={TIPOS_IMAGEN.join(',')}
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) void subir(f, o.clave) }}
                          />
                          <Button
                            type="button"
                            variant="fantasma"
                            size="icono-sm"
                            disabled={subiendo === o.clave}
                            onClick={() => archivos.current[o.clave]?.click()}
                          >
                            {subiendo === o.clave
                              ? <Loader2 className="animate-spin" aria-hidden="true" />
                              : <ImagePlus aria-hidden="true" />}
                            <span className="sr-only">Usar una imagen en la opción {letra(i)}</span>
                          </Button>
                        </>
                      )}
                      {opciones.length > 2 && !o.usada && (
                        <Button
                          type="button"
                          variant="fantasma"
                          size="icono-sm"
                          onClick={() => setOpciones(ops => ops.filter(x => x.clave !== o.clave))}
                        >
                          <Trash2 aria-hidden="true" />
                          <span className="sr-only">Quitar la opción {letra(i)}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Campo etiqueta="Texto" error={err?.contenido}>
                      {p => (
                        <Input
                          {...p}
                          value={o.descripcion}
                          disabled={o.usada}
                          onChange={e => cambiar(o.clave, { descripcion: e.target.value })}
                        />
                      )}
                    </Campo>

                    {o.imagen && (
                      <div className="flex flex-wrap items-center gap-3">
                        <img src={urlDeArchivo(o.imagen)} alt={`Opción ${letra(i)}`} className="max-h-20 rounded-ficha border border-borde" />
                        {!o.usada && (
                          <Button type="button" variant="contorno" size="sm" onClick={() => cambiar(o.clave, { imagen: null })}>
                            <Trash2 aria-hidden="true" />
                            Quitar imagen
                          </Button>
                        )}
                      </div>
                    )}

                    <Campo etiqueta="Retroalimentación" error={err?.retroalimentacion}>
                      {p => (
                        <Textarea
                          {...p}
                          rows={2}
                          value={o.retroalimentacion}
                          placeholder={o.esCorrecta ? 'Por qué esta opción es la correcta.' : 'Qué error lleva a elegir esta opción.'}
                          onChange={e => cambiar(o.clave, { retroalimentacion: e.target.value })}
                        />
                      )}
                    </Campo>

                    {!o.esCorrecta && (
                      <Campo
                        etiqueta="Tipo de error que representa"
                        ayuda="Sirve para clasificar los errores del dashboard. Si lo dejas vacío se toma como error cognitivo."
                      >
                        {p => (
                          <Select
                            value={o.idTipoError ? String(o.idTipoError) : undefined}
                            onValueChange={v => cambiar(o.clave, { idTipoError: v === 'ninguno' ? null : Number(v) })}
                          >
                            <SelectTrigger {...p} className="w-full">
                              <SelectValue placeholder="Sin clasificar (error cognitivo)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ninguno">Sin clasificar (error cognitivo)</SelectItem>
                              {cat.tiposError.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </Campo>
                    )}
                  </div>
                </fieldset>
              )
            })}
          </div>

          <Button type="button" variant="contorno" onClick={() => setOpciones(ops => [...ops, nuevaOpcion()])}>
            <Plus aria-hidden="true" />
            Agregar opción
          </Button>
        </section>
      </div>
    </form>
  )
}
