import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Evita que un error de render deje la pantalla en blanco: muestra un aviso con la opción
 * de recargar o volver al inicio, y deja el detalle en la consola para diagnosticarlo.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no controlado en la interfaz:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="main" style={{ maxWidth: 640 }}>
        <div className="card">
          <h1>Algo salió mal</h1>
          <p>No fue posible mostrar esta pantalla. Tus datos y tus intentos registrados están a salvo.</p>
          <div className="row keep" style={{ marginTop: 14 }}>
            <button className="btn" onClick={() => window.location.reload()}>Recargar la página</button>
            <button className="btn ghost" onClick={() => { window.location.href = '/' }}>Volver al inicio</button>
          </div>
          <div className="note" style={{ marginTop: 14 }}>Detalle técnico: {this.state.error.message}</div>
        </div>
      </div>
    )
  }
}
