export interface Usuario { id: number; nombre: string; apellido: string; email: string; rol: 'Estudiante' | 'Administrador' }
export interface Sesion { token: string; expiraEn: string; usuario: Usuario }
export interface Mensaje { mensaje: string }
export interface Item { id: number; nombre: string }

export interface Pagina<T> { contenido: T[]; pagina: number; tamano: number; totalElementos: number; totalPaginas: number }

export interface Catalogos {
  componentes: Item[]
  competencias: Item[]
  niveles: Item[]
  tiposError: Item[]
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
}

export interface ImagenSubida { nombre: string; url: string }

export interface ResultadoIntento {
  idIntento: number; esCorrecto: boolean; idOpcionSeleccionada: number; idOpcionCorrecta: number | null
  retroalimentacion: string; retroalimentacionDisponible: boolean; nivelConfianza: number
  respondidoEn: string; numeroIntento: number; repetido: boolean
}
