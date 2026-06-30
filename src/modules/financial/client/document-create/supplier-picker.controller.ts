/**
 * Controller do picker de parceiro (hero do Lançar Documento) — UI-state (§XI: estado de UI fora da view).
 * Guarda só "aberto?" e o texto de busca. A filtragem é PURA (`filterPartners` em document-form.view).
 */
import { useState } from 'react'

export type SupplierPickerController = Readonly<{
  open: boolean
  query: string
  toggle: () => void
  close: () => void
  setQuery: (value: string) => void
}>

export function useSupplierPickerController(): SupplierPickerController {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  return {
    open,
    query,
    toggle: () => {
      setOpen((v) => !v)
    },
    close: () => {
      setOpen(false)
      setQuery('')
    },
    setQuery,
  }
}
