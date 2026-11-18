import type { ReactNode } from 'react'
import { cn } from 'cn'

export type TonoCabecera = 'marino' | 'violeta' | 'teal' | 'ambar'

const TONOS: Record<TonoCabecera, { fondo: string; etiqueta: string; texto: string; figura: string }> = {
  marino: {
    fondo: 'bg-[linear-gradient(120deg,var(--color-marino-800),var(--color-marino-700)_55%,#2c3f86)]',
    etiqueta: 'text-ambar-500',
    texto: 'text-marino-100',
    figura: 'text-white/12',
  },
  violeta: {
    fondo: 'bg-[linear-gradient(120deg,#3b2fa8,var(--color-violeta-600)_60%,#8b7cf0)]',
    etiqueta: 'text-violeta-100',
    texto: 'text-violeta-50',
    figura: 'text-white/15',
  },
  teal: {
    fondo: 'bg-[linear-gradient(120deg,#07514f,var(--color-teal-700)_50%,var(--color-teal-600))]',
    etiqueta: 'text-teal-100',
    texto: 'text-teal-50',
    figura: 'text-white/15',
  },
  ambar: {
    fondo: 'bg-[linear-gradient(120deg,#8a4b06,var(--color-ocre-600)_55%,var(--color-ambar-500))]',
    etiqueta: 'text-ocre-100',
    texto: 'text-ocre-50',
    figura: 'text-white/18',
  },
}

const FIGURAS = [
  { simbolo: 'π', clase: 'top-3 right-[30%] text-5xl', giro: '-8deg', retraso: '0s' },
  { simbolo: '√x', clase: 'top-[42%] right-[8%] text-6xl', giro: '6deg', retraso: '-3s' },
  { simbolo: '△', clase: '-bottom-3 right-[22%] text-7xl', giro: '-12deg', retraso: '-5s' },
  { simbolo: '%', clase: 'top-4 right-[3%] text-4xl', giro: '10deg', retraso: '-2s' },
  { simbolo: 'Σ', clase: 'bottom-2 right-[44%] text-5xl max-md:hidden', giro: '4deg', retraso: '-6s' },
]

export function Cabecera({
  tono = 'marino',
  etiqueta,
  titulo,
  descripcion,
  accion,
  children,
}: {
  tono?: TonoCabecera
  etiqueta?: string
  titulo: ReactNode
  descripcion?: ReactNode
  accion?: ReactNode
  children?: ReactNode
}) {
  const t = TONOS[tono]
  return (
    <section
      data-sobre-marino
      className={cn('relative isolate overflow-hidden rounded-panel px-6 py-7 text-white sm:px-9 sm:py-9', t.fondo)}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
        <div className="absolute -top-24 -right-16 size-72 rounded-full bg-white/8" />
        <div className="absolute -bottom-28 right-[35%] size-64 rounded-full bg-white/6" />
        {FIGURAS.map(f => (
          <span
            key={f.simbolo}
            className={cn('absolute font-titular font-bold animate-flotar', f.clase, t.figura)}
            style={{ '--giro': f.giro, animationDelay: f.retraso } as React.CSSProperties}
          >
            {f.simbolo}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[640px]">
          {etiqueta && <p className={cn('text-xs font-bold tracking-[0.14em] uppercase', t.etiqueta)}>{etiqueta}</p>}
          <h1 className="mt-1.5 text-3xl font-bold sm:text-[34px] sm:leading-[1.15]">{titulo}</h1>
          {descripcion && <p className={cn('mt-2 text-md', t.texto)}>{descripcion}</p>}
        </div>
        {accion && <div className="shrink-0">{accion}</div>}
      </div>
      {children}
    </section>
  )
}
