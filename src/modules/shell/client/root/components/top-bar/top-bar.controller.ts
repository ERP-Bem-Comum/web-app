/**
 * useTopBarMenuController — Controller (ADR-0009): estado LOCAL do dropdown de usuário do top-bar.
 * Fecha por click-outside e Escape. Categoria "Hook" (React); não é lógica de página (isso é a VM).
 */
import { useEffect, useRef, useState, type RefObject } from 'react'

export function useTopBarMenuController(): Readonly<{
  open: boolean
  toggle: () => void
  close: () => void
  containerRef: RefObject<HTMLDivElement | null>
}> {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (e: MouseEvent): void => {
      if (containerRef.current !== null && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return {
    open,
    toggle: () => {
      setOpen((p) => !p)
    },
    close: () => {
      setOpen(false)
    },
    containerRef,
  }
}
