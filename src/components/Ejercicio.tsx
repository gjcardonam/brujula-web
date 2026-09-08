import type { EjercicioEstudiante, OpcionEstudiante, ResultadoIntento } from '../api/types'
import { Confianza } from './ui'

/**
 * Bloque común para resolver un ejercicio (práctica libre M-06 y simulacro M-09):
 * enunciado, imagen, opciones, nivel de confianza y botón "Confirmar Respuesta".
 */
export function CuerpoEjercicio({ ejercicio, seleccion, confianza, resultado, onSeleccionar, onConfianza, onConfirmar, enviando, encabezado }: {
  ejercicio: EjercicioEstudiante
  seleccion: number | null
  confianza: number | null
  resultado: ResultadoIntento | null
  onSeleccionar: (id: number) => void
  onConfianza: (n: number) => void
  onConfirmar: () => void
  enviando: boolean
  encabezado?: React.ReactNode
}) {
  const respondido = resultado !== null
  const claseOpcion = (o: OpcionEstudiante) => {
    if (!resultado) return seleccion === o.id ? 'sel' : ''
    if (o.id === resultado.idOpcionCorrecta) return 'right'
    if (o.id === resultado.idOpcionSeleccionada) return 'wrong'
    return ''
  }
  return (
    <>
      {encabezado}
      <p style={{ lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{ejercicio.enunciado}</p>
      {ejercicio.imagenEnunciado && <img className="enunciado-img" src={ejercicio.imagenEnunciado} alt="Imagen del enunciado" />}
      <div role="radiogroup" aria-label="Opciones de respuesta">
        {ejercicio.opciones.map(o => (
          <button key={o.id} type="button" className={`opt ${claseOpcion(o)}`} disabled={respondido || enviando}
            role="radio" aria-checked={seleccion === o.id} onClick={() => onSeleccionar(o.id)}>
            <div className="r" />
            <div style={{ flex: 1 }}>
              <div>{o.letra}. {o.descripcion}
                {resultado && o.id === resultado.idOpcionSeleccionada && !resultado.esCorrecto && <b style={{ color: '#dc2626' }}> — tu respuesta</b>}
                {resultado && o.id === resultado.idOpcionCorrecta && <b style={{ color: '#16a34a' }}> — respuesta correcta</b>}
              </div>
              {o.imagen && <img src={o.imagen} alt={`Opción ${o.letra}`} />}
            </div>
          </button>
        ))}
      </div>
      <div className="row keep center" style={{ marginTop: 6, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, width: 230 }}>{respondido ? '¿Qué tan seguro estabas?' : '¿Qué tan seguro estás?'} (1 = nada, 5 = muy seguro)</div>
        <Confianza valor={confianza} onCambiar={onConfianza} disabled={respondido || enviando} />
      </div>
      {!respondido && (
        <div className="row keep" style={{ marginTop: 16 }}>
          <button className="btn" type="button" disabled={seleccion === null || confianza === null || enviando} onClick={onConfirmar}>
            {enviando ? 'Registrando…' : 'Confirmar Respuesta'}
          </button>
        </div>
      )}
    </>
  )
}

/** Panel lateral de retroalimentación (HU-011). */
export function Retroalimentacion({ resultado }: { resultado: ResultadoIntento }) {
  const ok = resultado.esCorrecto
  return (
    <div className="card" style={{ borderLeft: `5px solid ${ok ? '#16a34a' : '#dc2626'}` }}>
      <h2 style={{ color: ok ? '#166534' : '#b91c1c' }}>{ok ? 'Respuesta correcta' : 'Respuesta incorrecta'}</h2>
      <p style={{ lineHeight: 1.55 }}>
        <b>{ok ? 'Por qué es correcta: ' : 'Por qué no es correcta: '}</b>
        {resultado.retroalimentacion}
      </p>
      {resultado.repetido && <div className="note">Esta respuesta ya había sido registrada; no se duplicó.</div>}
    </div>
  )
}
