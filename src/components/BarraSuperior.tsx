import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { cn } from 'cn'
import { useAuth } from '@/auth/AuthContext'
import { Marca } from '@/components/Marca'

function Enlace({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'relative inline-flex h-11 items-center px-0.5 text-base font-bold whitespace-nowrap transition-colors',
          'after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:transition-colors md:after:-bottom-[15px]',
          isActive ? 'text-marino-800 after:bg-ambar-500' : 'text-texto-suave after:bg-transparent hover:text-marino-800',
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
    <div className="flex min-h-screen flex-col bg-fondo">
      <header className="sticky top-0 z-40 border-b border-borde bg-superficie">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-x-8 px-5 sm:px-10 md:h-[74px]">
          <Link to={inicio} className="order-1 py-4 text-marino-800">
            <Marca />
            <span className="sr-only">Ir al inicio</span>
          </Link>

          <nav
            aria-label="Secciones"
            className="order-3 -mx-5 w-full border-t border-borde px-5 md:order-2 md:mx-0 md:w-auto md:border-0 md:px-0"
          >
            <ul className="flex items-center gap-7">
              <li><Enlace to={inicio}>{esAdmin ? 'Ejercicios' : 'Practicar'}</Enlace></li>
              <li><Enlace to="/perfil">Mi perfil</Enlace></li>
            </ul>
          </nav>

          <div className="order-2 ml-auto flex items-center gap-2 py-3 md:order-3 md:gap-3">
            <Link to="/perfil" className="flex items-center gap-3">
              <span className="hidden max-w-[22ch] truncate text-sm text-texto-suave lg:inline">
                {usuario?.nombre} {usuario?.apellido}
              </span>
              <span
                aria-hidden="true"
                className="grid size-[38px] shrink-0 place-items-center rounded-full bg-marino-800 text-sm font-bold text-white"
              >
                {iniciales(usuario?.nombre, usuario?.apellido)}
              </span>
              <span className="sr-only">Mi perfil de {usuario?.nombre} {usuario?.apellido}</span>
            </Link>
            <button
              type="button"
              onClick={salir}
              disabled={saliendo}
              className="grid size-10 shrink-0 place-items-center rounded-full text-texto-suave transition-colors hover:bg-hueso hover:text-marino-800 disabled:opacity-50"
            >
              <LogOut className="size-[18px]" aria-hidden="true" />
              <span className="sr-only">Cerrar sesión</span>
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
