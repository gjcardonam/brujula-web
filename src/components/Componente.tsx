export type ClaveComponente = 'violeta' | 'teal' | 'ocre'

export interface TonoComponente {
  clave: ClaveComponente
  texto: string
  icono: string
  fondoSuave: string
  fondoSolido: string
  borde: string
  bordeSuave: string
  linea: string
  peso: string
  anillo: string
  pildora: string
}

const TONOS: Record<ClaveComponente, TonoComponente> = {
  violeta: {
    clave: 'violeta',
    texto: 'text-violeta-700',
    icono: 'text-violeta-600',
    fondoSuave: 'bg-violeta-50',
    fondoSolido: 'bg-violeta-600',
    borde: 'border-violeta-600',
    bordeSuave: 'border-violeta-200',
    linea: 'bg-violeta-100',
    peso: 'shadow-[0_3px_0_var(--color-violeta-700)]',
    anillo: '[outline:4px_solid_var(--color-violeta-200)]',
    pildora: 'bg-violeta-50 text-violeta-700',
  },
  teal: {
    clave: 'teal',
    texto: 'text-teal-700',
    icono: 'text-teal-600',
    fondoSuave: 'bg-teal-50',
    fondoSolido: 'bg-teal-600',
    borde: 'border-teal-600',
    bordeSuave: 'border-teal-200',
    linea: 'bg-teal-100',
    peso: 'shadow-[0_3px_0_var(--color-teal-700)]',
    anillo: '[outline:4px_solid_var(--color-teal-200)]',
    pildora: 'bg-teal-50 text-teal-700',
  },
  ocre: {
    clave: 'ocre',
    texto: 'text-ocre-700',
    icono: 'text-ocre-600',
    fondoSuave: 'bg-ocre-50',
    fondoSolido: 'bg-ocre-600',
    borde: 'border-ocre-600',
    bordeSuave: 'border-ocre-200',
    linea: 'bg-ocre-100',
    peso: 'shadow-[0_3px_0_var(--color-ocre-700)]',
    anillo: '[outline:4px_solid_var(--color-ocre-200)]',
    pildora: 'bg-ocre-50 text-ocre-700',
  },
}

function normalizar(nombre: string): string {
  return nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function claveDeComponente(nombre: string | null | undefined): ClaveComponente {
  const n = normalizar(nombre ?? '')
  if (n.includes('geometr')) return 'teal'
  if (n.includes('estadist') || n.includes('probabil')) return 'ocre'
  return 'violeta'
}

export function tonoDeComponente(nombre: string | null | undefined): TonoComponente {
  return TONOS[claveDeComponente(nombre)]
}

export function IconoComponente({ nombre, className }: { nombre: string | null | undefined; className?: string }) {
  const clave = claveDeComponente(nombre)
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false" className={className}>
      {clave === 'teal' && <path d="M4 19h16L12 5z" strokeLinejoin="round" />}
      {clave === 'ocre' && <path d="M5 19V11M12 19V5M19 19v-5" strokeLinecap="round" />}
      {clave === 'violeta' && (
        <>
          <path d="M4 19c4-1 5-14 9-14 3 0 3 5 7 5" strokeLinecap="round" />
          <path d="M4 9h8" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
