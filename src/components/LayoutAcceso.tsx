import type { ReactNode } from 'react'
import { Marca, RosaDeLosVientos } from '@/components/Marca'

export function LayoutAcceso({ texto, nota, children }: { texto: ReactNode; nota?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-fondo lg:grid lg:grid-cols-[3fr_2fr]">
      <section
        data-panel-marino
        className="relative isolate overflow-hidden bg-marino-900 bg-[radial-gradient(130%_110%_at_0%_0%,var(--color-marino-700),var(--color-marino-900)_62%)] px-5 py-10 text-white sm:px-10 lg:flex lg:flex-col lg:justify-center lg:px-16 lg:py-20"
      >
        <RosaDeLosVientos className="pointer-events-none absolute -bottom-24 -right-20 -z-10 size-[360px] text-white/[0.07] lg:-bottom-32 lg:-right-28 lg:size-[540px]" />
        <div className="relative mx-auto w-full max-w-lg lg:mx-0">
          <Marca className="text-3xl" />
          <p className="mt-6 text-base leading-relaxed text-white/85 lg:mt-8 lg:text-xl lg:leading-relaxed">{texto}</p>
          {nota && <p className="mt-6 max-w-md text-sm text-white/70 lg:mt-12">{nota}</p>}
        </div>
      </section>

      <section className="flex items-start justify-center px-4 py-8 sm:px-6 lg:items-center lg:py-20">
        <div className="w-full max-w-[420px] animate-subir">{children}</div>
      </section>
    </div>
  )
}
