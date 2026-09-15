import { cn } from 'cn'

export function RosaDeLosVientos({ className, grosor = 0.35 }: { className?: string; grosor?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <path d="M15.2 8.8l-2.1 4.4-4.3 2.1 2.1-4.4z" />
    </svg>
  )
}

export function Marca({ className, tamano = 'md' }: { className?: string; tamano?: 'md' | 'lg' }) {
  const grande = tamano === 'lg'
  return (
    <span className={cn('inline-flex items-center', grande ? 'gap-3' : 'gap-2.5', className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        focusable="false"
        className={grande ? 'size-9' : 'size-[26px]'}
      >
        <circle cx="12" cy="12" r="9" />
        <path
          d="M15.2 8.8l-2.1 4.4-4.3 2.1 2.1-4.4z"
          fill="var(--color-ambar-500)"
          stroke="var(--color-ambar-500)"
          strokeLinejoin="round"
        />
      </svg>
      <span className={cn('font-titular font-bold', grande ? 'text-3xl' : 'text-xl')}>
        Brú<span className="text-ambar-500">jula</span>
      </span>
    </span>
  )
}
