/**
 * useDebouncedSearch — Controller (ADR-0009): estado LOCAL do campo de busca + debounce nativo
 * (`setTimeout`, sem lib). Mantém o valor digitado responsivo na UI e só comita (navega) após a
 * pausa — evita uma navegação+query por tecla. Sincroniza quando o valor externo (URL) muda por
 * fora (reset de filtros, voltar no histórico). Categoria "Hook" (React).
 */
import { useEffect, useRef, useState } from 'react'

export function useDebouncedSearch(
  external: string,
  onCommit: (value: string) => void,
  delayMs = 350,
): Readonly<{ value: string; setValue: (next: string) => void }> {
  const [value, setValue] = useState(external)

  // Sincroniza com o valor externo (URL) quando ele muda por fora — reset de filtros, back/forward.
  const prevExternal = useRef(external)
  useEffect(() => {
    if (external !== prevExternal.current) {
      prevExternal.current = external
      setValue(external)
    }
  }, [external])

  // Último `onCommit` num ref — não recria o efeito de debounce a cada render (a page passa uma
  // arrow nova sempre).
  const onCommitRef = useRef(onCommit)
  useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])

  // Debounce: agenda o commit quando `value` diverge do externo; o cleanup cancela o agendamento
  // anterior. Quando a navegação conclui, `external` reflete `value` e o efeito não recomita.
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
