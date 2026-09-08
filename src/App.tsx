import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { Modal } from './components/ui'
import { LoginPage } from './pages/LoginPage'
import { RegistroPage } from './pages/RegistroPage'
import { RecuperarPage } from './pages/RecuperarPage'
import { RestablecerPage } from './pages/RestablecerPage'
import { PerfilPage } from './pages/PerfilPage'
import { BancoPage } from './pages/BancoPage'
import { EjercicioPage } from './pages/EjercicioPage'
import { HistorialPage } from './pages/HistorialPage'
import { SimulacrosPage } from './pages/SimulacrosPage'
import { SimulacroEnCursoPage } from './pages/SimulacroEnCursoPage'
import { ResultadoSimulacroPage } from './pages/ResultadoSimulacroPage'
import { EstadisticasPage } from './pages/EstadisticasPage'
import { EjercicioFormPage } from './pages/admin/EjercicioFormPage'
import { EjercicioDetallePage } from './pages/admin/EjercicioDetallePage'

function Privado({ rol, children }: { rol?: 'Estudiante' | 'Administrador'; children: React.ReactElement }) {
  const { usuario } = useAuth()
  const loc = useLocation()
  if (!usuario) return <Navigate to="/login" replace state={{ desde: loc.pathname }} />
  if (rol && usuario.rol !== rol) return <Navigate to={usuario.rol === 'Administrador' ? '/admin/banco' : '/banco'} replace />
  return children
}

function Inicio() {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  return <Navigate to={usuario.rol === 'Administrador' ? '/admin/banco' : '/banco'} replace />   // HU-002 CA-07
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

        <Route element={<Privado><Layout /></Privado>}>
          <Route path="/perfil" element={<PerfilPage />} />
          {/* Estudiante */}
          <Route path="/banco" element={<Privado rol="Estudiante"><BancoPage /></Privado>} />
          <Route path="/ejercicios/:id" element={<Privado rol="Estudiante"><EjercicioPage /></Privado>} />
          <Route path="/historial" element={<Privado rol="Estudiante"><HistorialPage /></Privado>} />
          <Route path="/historial/:id" element={<Privado rol="Estudiante"><HistorialPage /></Privado>} />
          <Route path="/simulacros" element={<Privado rol="Estudiante"><SimulacrosPage /></Privado>} />
          <Route path="/simulacros/:id" element={<Privado rol="Estudiante"><SimulacroEnCursoPage /></Privado>} />
          <Route path="/simulacros/:id/resultado" element={<Privado rol="Estudiante"><ResultadoSimulacroPage /></Privado>} />
          <Route path="/estadisticas" element={<Privado rol="Estudiante"><EstadisticasPage /></Privado>} />
          {/* Administrador */}
          <Route path="/admin/banco" element={<Privado rol="Administrador"><BancoPage /></Privado>} />
          <Route path="/admin/ejercicios/nuevo" element={<Privado rol="Administrador"><EjercicioFormPage /></Privado>} />
          <Route path="/admin/ejercicios/:id" element={<Privado rol="Administrador"><EjercicioDetallePage /></Privado>} />
          <Route path="/admin/ejercicios/:id/editar" element={<Privado rol="Administrador"><EjercicioFormPage /></Privado>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {sesionExpirada && (
        <Modal titulo="Tu sesión expiró">
          <p style={{ lineHeight: 1.5 }}>Por seguridad cerramos tu sesión después de un periodo sin actividad. Vuelve a iniciar sesión para continuar.</p>
          <button className="btn block" style={{ marginTop: 14 }} onClick={() => { descartarExpirada(); navigate('/login', { replace: true }) }}>Ir a iniciar sesión</button>
        </Modal>
      )}
    </>
  )
}
