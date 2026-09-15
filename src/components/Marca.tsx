import { cn } from 'cn'

export function Marca({ className }: { className?: string }) {
  return (
    <span className={cn('font-bold tracking-tight text-white', className)}>
      Brú<span className="text-ambar-500">jula</span>
    </span>
  )
}

export function RosaDeLosVientos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false" className={className}>
      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="66" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="4" fill="currentColor" />
      <path d="M100 12 L112 100 L100 188 L88 100 Z" fill="currentColor" opacity="0.55" />
      <path d="M12 100 L100 88 L188 100 L100 112 Z" fill="currentColor" opacity="0.3" />
      <path d="M100 30 L108 100 L100 170 L92 100 Z" fill="currentColor" opacity="0.25" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6
        return (
          <line
            key={i}
            x1={100 + Math.sin(a) * 84}
            y1={100 - Math.cos(a) * 84}
            x2={100 + Math.sin(a) * 92}
            y2={100 - Math.cos(a) * 92}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        )
      })}
    </svg>
  )
}
