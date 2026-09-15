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
    <div role="radiogroup" aria-label={etiqueta} className="flex w-full gap-2 sm:w-auto">
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
              'inline-flex h-[46px] min-w-0 flex-1 items-center justify-center rounded-control border-2 font-titular text-md font-bold transition-[transform,box-shadow,background-color,border-color,color] sm:w-[54px] sm:flex-none',
              'disabled:cursor-default disabled:opacity-70',
              activo
                ? 'border-ambar-500 bg-ambar-500 text-marino-800 shadow-[0_3px_0_var(--color-ambar-700)]'
                : 'border-borde-fuerte bg-superficie text-texto-suave hover:border-marino-200 hover:text-marino-800',
              !disabled && 'active:translate-y-[2px] active:shadow-none',
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
