// Tipos que devuelve la API (brujula-api). Mantener alineados con los DTO de Java.

export interface Usuario { id: number; nombre: string; apellido: string; email: string; rol: 'Estudiante' | 'Administrador' }
export interface Sesion { token: string; expiraEn: string; usuario: Usuario }
export interface Mensaje { mensaje: string }
export interface Item { id: number; nombre: string }

export interface Pagina<T> { contenido: T[]; pagina: number; tamano: number; totalElementos: number; totalPaginas: number }

export interface Catalogos {
  componentes: Item[]; competencias: Item[]; niveles: Item[]; tiposError: Item[]
  duraciones: { id: number; minutos: number }[]
}

export interface Tarjeta { id: number; numero: number; componente: string; competencia: string; nivel: string; estado: 'Activo' | 'Desactivado'; intentos: number | null }
export interface ComponenteConteo { id: number; nombre: string; cantidad: number }
export interface Componentes { total: number; componentes: ComponenteConteo[] }

export interface OpcionEstudiante { id: number; letra: string; descripcion: string | null; imagen: string | null; orden: number }
export interface EjercicioEstudiante {
  id: number; numero: number; enunciado: string; imagenEnunciado: string | null
  componente: Item; competencia: Item; nivel: string; estado: string
  opciones: OpcionEstudiante[]; intentosPrevios: number
}

export interface OpcionAdmin {
  id: number; letra: string; descripcion: string | null; imagen: string | null; esCorrecta: boolean
  retroalimentacion: string; tipoError: Item | null; orden: number; usadaEnIntentos: boolean
}
export interface DistribucionError { tipo: string; cantidad: number; porcentaje: number }
export interface EstadisticasUso { intentos: number; correctos: number; porcentajeAciertos: number; errores: DistribucionError[] }
export interface EjercicioAdmin {
  id: number; numero: number; enunciado: string; imagenEnunciado: string | null
  componente: Item; competencia: Item; nivel: Item; estado: 'Activo' | 'Desactivado'
  creadoPor: string; creadoEn: string; opciones: OpcionAdmin[]; uso: EstadisticasUso; tieneIntentos: boolean
}

export interface OpcionRequest { id?: number | null; descripcion: string; imagen: string | null; esCorrecta: boolean; retroalimentacion: string; idTipoError: number | null }
export interface EjercicioRequest { enunciado: string; imagenEnunciado: string | null; idComponente: number | null; idCompetencia: number | null; idNivelDificultad: number | null; opciones: OpcionRequest[] }

export interface ResultadoIntento {
  idIntento: number; esCorrecto: boolean; idOpcionSeleccionada: number; idOpcionCorrecta: number | null
  retroalimentacion: string; retroalimentacionDisponible: boolean; nivelConfianza: number
  fechaHora: string; numeroIntento: number; repetido: boolean; idSimulacro: number | null
}
export interface IntentoResumen {
  id: number; idEjercicio: number; numeroEjercicio: number; componente: string; competencia: string; nivel: string
  esCorrecto: boolean; fechaHora: string; estadoEjercicio: string; enSimulacro: boolean
}
export interface OpcionHistorial { id: number; letra: string; descripcion: string | null; imagen: string | null; seleccionada: boolean; esCorrecta: boolean }
export interface IntentoDetalle {
  id: number; idEjercicio: number; numeroEjercicio: number; enunciado: string; imagenEnunciado: string | null
  componente: string; competencia: string; nivel: string; estadoEjercicio: string
  opciones: OpcionHistorial[]; esCorrecto: boolean; nivelConfianza: number; fechaHora: string; retroalimentacion: string; idSimulacro: number | null
}

export interface EstadoSimulacro {
  id: number; estado: 'En curso' | 'Finalizado'; duracionMinutos: number; fechaInicio: string; finPrevisto: string
  ahora: string; tiempoRestanteSeg: number; respondidos: number; correctas: number
}
export interface SiguienteSimulacro { finalizado: boolean; motivo: string | null; ejercicio: EjercicioEstudiante | null; estado: EstadoSimulacro }
export interface DesempenoArea { id: number; nombre: string; intentos: number; correctas: number; porcentaje: number }
export interface Recomendacion { orden: number; area: string; tipo: string; idComponente: number | null; idCompetencia: number | null; porcentaje: number; mensaje: string }
export interface ResultadoSimulacro {
  id: number; fechaInicio: string; fechaFin: string; duracionMinutos: number; tiempoUtilizadoSeg: number | null
  respondidos: number; correctas: number; incorrectas: number; porcentajeAciertos: number
  porComponente: DesempenoArea[]; porCompetencia: DesempenoArea[]
  recomendaciones: Recomendacion[]; mensajeRecomendacion: string | null; detalle: IntentoDetalle[]
}
export interface ResumenSimulacro {
  id: number; fechaInicio: string; fechaFin: string; duracionMinutos: number; tiempoUtilizadoSeg: number | null
  respondidos: number; correctas: number; incorrectas: number; porcentajeAciertos: number
}

export interface PorArea { id: number; nombre: string; intentados: number; correctas: number; incorrectas: number; porcentajeAciertos: number; porcentajeDesaciertos: number }
export interface PorConfianza { nivel: number; intentados: number; correctas: number; incorrectas: number; porcentajeCorrectas: number; porcentajeIncorrectas: number }
export interface Estadisticas {
  sinDatos: boolean
  resumen: { intentados: number; correctas: number; incorrectas: number; porcentajeAciertos: number; porcentajeDesaciertos: number }
  porComponente: PorArea[]; porCompetencia: PorArea[]; porConfianza: PorConfianza[]
  simulacros: { cantidad: number; porcentajePromedioAciertos: number; promedioEjercicios: number; tiempoPromedioSeg: number; ejerciciosPorHora: number }
  errores: { totalIncorrectos: number; distribucion: { tipo: string; cantidad: number; porcentaje: number }[]; tipoPredominante: string | null; mensajeOrientador: string | null; idComponenteFiltro: number | null }
  componentesConIntentos: Item[]
}
