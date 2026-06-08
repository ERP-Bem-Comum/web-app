/**
 * Numeração de aditivos (padrão da stakeholder): `AD 01-XXXX/ANO` — sequência por contrato (1-based,
 * por ordem de criação) + o número sequencial do contrato. Puro: derivado de `children`, sem I/O.
 */
import type { Amendment } from '#modules/contracts/public-api/index.ts'

const pad2 = (n: number): string => String(n).padStart(2, '0')

/** Mapa id-do-aditivo → posição na sequência (AD 01 = o mais antigo). */
export const amendmentSeqMap = (children: readonly Amendment[]): ReadonlyMap<string, number> => {
  const ordered = [...children].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  return new Map(ordered.map((a, i) => [a.id, i + 1]))
}

/** `AD 01-483/2026`. `seq` ausente (não deveria ocorrer) → cai no número cru do backend. */
export const formatAmendmentNumber = (
  seq: number | undefined,
  contractSequentialNumber: string,
  fallback: string,
): string => (seq === undefined ? fallback : `AD ${pad2(seq)}-${contractSequentialNumber}`)
