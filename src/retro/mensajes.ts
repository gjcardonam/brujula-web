// Textos de la retroalimentación por tipo de error (propuesta del equipo, sprint 3).
// {componente} y {confianza} se reemplazan con los datos del ejercicio y del intento.

export type TipoDeError = 'Error cognitivo' | 'Error de hábito' | 'Error de ansiedad'

interface Textos {
  normales: string[]
  seguidos: string[]
  anecdotas: string[]
}

export const POR_TIPO: Record<TipoDeError, Textos> = {
  'Error cognitivo': {
    normales: [
      'A mí también me pasó en once. Elegiste esa opción porque tenía lógica, solo que la idea de base no era la correcta. Busca en la explicación el paso donde se cruzó el camino.',
      'Aquí no faltó esfuerzo, faltó una pieza. La explicación de arriba es esa pieza. Léela con calma y luego probamos con otro parecido.',
      'Esta confusión es de las más comunes en {componente}. Cuando la entiendes una vez, te sirve para varias preguntas del Saber.',
      'Equivocarse y entender por qué es de las mejores formas de aprender. Ya diste el primer paso; el segundo es leer la explicación.',
      'Un minuto leyendo esto vale más que tres ejercicios a la carrera. Mira por qué tu opción no funciona antes de seguir.',
      'Quédate con la regla que sí funciona y ponla a prueba en el siguiente. Así se aprende, pieza por pieza.',
      'Lo que eligió tu cabeza tenía sentido, pero aquí no aplica. Fíjate en qué cambia entre tu opción y la correcta.',
      'No te preocupes por la respuesta, preocúpate por la idea. Si la idea queda clara, las respuestas llegan solas.',
      'Este tema se aprende justo así: probando, equivocándose y corrigiendo. Lee la explicación y vamos con otro de {componente}.',
      'Esta pregunta te mostró algo que vale oro: qué te falta repasar. Aprovéchalo leyendo la explicación con calma.',
    ],
    seguidos: [
      'Llevas varios en {componente} que no salen. No es mala señal: aquí está lo que más te conviene repasar. ¿Le damos otra vuelta?',
      '{componente} se está poniendo difícil, y eso es normal. Lee despacio esta explicación; puede ser la que destrabe las demás.',
    ],
    anecdotas: [
      'En once creía que si el lado de un cuadrado se duplicaba, el área también. Lo descubrí revisando un simulacro y nunca se me volvió a olvidar.',
      'Yo pensaba que el promedio siempre era el mejor resumen de unos datos, hasta que un dato muy grande me dañó todo un ejercicio.',
    ],
  },
  'Error de hábito': {
    normales: [
      'Esto tú lo sabes: venías acertando en este tipo de ejercicios. Seguro se te fue un detalle, como un signo, una unidad o un "no" escondido.',
      'Me pasaba igual: sabía hacerlo, lo hacía rapidísimo y ahí perdía puntos. Vuelve a leer qué te piden.',
      'No es el tema, es la prisa. Antes de marcar, pregúntate: ¿respondí lo que me preguntaron?',
      'En el Saber, un descuido vale lo mismo que no saber. Diez segundos de revisión pueden salvarte varios puntos.',
      'Te reto: en el siguiente, revisa signos y unidades antes de confirmar. Si sale, ya tienes el truco.',
      'Tus resultados recientes en este tema son buenos. Esto fue un tropezón, no un retroceso.',
      'Lo difícil ya lo tienes, que es saber cómo se hace. Lo que falta es lo fácil: leer con calma hasta el final.',
      'Revisa la pregunta otra vez. Apuesto a que encuentras el detalle en menos de un minuto.',
      'Las palabras pequeñas cambian todo: "no", "excepto", "a lo sumo", "por lo menos". Vale la pena buscarlas antes de responder.',
      'Saber hacerlo es la mitad. La otra mitad es hacerlo con cuidado, y eso se entrena igual que las matemáticas.',
    ],
    seguidos: [
      'Van varios descuidos seguidos. Si llevas rato practicando, puede ser cansancio, y una pausa corta también es estudiar.',
      'Tu cabeza va más rápido que tus ojos. En los próximos tres ejercicios, lee la pregunta dos veces antes de empezar.',
    ],
    anecdotas: [
      'En mi Saber leí "mayor" donde decía "menor". Desde ese día repaso mentalmente qué me están preguntando.',
      'Una vez hice todo bien y al final olvidé pasar de centímetros a metros. Desde ahí reviso las unidades de último.',
    ],
  },
  'Error de ansiedad': {
    normales: [
      'Marcaste confianza {confianza} de 5 y la respuesta era otra. Te cuento algo: estos errores son de los que mejor se corrigen, porque la sorpresa hace que se queden.',
      'Tener confianza está bien. Solo date un momento antes de confirmar, sobre todo cuando la respuesta te salió muy rápido.',
      'Yo también respondía todo de una, sin dudar. Aprendí a hacer una última revisión y me fue mejor. Pruébalo en el siguiente.',
      'Esta te sorprendió, y eso es bueno: lo que nos sorprende es lo que más recordamos. Mira en qué paso se separó tu camino del correcto.',
      'Si alguna vez dudas, márcalo así. Tu confianza real nos ayuda a mostrarte qué repasar.',
      'Tranqui, una respuesta no define cómo te va a ir. Revisa la explicación y sigamos.',
      'Cuando algo se siente muy fácil, vale la pena mirarlo dos veces. A veces la pregunta tiene una trampa pequeña.',
      'Ir con confianza es bueno; ir con confianza y revisando es mejor. Ese hábito hace la diferencia en el Saber.',
      'Lee la explicación sin afán. Con una sola idea clara para el próximo ejercicio es suficiente.',
      'Tu seguridad es una fortaleza. Solo falta acompañarla de una última mirada antes de confirmar.',
    ],
    seguidos: [
      'Llevas varias en {componente} en las que tenías mucha confianza y no salieron. Puede haber una idea que se siente bien pero no es; lee despacio la próxima explicación.',
      'Hagamos algo distinto en el próximo: antes de confirmar, explícate en una frase por qué esa es la respuesta.',
    ],
    anecdotas: [
      'En un simulacro respondí las primeras diez en cinco minutos, sin dudar. Fallé cuatro. Desde ahí reviso siempre la última operación.',
      'Me pasaba que entre más fácil se veía una pregunta, más rápido respondía. Aprendí a contar hasta cinco antes de marcar.',
    ],
  },
}

