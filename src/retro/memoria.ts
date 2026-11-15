import { AL_ACERTAR, MOMENTOS, POR_TIPO, esTipoConTarjeta, rellenar, type TipoDeError } from './mensajes'

// La sesión de práctica vive en sessionStorage y se reinicia tras 30 minutos sin responder.
// Lo que debe durar entre sesiones (mensajes vistos, anécdotas, última práctica) va en localStorage por estudiante.

const CLAVE_SESION = 'brujula.retro.sesion'
const INACTIVIDAD_MS = 30 * 60 * 1000
const DIAS_PARA_REGRESO = 3
const SEMANA_MS = 7 * 24 * 60 * 60 * 1000
const SIN_REPETIR = 5
const EJERCICIOS_ANTES_DE_PAUSA = 15

interface Sesion {
  idUsuario: number
  ultimaActividad: number
  inicioMostrado: boolean
  respondidos: number
  pausaMostrada: boolean
  anteriorFueError: boolean
  racha: { tipo: string; componente: string; n: number } | null
}

interface Memoria {
  vistos: Record<string, number[]>
  anecdotas: Record<string, number>
  ultimaPractica: number | null
}

function leer<T>(almacen: () => Storage, clave: string): T | null {
  try {
    const raw = almacen().getItem(clave)
    return raw ? JSON.parse(raw) as T : null
  } catch {
    return null
  }
}

function escribir(almacen: () => Storage, clave: string, valor: unknown) {
  try { almacen().setItem(clave, JSON.stringify(valor)) } catch { void 0 }
}

const claveMemoria = (idUsuario: number) => `brujula.retro.${idUsuario}`

function sesionActual(idUsuario: number, ahora: number): Sesion {
  const s = leer<Sesion>(() => sessionStorage, CLAVE_SESION)
  if (s && s.idUsuario === idUsuario && ahora - s.ultimaActividad < INACTIVIDAD_MS) return s
  return {
    idUsuario, ultimaActividad: ahora, inicioMostrado: false, respondidos: 0,
    pausaMostrada: false, anteriorFueError: false, racha: null,
  }
}

function memoriaDe(idUsuario: number): Memoria {
  return leer<Memoria>(() => localStorage, claveMemoria(idUsuario)) ?? { vistos: {}, anecdotas: {}, ultimaPractica: null }
}

function elegir(memoria: Memoria, grupo: string, textos: string[]): string {
  const vistos = memoria.vistos[grupo] ?? []
  const evitar = new Set(vistos.slice(-Math.min(SIN_REPETIR, textos.length - 1)))
  const posibles = textos.map((_, i) => i).filter(i => !evitar.has(i))
  const indice = posibles[Math.floor(Math.random() * posibles.length)]
  memoria.vistos[grupo] = [...vistos, indice].slice(-SIN_REPETIR)
  return textos[indice]
}

/** Mensaje de inicio de sesión, solo la primera vez que se abre un ejercicio en la sesión. */
export function momentoDeInicio(idUsuario: number, componente: string, ahora = Date.now()): string | null {
  const sesion = sesionActual(idUsuario, ahora)
  if (sesion.inicioMostrado) return null
  sesion.inicioMostrado = true
  escribir(() => sessionStorage, CLAVE_SESION, sesion)
  const { ultimaPractica } = memoriaDe(idUsuario)
  const regresa = ultimaPractica !== null && ahora - ultimaPractica >= DIAS_PARA_REGRESO * 24 * 60 * 60 * 1000
  return regresa ? rellenar(MOMENTOS.regreso, { componente, confianza: 0 }) : MOMENTOS.primerEjercicio
}

export interface Respuesta {
  correcto: boolean
  tipoError: string | null
  componente: string
  confianza: number
}

export interface Retroalimentacion {
  /** Mensaje del tipo de error (si hay tarjeta) o mensaje de acierto. */
  mensaje: string | null
  tipo: TipoDeError | null
  pausa: string | null
}

export function alResponder(idUsuario: number, r: Respuesta, ahora = Date.now()): Retroalimentacion {
  const sesion = sesionActual(idUsuario, ahora)
  const memoria = memoriaDe(idUsuario)
  const datos = { componente: r.componente, confianza: r.confianza }
  let mensaje: string | null = null
  let tipo: TipoDeError | null = null

  if (r.correcto) {
    const grupo = sesion.anteriorFueError ? 'despuesDeUnError'
      : r.confianza <= 2 ? 'confianzaBaja' : r.confianza === 3 ? 'confianzaMedia' : 'confianzaAlta'
    mensaje = elegir(memoria, `acierto.${grupo}`, AL_ACERTAR[grupo])
    sesion.racha = null
  } else if (esTipoConTarjeta(r.tipoError)) {
    tipo = r.tipoError
    const textos = POR_TIPO[tipo]
    // Los mensajes de errores seguidos nombran el componente, así que la racha es por tipo y componente.
    const sigue = sesion.racha?.tipo === tipo && sesion.racha.componente === r.componente
    const n = sigue && sesion.racha ? sesion.racha.n + 1 : 1
    sesion.racha = { tipo, componente: r.componente, n }
    const ultimaAnecdota = memoria.anecdotas[tipo] ?? 0
    if (n === 2 || n === 3) {
      mensaje = elegir(memoria, `${tipo}.seguidos`, textos.seguidos)
    } else if (ahora - ultimaAnecdota >= SEMANA_MS && Math.random() < 1 / 3) {
      mensaje = elegir(memoria, `${tipo}.anecdotas`, textos.anecdotas)
      memoria.anecdotas[tipo] = ahora
    } else {
      mensaje = elegir(memoria, `${tipo}.normales`, textos.normales)
    }
  } else {
    sesion.racha = null
  }

  sesion.anteriorFueError = !r.correcto
  sesion.respondidos += 1
  sesion.ultimaActividad = ahora
  sesion.inicioMostrado = true
  let pausa: string | null = null
  if (sesion.respondidos > EJERCICIOS_ANTES_DE_PAUSA && !sesion.pausaMostrada) {
    pausa = MOMENTOS.pausa
    sesion.pausaMostrada = true
  }
  memoria.ultimaPractica = ahora
  escribir(() => sessionStorage, CLAVE_SESION, sesion)
  escribir(() => localStorage, claveMemoria(idUsuario), memoria)
  return { mensaje: mensaje && rellenar(mensaje, datos), tipo, pausa }
}
