import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from 'cn'

function rango(pagina: number, total: number): (number | 'salto')[] {
  const desde = Math.max(0, Math.min(pagina - 2, total - 5))
  const hasta = Math.min(total - 1, Math.max(pagina + 2, 4))
  const items: (number | 'salto')[] = []
  if (desde > 0) {
    items.push(0)
    if (desde > 1) items.push('salto')
  }
  for (let i = Math.max(0, desde); i <= hasta; i++) items.push(i)
  if (hasta < total - 1) {
    if (hasta < total - 2) items.push('salto')
    items.push(total - 1)
  }
  return items
}

const base =
  'inline-flex h-11 min-w-11 items-center justify-center rounded-ficha border-2 px-3 font-titular text-base font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40'

export function Paginacion({ pagina, totalPaginas, onCambiar }: { pagina: number; totalPaginas: number; onCambiar: (p: number) => void }) {
  if (totalPaginas <= 1) return null
  return (
    <nav aria-label="Paginación del banco" className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        className={cn(base, 'border-borde-fuerte bg-superficie text-marino-800 hover:border-marino-200')}
        disabled={pagina === 0}
        onClick={() => onCambiar(pagina - 1)}
      >
        <ChevronLeft className="size-[18px]" aria-hidden="true" />
        <span className="sr-only">Página anterior</span>
      </button>

      {rango(pagina, totalPaginas).map((p, i) =>
        p === 'salto' ? (
          <span key={`salto-${i}`} aria-hidden="true" className="px-1 text-texto-tenue">…</span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === pagina ? 'page' : undefined}
            aria-label={`Página ${p + 1}`}
            className={cn(
              base,
              p === pagina
                ? 'border-marino-800 bg-marino-800 text-white shadow-[0_3px_0_var(--color-marino-900)]'
                : 'border-borde-fuerte bg-superficie text-marino-800 hover:border-marino-200',
            )}
            onClick={() => onCambiar(p)}
          >
            {p + 1}
          </button>
        ),
      )}

      <button
        type="button"
        className={cn(base, 'border-borde-fuerte bg-superficie text-marino-800 hover:border-marino-200')}
        disabled={pagina >= totalPaginas - 1}
        onClick={() => onCambiar(pagina + 1)}
      >
        <ChevronRight className="size-[18px]" aria-hidden="true" />
        <span className="sr-only">Página siguiente</span>
      </button>
    </nav>
  )
}