export const AL_ACERTAR = {
  confianzaBaja: [
    '¡Acertaste aunque dudabas! Sabes más de {componente} de lo que crees.',
    'Dudaste y aun así llegaste. La próxima vez confía un poco más en tu procedimiento.',
    'Esa duda te la puedes ir quitando: en {componente} vas mejor de lo que piensas.',
  ],
  confianzaMedia: [
    'Bien resuelto. Cada acierto así te da más seguridad para el siguiente.',
    'Correcto. Vas armando el camino.',
  ],
  confianzaAlta: [
    'Lo tenías claro. ¡Sigue!',
    'Bien. Vamos por el siguiente.',
    'Así se hace: claro y con confianza.',
    'Este tema ya es tuyo. Vamos por otro.',
  ],
  despuesDeUnError: [
    'Ese costó, pero salió.',
    '¿Ves? Corregiste el camino.',
    'Eso es aprender de verdad: te equivocaste, revisaste y lo lograste.',
  ],
}

export const MOMENTOS = {
  primerEjercicio: 'Arrancamos. Si algo no sale, aquí estamos para mostrarte por dónde va el camino.',
  pausa: 'Llevas un buen rato practicando. Una pausa de cinco minutos ayuda a que lo aprendido se quede.',
  regreso: 'Qué bueno verte de nuevo. Arranquemos con uno de {componente} para calentar.',
}

export function esTipoConTarjeta(tipo: string | null): tipo is TipoDeError {
  return tipo !== null && tipo in POR_TIPO
}

export function rellenar(texto: string, datos: { componente: string; confianza: number }) {
  return texto.split('{componente}').join(datos.componente).split('{confianza}').join(String(datos.confianza))
}
