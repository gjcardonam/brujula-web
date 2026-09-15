import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { cn } from 'cn'
import { useAuth } from '@/auth/AuthContext'
import { Marca } from '@/components/Marca'

function Enlace({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative inline-flex h-11 items-center whitespace-nowrap rounded-sm px-1 text-sm transition-colors',
          'after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:rounded-full after:transition-colors',
          isActive
            ? 'font-semibold text-white after:bg-ambar-500'
            : 'text-white/70 after:bg-transparent hover:text-white',
          className,
        )
      }
    >
      {children}
    </NavLink>
  )
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
      <header data-panel-marino className="sticky top-0 z-40 bg-marino-900 text-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 px-4 sm:px-6">
          <Link to={inicio} className="order-1 rounded-sm py-3">
            <Marca className="text-xl" />
            <span className="sr-only">Ir al inicio</span>
          </Link>

          <nav
            aria-label="Secciones"
            className="order-3 -mx-4 w-full overflow-x-auto border-t border-white/10 px-4 md:order-2 md:mx-0 md:w-auto md:overflow-visible md:border-0 md:px-0"
          >
            <ul className="flex items-center gap-5">
              <li><Enlace to={inicio}>Banco de ejercicios</Enlace></li>
              <li className="md:hidden"><Enlace to="/perfil">Mi perfil</Enlace></li>
            </ul>
          </nav>

          <div className="order-2 ml-auto flex items-center gap-3 py-2 md:order-3">
            <NavLink
              to="/perfil"
              className={({ isActive }) =>
                cn(
                  'hidden max-w-[18ch] truncate rounded-sm text-sm underline-offset-4 transition-colors md:block lg:max-w-[36ch]',
                  isActive
                    ? 'font-medium text-white underline decoration-ambar-500 decoration-2'
                    : 'text-white/80 underline decoration-white/30 hover:text-white hover:decoration-white/70',
                )
              }
            >
              <span className="sr-only">Mi perfil: </span>
              {usuario?.nombre} {usuario?.apellido}
              <span className="text-white/65"> · {usuario?.rol}</span>
            </NavLink>
            <button
              type="button"
              onClick={salir}
              disabled={saliendo}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-white/30 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-60"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cerrar sesión</span>
              <span className="sr-only sm:hidden">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
