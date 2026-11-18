import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { cn } from 'cn'
import { useAuth } from '@/auth/AuthContext'
import { Marca } from '@/components/Marca'

function Enlace({ to, end = true, children }: { to: string; end?: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'relative inline-flex h-11 items-center justify-center px-0.5 text-xs min-[380px]:text-sm md:text-base font-bold whitespace-nowrap transition-colors',
          'after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:transition-colors md:after:-bottom-[15px]',
          isActive ? 'text-white after:bg-ambar-500' : 'text-sobre-fondo-suave after:bg-transparent hover:text-white',
        )
      }
    >
      {children}
    </NavLink>
  )
}

function iniciales(nombre?: string, apellido?: string): string {
  const a = nombre?.trim()?.[0] ?? ''
  const b = apellido?.trim()?.[0] ?? ''
  return (a + b).toUpperCase() || 'B'
}

export function BarraSuperior() {
  const { usuario, esAdmin, cerrar } = useAuth()
  const navigate = useNavigate()
  const [saliendo, setSaliendo] = useState(false)
  const inicio = esAdmin ? '/admin/banco' : '/banco'

  async function salir() {
    setSaliendo(true)
    await cerrar()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col fondo-vivo">
      <header data-sobre-marino className="sticky top-0 z-40 border-b border-white/10 bg-escenario/75 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-x-8 px-5 sm:px-10 md:h-[74px]">
          <Link to={inicio} className="order-1 py-4 text-white">
            <Marca />
            <span className="sr-only">Ir al inicio</span>
          </Link>

          <nav
            aria-label="Secciones"
            className="order-3 w-full border-t border-white/10 md:order-2 md:w-auto md:border-0"
          >
            <ul className="-mx-1 flex items-center gap-5 overflow-x-auto px-1 [scrollbar-width:none] md:mx-0 md:gap-6 md:overflow-visible md:px-0">
              <li><Enlace to={inicio}>{esAdmin ? 'Ejercicios' : 'Practicar'}</Enlace></li>
              {!esAdmin && <li><Enlace to="/simulacros" end={false}>Simulacros</Enlace></li>}
              {!esAdmin && <li><Enlace to="/historial">Historial</Enlace></li>}
              {!esAdmin && <li><Enlace to="/estadisticas">Mis estadísticas</Enlace></li>}
              <li><Enlace to="/perfil">Mi perfil</Enlace></li>
            </ul>
          </nav>

          <div className="order-2 ml-auto flex items-center gap-2 py-3 md:order-3 md:gap-3">
            <Link to="/perfil" className="flex items-center gap-3">
              <span className="hidden max-w-[22ch] truncate text-sm text-sobre-fondo-suave lg:inline">
                {usuario?.nombre} {usuario?.apellido}
              </span>
              <span
                aria-hidden="true"
                className="grid size-[38px] shrink-0 place-items-center rounded-full bg-ambar-500 text-sm font-bold text-marino-900"
              >
                {iniciales(usuario?.nombre, usuario?.apellido)}
              </span>
              <span className="sr-only">Mi perfil de {usuario?.nombre} {usuario?.apellido}</span>
            </Link>
            <button
              type="button"
              onClick={salir}
              disabled={saliendo}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-bold text-sobre-fondo-suave transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <LogOut className="size-[18px]" aria-hidden="true" />
              <span className="max-sm:sr-only">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-8 sm:px-10 sm:py-9">
        <Outlet />
      </main>
    </div>
  )
}
