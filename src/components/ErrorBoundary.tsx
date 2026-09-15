import { Component, type ErrorInfo, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo px-4 py-10">
        <div className="superficie w-full max-w-lg p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gris-900">Algo salió mal</h1>
          <p className="mt-2 text-sm leading-relaxed text-gris-700">
            No pudimos mostrar esta pantalla. Tus datos y tus intentos registrados están a salvo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-md bg-marino-800 px-4 text-sm font-medium text-white transition-colors hover:bg-marino-900"
              onClick={() => window.location.reload()}
            >
              Recargar la página
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-md border border-gris-200 bg-superficie px-4 text-sm font-medium text-gris-700 transition-colors hover:bg-marino-50"
              onClick={() => { window.location.href = '/' }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }
}
