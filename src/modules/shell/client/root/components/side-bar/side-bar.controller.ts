/**
 * useSideBarAccordionController — Controller (ADR-0009): estado LOCAL do accordion do side-bar (quais
 * seções estão abertas). Categoria "Hook" (React); a lógica de "menu visível" (RBAC) é da VM, não daqui.
 */
import { useState } from 'react'

export function useSideBarAccordionController(
  initialOpen: Readonly<Record<string, boolean>> = {},
): Readonly<{ isOpen: (label: string) => boolean; toggle: (label: string) => void }> {
  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen)

  return {
    isOpen: (label) => open[label] ?? false,
    toggle: (label) => {
      setOpen((prev) => ({ ...prev, [label]: !(prev[label] ?? false) }))
    },
  }
}
