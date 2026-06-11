/**
 * useSideBarAccordionController — Controller (ADR-0009): estado LOCAL do accordion do side-bar (quais
 * seções estão abertas). Categoria "Hook" (React); a lógica de "menu visível" (RBAC) é da VM, não daqui.
 */
import { useState } from 'react'

export function useSideBarAccordionController(
  initialOpen: Readonly<Record<string, boolean>> = {},
): Readonly<{ isOpen: (label: string) => boolean; toggle: (label: string) => void }> {
  // Efeito sanfona SINGLE-OPEN: no máximo UMA seção aberta por vez. Abrir outra recolhe a anterior;
  // clicar na que já está aberta a fecha. Estado = o label aberto (ou null). O initialOpen aceita o
  // formato de mapa por compatibilidade — a primeira chave marcada como `true` vira a aberta inicial.
  const initialLabel = Object.keys(initialOpen).find((label) => initialOpen[label]) ?? null
  const [openLabel, setOpenLabel] = useState<string | null>(initialLabel)

  return {
    isOpen: (label) => openLabel === label,
    toggle: (label) => {
      setOpenLabel((prev) => (prev === label ? null : label))
    },
  }
}
