// Debounce minimalista — substitui lodash-es#debounce no subset usado pelo projeto.
// Não inclui `leading`/`trailing`/`maxWait`. Adicione se precisar; hoje todos os calls usam o default.
export function debounce<TArgs extends readonly unknown[]>(
  fn: (...args: TArgs) => void,
  wait: number,
): ((...args: TArgs) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined

  const debounced = (...args: TArgs): void => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      fn(...args)
    }, wait)
  }

  debounced.cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  return debounced
}
