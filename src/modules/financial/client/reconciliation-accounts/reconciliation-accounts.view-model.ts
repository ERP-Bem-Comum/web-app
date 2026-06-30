/**
 * View-model do grid de contas-cedente (TELA 1) — derivação PURA (§XI; sem React). Mapeia
 * `ReconciliationAccount[]` → linhas da tela + filtros (busca/status), ordenação e consolidado. Os dados
 * reais dependem de core-api#168; até lá o binding entrega `unavailable` (estado honesto, sem fabricar).
 * Espelha `contas-a-pagar.view-model.ts`.
 */
import { centsToBRL } from '#modules/financial/client/data/money.ts'
import type {
  AccountType,
  ReconciliationAccount,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

// Tipo da conta → tag i18n (a view traduz; view-model fica i18n-agnóstica). typeLabel livre (#206) p/ Cartão/Outro.
const ACCOUNT_TYPE_TAG: Readonly<Record<AccountType, string>> = {
  Corrente: 'financial.recon.add.type.corrente',
  Poupanca: 'financial.recon.add.type.poupanca',
  Investimento: 'financial.recon.add.type.investimento',
  Cartao: 'financial.recon.add.type.cartao',
  Outro: 'financial.recon.add.type.outro',
}

export { centsToBRL } from '#modules/financial/client/data/money.ts'
export type {
  ReconciliationAccount,
  AccountType,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

export type AccountStatusKind = 'pending' | 'up-to-date' | 'closed'
export type StatusFilter = 'todas' | 'pendentes' | 'em-dia' | 'encerradas'
export type SortKey = 'pendencias' | 'saldo' | 'nome' | 'atualizacao'

// Lista estática dos principais bancos (FEBRABAN) para o seletor do form Nova Conta. Vocabulário de UI
// (não dado de negócio); o core-api aceita bankCode livre — esta lista só guia o comum.
export type BankOption = Readonly<{ code: string; name: string }>
// Sentinela p/ instituição não listada (#206): seleciona "Outro" e digita o nome (vira `bankName`).
export const OTHER_BANK_CODE = 'OUTRO'
export const BANKS: readonly BankOption[] = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa Econômica Federal' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú Unibanco' },
  { code: '260', name: 'Nubank' },
  { code: '077', name: 'Banco Inter' },
  { code: '336', name: 'C6 Bank' },
  { code: '748', name: 'Sicredi' },
  { code: '756', name: 'Sicoob' },
  { code: '212', name: 'Banco Original' },
  { code: '422', name: 'Banco Safra' },
  { code: OTHER_BANK_CODE, name: 'Outro' }, // #206: instituição não listada → nome manual
]
export const bankNameByCode = (code: string): string | undefined => BANKS.find((b) => b.code === code)?.name

export type AccountRow = Readonly<{
  id: string
  bankCode: string
  bankName: string
  alias: string
  branch: string
  accountNumber: string
  accountDv: string
  balanceBRL: string
  lastUpdatedAt: string
  pendingCount: number
  status: AccountStatusKind
  openable: boolean // encerrada não abre o workspace
  // Dados do cadastro (expand da linha): tipo, saldo inicial + data informados no cadastro ("—" se ausentes).
  typeTag: string // tag i18n do tipo da conta (a view traduz)
  typeLabel: string | null // #206: texto livre identificando a conta (Cartão corporativo/Outro); null caso contrário
  openingBalanceBRL: string
  openingDate: string
}>

/** Situação de conciliação da conta (encerrada > pendências > em dia). */
export const accountStatus = (a: ReconciliationAccount): AccountStatusKind => {
  if (a.status === 'Closed') return 'closed'
  return a.pendingCount > 0 ? 'pending' : 'up-to-date'
}

const DASH = '—'

/** ISO `YYYY-MM-DD` → "01/06/2026" (DD/MM/AAAA); null/vazio → "—". */
export const formatCadastroDate = (iso: string | null): string => {
  if (iso === null || iso === '') return DASH
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y !== undefined && m !== undefined && d !== undefined ? `${d}/${m}/${y}` : iso
}

/**
 * Última atualização → "20-10-2026" (DD-MM-AAAA); vazio → "—". A data nunca pode ser FUTURA (uma conta
 * não foi "atualizada" amanhã): se o último movimento for posterior a `today` (ISO YYYY-MM-DD), clampa em
 * hoje. `today` entra por parâmetro (view-model puro/testável; o `new Date()` fica no binding).
 */
export const formatUpdateDate = (iso: string, today: string): string => {
  if (iso === '') return DASH
  const day = iso.slice(0, 10)
  const eff = today !== '' && day > today ? today : day
  const [y, m, d] = eff.split('-')
  return y !== undefined && m !== undefined && d !== undefined ? `${d}-${m}-${y}` : eff
}

