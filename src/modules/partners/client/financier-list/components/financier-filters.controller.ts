/**
 * useDebouncedSearch — Controller (ADR-0009): estado LOCAL do campo de busca + debounce nativo
 * (`setTimeout`, sem lib). Mantém o valor digitado responsivo e só comita (navega) após a pausa.
 * Sincroniza quando o valor externo (URL) muda por fora. Categoria "Hook" (React). Espelha o supplier.
 */
import { useEffect, useRef, useState } from 'react'

export function useDebouncedSearch(
  external: string,
  onCommit: (value: string) => void,
  delayMs = 350,
): Readonly<{ value: string; setValue: (next: string) => void }> {
  const [value, setValue] = useState(external)

  const prevExternal = useRef(external)
  useEffect(() => {
    if (external !== prevExternal.current) {
      prevExternal.current = external
      setValue(external)
    }
  }, [external])

  const onCommitRef = useRef(onCommit)
  useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])

  useEffect(() => {
    if (value === external) return
    const handle = setTimeout(() => {
      onCommitRef.current(value)
    }, delayMs)
    return () => {
      clearTimeout(handle)
    }
  }, [value, external, delayMs])

  return { value, setValue }
}
