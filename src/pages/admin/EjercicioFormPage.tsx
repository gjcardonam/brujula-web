import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, mensajeDe } from '../../api/client'
import type { Catalogos, EjercicioAdmin, EjercicioRequest, OpcionRequest } from '../../api/types'
import { Alerta, Cargando } from '../../components/ui'

type OpcionForm = OpcionRequest & { usada: boolean; letra: string }

const vacia = (i: number): OpcionForm => ({ id: null, descripcion: '', imagen: null, esCorrecta: false, retroalimentacion: '', idTipoError: null, usada: false, letra: String.fromCharCode(65 + i) })

/** M-13 · Crear (HU-020) y editar (HU-021) un ejercicio. */
export function EjercicioFormPage() {
  const { id } = useParams()
  const editando = !!id
  const navigate = useNavigate()
  const [cat, setCat] = useState<Catalogos | null>(null)
  const [enunciado, setEnunciado] = useState('')
  const [imagen, setImagen] = useState<string | null>(null)
  const [idComponente, setIdComponente] = useState<number | null>(null)
  const [idCompetencia, setIdCompetencia] = useState<number | null>(null)
  const [idNivel, setIdNivel] = useState<number | null>(null)
  const [opciones, setOpciones] = useState<OpcionForm[]>([vacia(0), vacia(1), vacia(2), vacia(3)])
  const [tieneIntentos, setTieneIntentos] = useState(false)
  const [numero, setNumero] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [cargado, setCargado] = useState(!editando)

  useEffect(() => { api<Catalogos>('/catalogos').then(setCat).catch(e => setError(mensajeDe(e))) }, [])

  useEffect(() => {
    if (!editando) return
    api<EjercicioAdmin>(`/ejercicios/${id}`).then(e => {                                          // HU-021 CA-02
      setEnunciado(e.enunciado); setImagen(e.imagenEnunciado)
      setIdComponente(e.componente.id); setIdCompetencia(e.competencia.id); setIdNivel(e.nivel.id)
      setNumero(e.numero); setTieneIntentos(e.tieneIntentos)
      setOpciones(e.opciones.map((o, i) => ({ id: o.id, descripcion: o.descripcion ?? '', imagen: o.imagen, esCorrecta: o.esCorrecta,
        retroalimentacion: o.retroalimentacion, idTipoError: o.tipoError?.id ?? null, usada: o.usadaEnIntentos, letra: String.fromCharCode(65 + i) })))
      setCargado(true)
    }).catch(e => setError(mensajeDe(e)))
  }, [editando, id])

  function actualizar(i: number, cambio: Partial<OpcionForm>) {
    setOpciones(ops => ops.map((o, j) => j === i ? { ...o, ...cambio } : o))
  }
  function marcarCorrecta(i: number) {
    setOpciones(ops => ops.map((o, j) => ({ ...o, esCorrecta: j === i, idTipoError: j === i ? null : o.idTipoError })))
  }
  function agregar() { setOpciones(ops => [...ops, vacia(ops.length)]) }
  function quitar(i: number) {
    setOpciones(ops => ops.filter((_, j) => j !== i).map((o, j) => ({ ...o, letra: String.fromCharCode(65 + j) })))
  }

  async function subir(archivo: File, destino: 'enunciado' | number) {
    setError(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) { setError('Solo se aceptan imágenes JPG, PNG o WEBP.'); return }
    if (archivo.size > 5 * 1024 * 1024) { setError('La imagen supera el tamaño máximo de 5 MB.'); return }
    const form = new FormData()
    form.append('archivo', archivo)
    setSubiendo(String(destino))
    try {
      const r = await api<{ nombre: string; url: string }>('/archivos', { method: 'POST', form })
      if (destino === 'enunciado') setImagen(r.url); else actualizar(destino, { imagen: r.url })
    } catch (e) { setError(mensajeDe(e)) } finally { setSubiendo(null) }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const faltan: string[] = []
    if (!enunciado.trim()) faltan.push('El enunciado es obligatorio.')
    if (!idComponente) faltan.push('Selecciona un componente.')
    if (!idCompetencia) faltan.push('Selecciona una competencia.')
    if (!idNivel) faltan.push('Selecciona un nivel de dificultad.')
    if (opciones.length < 2) faltan.push('Agrega al menos dos opciones.')
    if (opciones.filter(o => o.esCorrecta).length !== 1) faltan.push('Marca exactamente una opción como correcta.')
    opciones.forEach(o => {
      if (!o.descripcion.trim() && !o.imagen) faltan.push(`La opción ${o.letra} debe tener texto o imagen.`)
      if (!o.retroalimentacion.trim()) faltan.push(`La opción ${o.letra} necesita retroalimentación.`)
    })
    if (faltan.length) { setError(faltan.join(' ')); return }                                       // HU-020 CA-07/CA-08

    const body: EjercicioRequest = {
      enunciado: enunciado.trim(), imagenEnunciado: imagen, idComponente, idCompetencia, idNivelDificultad: idNivel,
      opciones: opciones.map(o => ({ id: o.id ?? null, descripcion: o.descripcion, imagen: o.imagen, esCorrecta: o.esCorrecta, retroalimentacion: o.retroalimentacion, idTipoError: o.esCorrecta ? null : o.idTipoError })),
    }
    setGuardando(true)
    try {
      const r = editando
        ? await api<EjercicioAdmin>(`/ejercicios/${id}`, { method: 'PUT', body })
        : await api<EjercicioAdmin>('/ejercicios', { method: 'POST', body })
      navigate(`/admin/ejercicios/${r.id}`, { state: { aviso: editando ? `El ejercicio #${r.numero} fue actualizado exitosamente.` : `El ejercicio #${r.numero} fue creado exitosamente.` } })
    } catch (err) { setError(mensajeDe(err)) } finally { setGuardando(false) }
  }

  if (!cargado || !cat) return error ? <Alerta>{error}</Alerta> : <Cargando />

  return (
    <form onSubmit={guardar} noValidate>
      <div className="steps">Banco de ejercicios › {editando ? `Ejercicio #${numero} › Editar` : 'Crear Ejercicio'}</div>
      <div className="row" style={{ marginTop: 8 }}>
        <div className="col card" style={{ flex: 1.3 }}>
          <h2>{editando ? `Editar ejercicio #${numero}` : 'Crear Ejercicio'}</h2>
          <div className="field"><label htmlFor="enunciado">Enunciado *</label>
            <textarea id="enunciado" className="input" rows={4} value={enunciado} onChange={e => setEnunciado(e.target.value)} /></div>
          <div className="row keep">
            <div className="col field"><label>Imagen del enunciado (opcional)</label>
              {imagen ? (
                <div><img src={imagen} alt="Imagen del enunciado" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                  <div><button type="button" className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => setImagen(null)}>Quitar imagen</button></div></div>
              ) : (
                <input className="input" type="file" accept="image/jpeg,image/png,image/webp" disabled={subiendo === 'enunciado'}
                  onChange={e => { const f = e.target.files?.[0]; if (f) void subir(f, 'enunciado') }} />
              )}
              <div className="help">JPG, PNG o WEBP, máximo 5 MB.</div>
            </div>
            <div className="col field"><label htmlFor="nivel">Nivel de dificultad *</label>
              <select id="nivel" className="input" value={idNivel ?? ''} onChange={e => setIdNivel(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Selecciona…</option>{cat.niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}</select></div>
          </div>
          <div className="row keep">
            <div className="col field"><label htmlFor="comp">Componente *</label>
              <select id="comp" className="input" value={idComponente ?? ''} onChange={e => setIdComponente(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Selecciona…</option>{cat.componentes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
            <div className="col field"><label htmlFor="compe">Competencia *</label>
              <select id="compe" className="input" value={idCompetencia ?? ''} onChange={e => setIdCompetencia(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Selecciona…</option>{cat.competencias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          </div>
          {error && <Alerta style={{ marginBottom: 12 }}>{error}</Alerta>}
          <div className="row keep" style={{ marginTop: 8 }}>
            <button className="btn" type="submit" disabled={guardando || !!subiendo}>{guardando ? 'Guardando…' : 'Guardar ejercicio'}</button>
            <Link className="btn ghost" to={editando ? `/admin/ejercicios/${id}` : '/admin/banco'}>Cancelar</Link>
          </div>
          <div className="note" style={{ marginTop: 10 }}>Validaciones: ningún campo vacío (salvo imagen) · exactamente una opción correcta · sin opciones duplicadas · enunciado único · {editando ? 'la edición no cambia el número ni el estado del ejercicio.' : 'al guardar queda "Activo" con número autogenerado.'}</div>
        </div>

        <div className="col card">
          <h2>Opciones de respuesta * (texto o imagen)</h2>
          {tieneIntentos && <Alerta tipo="warn" style={{ marginBottom: 10 }}>Este ejercicio ya tiene intentos registrados. Las opciones marcadas como "usada" no pueden modificarse ni eliminarse; solo su retroalimentación y tipo de error.</Alerta>}
          {opciones.map((o, i) => (
            <div key={i} className={`card ${o.esCorrecta ? '' : 'soft'}`} style={{ padding: 12, marginBottom: 10, borderColor: o.esCorrecta ? '#86efac' : undefined }}>
              <div className="row keep center" style={{ marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="correcta" checked={o.esCorrecta} onChange={() => marcarCorrecta(i)} disabled={o.usada} /> <b>Opción {o.letra}</b> {o.esCorrecta && <span className="pill">Correcta</span>}
                </label>
                <div className="sp" />
                {o.usada && <span className="pill off">usada en intentos</span>}
                {!o.usada && opciones.length > 2 && <button type="button" className="btn ghost sm" onClick={() => quitar(i)}>Quitar</button>}
              </div>
              <div className="field"><input className="input" placeholder="Texto de la opción" value={o.descripcion} disabled={o.usada} onChange={e => actualizar(i, { descripcion: e.target.value })} /></div>
              <div className="field">
                {o.imagen ? (
                  <div className="row keep center"><img src={o.imagen} alt={`Opción ${o.letra}`} style={{ maxHeight: 70, borderRadius: 6, border: '1px solid #e5e7eb' }} />
                    {!o.usada && <button type="button" className="btn ghost sm" onClick={() => actualizar(i, { imagen: null })}>Quitar imagen</button>}</div>
                ) : !o.usada && (
                  <input className="input" type="file" accept="image/jpeg,image/png,image/webp" disabled={subiendo === String(i)}
                    onChange={e => { const f = e.target.files?.[0]; if (f) void subir(f, i) }} />
                )}
              </div>
              <div className="field"><textarea className="input" rows={2} placeholder="Retroalimentación: por qué es correcta o incorrecta *" value={o.retroalimentacion} onChange={e => actualizar(i, { retroalimentacion: e.target.value })} /></div>
              {!o.esCorrecta && (
                <div className="field" style={{ marginBottom: 0 }}><label>Tipo de error que representa este distractor</label>
                  <select className="input" value={o.idTipoError ?? ''} onChange={e => actualizar(i, { idTipoError: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">Sin clasificar (se tomará como cognitivo)</option>{cat.tiposError.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select></div>
              )}
            </div>
          ))}
          <div className="row keep" style={{ marginTop: 6 }}>
            <button type="button" className="btn ghost sm" onClick={agregar}>+ Agregar opción</button>
          </div>
        </div>
      </div>
    </form>
  )
}
