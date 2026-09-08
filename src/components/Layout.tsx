import { NavLink, Outlet, useNavigate, type NavLinkProps } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function Item({ to, children, end }: { to: string; children: React.ReactNode; end?: NavLinkProps['end'] }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `item ${isActive ? 'on' : ''}`}>{children}</NavLink>
}

/** Barra de navegación según el rol (M-04 a M-14). "Cerrar Sesión" siempre visible (HU-004 CA-01). */
export function Layout() {
  const { usuario, esAdmin, cerrar } = useAuth()
  const navigate = useNavigate()

  async function salir() {
    await cerrar()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app">
      <header className="nav">
        <a className="logo" href={esAdmin ? '/admin/banco' : '/banco'}>Brú<span>jula</span></a>
        {esAdmin ? (
          <Item to="/admin/banco">Banco de ejercicios</Item>
        ) : (
          <>
            <Item to="/banco">Banco de ejercicios</Item>
            <Item to="/simulacros">Simulacros</Item>
            <Item to="/estadisticas">Mis estadísticas</Item>
            <Item to="/historial">Historial</Item>
          </>
        )}
        <div className="sp" />
        <div className="user"><NavLink to="/perfil">{usuario?.nombre} {usuario?.apellido}</NavLink> · {usuario?.rol}</div>
        <button className="out" onClick={salir}>Cerrar Sesión</button>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
