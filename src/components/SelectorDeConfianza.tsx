import { useRef } from 'react'
import { cn } from 'cn'

const NIVELES = [1, 2, 3, 4, 5]

export function SelectorDeConfianza({
  valor,
  onCambiar,
  disabled,
  etiqueta,
}: {
  valor: number | null
  onCambiar: (n: number) => void
  disabled?: boolean
  etiqueta: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const foco = valor ? NIVELES.indexOf(valor) : 0

  function alTeclado(e: React.KeyboardEvent, i: number) {
    const mapa: Record<string, number> = {
      ArrowRight: (i + 1) % NIVELES.length,
      ArrowDown: (i + 1) % NIVELES.length,
      ArrowLeft: (i + NIVELES.length - 1) % NIVELES.length,
      ArrowUp: (i + NIVELES.length - 1) % NIVELES.length,
      Home: 0,
      End: NIVELES.length - 1,
    }
    const destino = mapa[e.key]
    if (destino === undefined) return
    e.preventDefault()
    onCambiar(NIVELES[destino])
    refs.current[destino]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex gap-2">
      {NIVELES.map((n, i) => {
        const activo = valor === n
        return (
          <button
            key={n}
            type="button"
            ref={el => { refs.current[i] = el }}
            role="radio"
            aria-checked={activo}
            aria-label={`Nivel ${n} de 5`}
            tabIndex={disabled ? -1 : i === foco ? 0 : -1}
            disabled={disabled}
            onClick={() => onCambiar(n)}
            onKeyDown={e => alTeclado(e, i)}
            className={cn(
              'inline-flex size-11 items-center justify-center rounded-md border text-base transition-all',
              'disabled:cursor-not-allowed disabled:opacity-60',
              activo
                ? 'border-ambar-600 bg-ambar-500 font-semibold text-gris-900 shadow-tarjeta'
                : 'border-gris-200 bg-superficie text-gris-700 hover:border-marino-700 hover:text-marino-900',
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
