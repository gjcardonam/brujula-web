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
      <div className="flex min-h-screen items-center justify-center bg-fondo px-5 py-10">
        <div className="panel w-full max-w-lg p-7 sm:p-9">
          <h1 className="text-2xl font-bold text-marino-800">Algo salió mal</h1>
          <p className="mt-3 text-md leading-relaxed text-texto-suave">
            No pudimos mostrar esta pantalla. Tus datos y tus intentos registrados están a salvo.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex h-12 items-center rounded-control bg-marino-800 px-6 font-titular text-md font-bold text-white shadow-[0_4px_0_var(--color-marino-900)] transition-all hover:bg-marino-700 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-marino-900)]"
              onClick={() => window.location.reload()}
            >
              Recargar la página
            </button>
            <button
              type="button"
              className="inline-flex h-12 items-center rounded-control border-2 border-borde-fuerte bg-superficie px-6 font-titular text-md font-bold text-marino-800 shadow-[0_3px_0_var(--color-borde-fuerte)] transition-all hover:border-marino-200 active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-borde-fuerte)]"
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
