export function enfocarPrimerError(form: HTMLFormElement | null) {
  if (!form) return
  requestAnimationFrame(() => {
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  })
}