// ── Máscara/parse da DATA do saldo de abertura (input do modal de Nova Conta) ──────────────────────────
/** Máscara progressiva: dígitos → "DD/MM/AAAA" (idempotente; aceita cru ou já mascarado). */
export const maskDateInput = (v: string): string => {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** "DD/MM/AAAA" → ISO "AAAA-MM-DD". null se incompleto/inválido (dia/mês fora de faixa). */
export const dateInputToIso = (masked: string): string | null => {
  const d = masked.replace(/\D/g, '')
  if (d.length !== 8) return null
  const dd = d.slice(0, 2)
  const mm = d.slice(2, 4)
  const yyyy = d.slice(4)
  const day = Number.parseInt(dd, 10)
  const mon = Number.parseInt(mm, 10)
  if (mon < 1 || mon > 12 || day < 1 || day > 31) return null
  return `${yyyy}-${mm}-${dd}`
}

export const toAccountRow = (a: ReconciliationAccount, today = ''): AccountRow => {
  const status = accountStatus(a)
  return {
    id: a.id,
    bankCode: a.bankCode,
    bankName: a.bankName,
    alias: a.alias,
    branch: a.branch,
    accountNumber: a.accountNumber,
    accountDv: a.accountDv,
    balanceBRL: centsToBRL(a.currentBalanceCents),
    lastUpdatedAt: formatUpdateDate(a.lastUpdatedAt, today),
    pendingCount: a.pendingCount,
    status,
    openable: status !== 'closed',
    typeTag: ACCOUNT_TYPE_TAG[a.type],
    typeLabel: a.typeLabel,
    openingBalanceBRL: a.openingBalanceCents !== null ? centsToBRL(a.openingBalanceCents) : DASH,
    openingDate: formatCadastroDate(a.openingBalanceDate),
  }
}

const matchesSearch = (a: ReconciliationAccount, q: string): boolean => {
  const needle = q.trim().toLowerCase()
  if (needle === '') return true
  return [a.bankName, a.bankCode, a.branch, a.accountNumber, a.alias].join(' ').toLowerCase().includes(needle)
}

const matchesStatus = (a: ReconciliationAccount, filter: StatusFilter): boolean => {
  switch (filter) {
    case 'todas':
      return true
    case 'pendentes':
      return accountStatus(a) === 'pending'
    case 'em-dia':
      return accountStatus(a) === 'up-to-date'
    case 'encerradas':
      return accountStatus(a) === 'closed'
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

const parseCents = (s: string): number => {
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : 0
}

const compareBy =
  (key: SortKey) =>
  (a: ReconciliationAccount, b: ReconciliationAccount): number => {
    switch (key) {
      case 'pendencias':
        return b.pendingCount - a.pendingCount
      case 'saldo':
        return parseCents(b.currentBalanceCents) - parseCents(a.currentBalanceCents)
      case 'nome':
        return a.alias.localeCompare(b.alias, 'pt-BR')
      case 'atualizacao':
        return b.lastUpdatedAt.localeCompare(a.lastUpdatedAt)
      default: {
        const _exhaustive: never = key
        return _exhaustive
      }
    }
  }

/** Aplica busca + filtro de status + ordenação e mapeia para linhas. */
export const deriveAccountRows = (
  accounts: readonly ReconciliationAccount[],
  opts: Readonly<{ search: string; status: StatusFilter; sort: SortKey; today?: string }>,
): readonly AccountRow[] =>
  accounts
    .filter((a) => matchesSearch(a, opts.search) && matchesStatus(a, opts.status))
    .slice()
    .sort(compareBy(opts.sort))
    .map((a) => toAccountRow(a, opts.today ?? ''))

export type Consolidated = Readonly<{ balanceBRL: string; accountsCount: number; pendingTotal: number }>

/** Saldo consolidado + nº de contas + total de pendências (sobre o conjunto filtrado). */
export const consolidate = (accounts: readonly ReconciliationAccount[]): Consolidated => ({
  balanceBRL: centsToBRL(accounts.reduce((acc, a) => acc + parseCents(a.currentBalanceCents), 0)),
  accountsCount: accounts.length,
  pendingTotal: accounts.reduce((acc, a) => acc + a.pendingCount, 0),
})

export type AccountsState =
  | Readonly<{ tag: 'loading' }>
  | Readonly<{ tag: 'unavailable' }> // #168: sem endpoint — chrome honesto
  | Readonly<{ tag: 'error'; errorTag: string }>
  | Readonly<{ tag: 'empty' }>
  | Readonly<{ tag: 'ready'; rows: readonly AccountRow[]; consolidated: Consolidated }>
