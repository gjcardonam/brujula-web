export interface Usuario { id: number; nombre: string; apellido: string; email: string; rol: 'Estudiante' | 'Administrador' }
export interface Sesion { token: string; expiraEn: string; usuario: Usuario }
export interface Mensaje { mensaje: string }
export interface Item { id: number; nombre: string }

export interface Pagina<T> { contenido: T[]; pagina: number; tamano: number; totalElementos: number; totalPaginas: number }

export interface Duracion { id: number; minutos: number }

export interface Catalogos {
  componentes: Item[]
  competencias: Item[]
  niveles: Item[]
  tiposError: Item[]
  duraciones: Duracion[]
}

export interface Tarjeta {
  id: number; numero: number; componente: string; competencia: string; nivel: string
  estado: 'Activo' | 'Desactivado'
}
export interface ComponenteConteo { id: number; nombre: string; cantidad: number }
export interface Componentes { total: number; componentes: ComponenteConteo[] }

export interface OpcionEstudiante { id: number; letra: string; descripcion: string | null; imagen: string | null; orden: number }
export interface EjercicioEstudiante {
  id: number; numero: number; enunciado: string; imagenEnunciado: string | null
  componente: Item; competencia: Item; nivel: string; estado: string
  opciones: OpcionEstudiante[]; intentosPrevios: number
  intentosRestantes: number | null; disponibleDesde: string | null
}
export interface SiguienteEjercicio { hayMas: boolean; idEjercicio?: number; mensaje?: string }

export interface OpcionRequest {
  id: number | null
  descripcion: string; imagen: string | null
  esCorrecta: boolean; retroalimentacion: string; idTipoError: number | null
}
export interface EjercicioRequest {
  enunciado: string; imagenEnunciado: string | null
  idComponente: number | null; idCompetencia: number | null; idNivelDificultad: number | null
  opciones: OpcionRequest[]
}
export interface DistribucionDeError { tipo: string; cantidad: number; porcentaje: number }
export interface UsoDelEjercicio {
  intentos: number; correctos: number; porcentajeAciertos: number; errores: DistribucionDeError[]
}
export interface OpcionAdmin {
  id: number; letra: string; descripcion: string | null; imagen: string | null
  esCorrecta: boolean; retroalimentacion: string; tipoError: Item | null
  orden: number; usadaEnIntentos: boolean
}
export interface EjercicioAdmin {
  id: number; numero: number; enunciado: string; imagenEnunciado: string | null
  componente: Item; competencia: Item; nivel: Item; estado: 'Activo' | 'Desactivado'
  creadoPor: string; creadoEn: string; opciones: OpcionAdmin[]
  uso: UsoDelEjercicio; tieneIntentos: boolean
}
export interface CambioEstadoRequest { estado: 'Activo' | 'Desactivado' }

export interface IntentoResumen {
  id: number; idEjercicio: number; numeroEjercicio: number; componente: string; competencia: string
  nivel: string; esCorrecto: boolean; fechaHora: string; estadoEjercicio: string
}
export interface OpcionRevisada {
  id: number; letra: string; descripcion: string | null; imagen: string | null
  seleccionada: boolean; esCorrecta: boolean
}
export interface IntentoDetalle {
  id: number; idEjercicio: number; numeroEjercicio: number; enunciado: string; imagenEnunciado: string | null
  componente: string; competencia: string; nivel: string; estadoEjercicio: string
  opciones: OpcionRevisada[]; esCorrecto: boolean; nivelConfianza: number; fechaHora: string
  retroalimentacion: string
  tipoError: string | null
  idSimulacro: number | null
}

export interface ImagenSubida { nombre: string; url: string }

export interface ResultadoIntento {
  idIntento: number; esCorrecto: boolean; idOpcionSeleccionada: number; idOpcionCorrecta: number | null
  retroalimentacion: string; retroalimentacionDisponible: boolean; nivelConfianza: number
  respondidoEn: string; numeroIntento: number; repetido: boolean; tipoError: string | null
  idSimulacro: number | null
}

export interface ErroresDelEstudiante {
  totalIncorrectos: number; sinClasificar: number; distribucion: DistribucionDeError[]
  tipoPredominante: string | null; mensajeOrientador: string | null
  idComponenteFiltro: number | null; componentesConIntentos: Item[]
}

export interface EstadoSimulacro {
  id: number; estado: 'En curso' | 'Finalizado'; duracionMinutos: number; fechaInicio: string; finPrevisto: string
  ahora: string; tiempoRestanteSeg: number; respondidos: number; correctas: number
}
export interface SiguienteSimulacro {
  finalizado: boolean; motivo: 'TIEMPO' | 'SIN_EJERCICIOS' | 'FINALIZADO' | null
  ejercicio: EjercicioEstudiante | null; estado: EstadoSimulacro
}

export interface DesempenoArea { id: number; nombre: string; intentos: number; correctas: number; porcentaje: number }
export interface Recomendacion {
  orden: number; area: string; tipo: string; idComponente: number | null; idCompetencia: number | null
  porcentaje: number; mensaje: string
}
export interface ResumenSimulacro {
  id: number; fechaInicio: string; fechaFin: string; duracionMinutos: number; tiempoUtilizadoSeg: number | null
  respondidos: number; correctas: number; incorrectas: number; porcentajeAciertos: number
}
export interface ResultadoSimulacro extends ResumenSimulacro {
  porComponente: DesempenoArea[]; porCompetencia: DesempenoArea[]
  recomendaciones: Recomendacion[]; mensajeRecomendacion: string | null; detalle: IntentoDetalle[]
}

export interface PorArea {
  id: number; nombre: string; intentados: number; correctas: number; incorrectas: number
  porcentajeAciertos: number; porcentajeDesaciertos: number
}
export interface PorConfianza {
  nivel: number; intentados: number; correctas: number; incorrectas: number
  porcentajeCorrectas: number; porcentajeIncorrectas: number
}
export interface Estadisticas {
  sinDatos: boolean
  resumen: { intentados: number; correctas: number; incorrectas: number; porcentajeAciertos: number; porcentajeDesaciertos: number }
  porComponente: PorArea[]; porCompetencia: PorArea[]; porConfianza: PorConfianza[]
  simulacros: {
    cantidad: number; porcentajePromedioAciertos: number; promedioEjercicios: number
    tiempoPromedioSeg: number; ejerciciosPorHora: number
  }
}
