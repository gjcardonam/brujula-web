import type { ReactNode } from 'react'
import { Marca, RosaDeLosVientos } from '@/components/Marca'

export function LayoutAcceso({ texto, nota, children }: { texto: ReactNode; nota?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-fondo p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid w-full max-w-[1240px] items-stretch gap-5 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.15fr_1fr] lg:gap-8">
        <section
          data-sobre-marino
          className="relative isolate flex flex-col justify-between gap-9 overflow-hidden rounded-panel bg-marino-800 px-7 py-9 text-white sm:px-10 sm:py-12 lg:min-h-[620px] lg:gap-12 lg:px-14 lg:py-14"
        >
          <RosaDeLosVientos
            grosor={0.12}
            className="pointer-events-none absolute -right-16 -bottom-16 -z-10 size-[300px] text-white opacity-[0.15] sm:-right-24 sm:-bottom-24 sm:size-[420px] lg:-right-36 lg:-bottom-36 lg:size-[560px]"
          />
          <Marca tamano="lg" className="relative" />
          <p className="relative max-w-[30rem] text-lg leading-relaxed text-marino-100 lg:text-2xl lg:leading-[1.45]">
            {texto}
          </p>
          <p className="relative max-w-md text-base text-marino-200">{nota}</p>
        </section>

        <section className="flex items-start justify-center lg:items-center">
          <div className="w-full max-w-[460px] animate-entrar">{children}</div>
        </section>
      </div>
    </div>
  )
}
