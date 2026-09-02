/**
 * Anti-corruption do pré-voo da remessa: response do core-api → Model do domínio. PURO (sem I/O), tudo
 * `Result` (§II). Espelha `financial.mappers.ts`.
 *
 * Enum desconhecido NÃO vira `ready`. Um `status` que o front não conhece cai em `blocked`, e uma `route`
 * desconhecida vira `null`: num fluxo que enfileira pagamento, o default seguro é "não sai" — tratar drift
 * como apto colocaria no arquivo um título que ninguém conferiu.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'
import type {
  PayoutField,
  PayoutGap,
  PayoutGapReason,
  PreviewLineStatus,
  RemittancePreview,
  RemittancePreviewLine,
  VanRoute,
  GeneratedRemittance,
} from '#modules/financial/server/domain/remittance.io.ts'

import { CoreApiRemittancePreviewSchema, CoreApiGeneratedRemittanceSchema } from './remittance.schema.ts'

const LINE_STATUSES: ReadonlySet<string> = new Set<PreviewLineStatus>([
  'ready',
  'blocked',
  'out-of-van',
  'not-found',
  'not-approved',
  // core-api#792/ADR-0065 §5. ⚠️ Sem esta entrada o status caía no fallback de drift e virava
  // `blocked` — seguro para o dinheiro, mas ILEGÍVEL para quem opera: a linha aparecia vermelha e sem
  // motivo, e o operador ia procurar defeito num cadastro que está completo. O certo já foi enviado.
  'transmitted',
  // core-api#837/PR #925. Mesma armadilha do `transmitted` logo acima, e é a segunda vez: sem esta
  // entrada o status novo vira `blocked` por drift — seguro para o dinheiro, ilegível para quem opera.
  'no-issuer',
])

const VAN_ROUTES: ReadonlySet<string> = new Set<VanRoute>(['pix', 'transfer', 'billet', 'tax-guide'])

const PAYOUT_FIELDS: ReadonlySet<string> = new Set<PayoutField>([
  'pix-key',
  'payee-bank-code',
  'payee-agency',
  'payee-account-number',
  'payee-account-digit',
  'payment-detail',
])

// ⚠️ `check-digit-mismatch` faltava aqui, e a falta era invisível: a lacuna era DESCARTADA em silêncio
// pelo `mapGaps`, e a linha chegava à tela bloqueada e sem motivo. O operador lia "sem dados bancários"
// olhando para um cadastro completo — que é exatamente o mal-entendido que o core-api criou este motivo
// para desfazer (`payout/types.ts:37-39`).
const GAP_REASONS: ReadonlySet<string> = new Set<PayoutGapReason>([
  'missing',
  'unmappable',
  'malformed',
  'check-digit-mismatch',
])

// Drift → `blocked` (o default seguro: aparece na tela como "não sai", nunca como apto).
const mapStatus = (raw: string): PreviewLineStatus =>
  LINE_STATUSES.has(raw) ? (raw as PreviewLineStatus) : 'blocked'

const mapRoute = (raw: string | null): VanRoute | null =>
  raw !== null && VAN_ROUTES.has(raw) ? (raw as VanRoute) : null

// Lacuna com campo OU motivo desconhecido é descartada: a tela aponta um input, e não há input para
// apontar. O `status` da linha já carrega o "não sai" — perder o detalhe é melhor que renderizar vazio.
const mapGaps = (raw: readonly Readonly<{ field: string; reason: string }>[]): readonly PayoutGap[] => {
  const gaps: PayoutGap[] = []
  for (const g of raw) {
    if (!PAYOUT_FIELDS.has(g.field) || !GAP_REASONS.has(g.reason)) continue
    gaps.push({ field: g.field as PayoutField, reason: g.reason as PayoutGapReason })
  }
  return gaps
}

export const previewToModel = (raw: unknown): Result<RemittancePreview, FinancialError> => {
  const parsed = CoreApiRemittancePreviewSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const p = parsed.data

  const lines: readonly RemittancePreviewLine[] = p.lines.map((l) => ({
    payableId: l.payableId,
    documentId: l.documentId,
    status: mapStatus(l.status),
    route: mapRoute(l.route),
    gaps: mapGaps(l.gaps),
    valueCents: l.valueCents,
  }))

  return ok({
    lines,
    readyCount: p.readyCount,
    blockedCount: p.blockedCount,
    outOfVanCount: p.outOfVanCount,
    notFoundCount: p.notFoundCount,
    notApprovedCount: p.notApprovedCount,
    readyTotalCents: p.readyTotalCents,
    blockedTotalCents: p.blockedTotalCents,
  })
}

export const generatedToModel = (raw: unknown): Result<GeneratedRemittance, FinancialError> => {
  const parsed = CoreApiGeneratedRemittanceSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok(parsed.data)
}
