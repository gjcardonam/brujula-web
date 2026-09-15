import type { ReactElement } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { BarraSuperior } from '@/components/BarraSuperior'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoginPage } from '@/pages/LoginPage'
import { RegistroPage } from '@/pages/RegistroPage'
import { RecuperarPage } from '@/pages/RecuperarPage'
import { RestablecerPage } from '@/pages/RestablecerPage'
import { PerfilPage } from '@/pages/PerfilPage'
import { BancoPage } from '@/pages/BancoPage'
import { EjercicioPage } from '@/pages/EjercicioPage'
import { CrearEjercicioPage } from '@/pages/admin/CrearEjercicioPage'

function Privado({ rol, children }: { rol?: 'Estudiante' | 'Administrador'; children: ReactElement }) {
  const { usuario } = useAuth()
  const loc = useLocation()
  if (!usuario) return <Navigate to="/login" replace state={{ desde: loc.pathname }} />
  if (rol && usuario.rol !== rol) return <Navigate to={usuario.rol === 'Administrador' ? '/admin/banco' : '/banco'} replace />
  return children
}

function Inicio() {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  return <Navigate to={usuario.rol === 'Administrador' ? '/admin/banco' : '/banco'} replace />
}

export default function App() {
  const { sesionExpirada, descartarExpirada } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/recuperar" element={<RecuperarPage />} />
        <Route path="/restablecer" element={<RestablecerPage />} />

        <Route element={<Privado><BarraSuperior /></Privado>}>
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/banco" element={<Privado rol="Estudiante"><BancoPage /></Privado>} />
          <Route path="/ejercicios/:id" element={<Privado rol="Estudiante"><EjercicioPage /></Privado>} />
          <Route path="/admin/banco" element={<Privado rol="Administrador"><BancoPage /></Privado>} />
          <Route path="/admin/ejercicios/nuevo" element={<Privado rol="Administrador"><CrearEjercicioPage /></Privado>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Dialog open={sesionExpirada}>
        <DialogContent showCloseButton={false} className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Tu sesión expiró</DialogTitle>
            <DialogDescription>
              Por seguridad cerramos tu sesión después de un rato sin actividad. Vuelve a iniciar sesión para continuar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => { descartarExpirada(); navigate('/login', { replace: true }) }}
            >
              Ir a iniciar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  )
}
