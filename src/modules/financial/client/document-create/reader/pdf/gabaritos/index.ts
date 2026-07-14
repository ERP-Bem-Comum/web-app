/**
 * Registro central de gabaritos de PDF. O motor testa na ordem e usa o primeiro que "detectar" (mais
 * específico primeiro): DANFE (produto) → FILU (SP) → DANFSe v2 (Fortaleza) → DANFSe v1 (nacional).
 */
import type { Gabarito } from '../gabarito-engine.ts'
import { gabaritoDanfe } from './danfe.gabarito.ts'
import { gabaritoFiluSp } from './filu-sp.gabarito.ts'
import { gabaritoDanfseV2 } from './danfse-v2.gabarito.ts'
import { gabaritoDanfse } from './danfse.gabarito.ts'

export const GABARITOS: readonly Gabarito[] = [
  gabaritoDanfe,
  gabaritoFiluSp,
  gabaritoDanfseV2,
  gabaritoDanfse,
]
