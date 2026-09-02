/**
 * View-model do grid de contas-cedente (TELA 1) — derivação PURA (§XI; sem React). Mapeia
 * `ReconciliationAccount[]` → linhas da tela + filtros (busca/status), ordenação e consolidado. Os dados
 * reais dependem de core-api#168; até lá o binding entrega `unavailable` (estado honesto, sem fabricar).
 * Espelha `contas-a-pagar.view-model.ts`.
 */
import {
  FEBRABAN_BANKS,
  FREQUENT_BANKS,
  bankNameByCode as sharedBankNameByCode,
  type BankOption,
} from '#shared/banking/febraban-banks.ts'
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

// Lista de bancos do seletor do form Nova Conta. Passou a vir da tabela FEBRABAN COMPLETA
// (`#shared/banking`, 471 instituições geradas da fonte do Bacen) — antes eram 12 bancos escolhidos à
// mão, o que obrigava a cair em "Outro" para qualquer instituição fora do topo do mercado.
// A sentinela `OUTRO` CONTINUA no fim da lista: conta de cartão corporativo / "Outro" pode simplesmente
// não ter instituição com código de compensação, e é ela que libera o campo de nome manual (#206).
export type { BankOption } from '#shared/banking/febraban-banks.ts'
// Sentinela p/ instituição não listada (#206): seleciona "Outro" e digita o nome (vira `bankName`).
/**
 * Teto do convênio: **6 dígitos**.
 *
 * ⚠️ NÃO é o `max(20)` do schema do core-api. O campo do header CNAB tem 6 posições (033-038, com
 * 039-052 em branco), e o Validador do Bradesco recusa o arquivo quando o convênio invade 039. Pior:
 * o banco LÊ só as 6 primeiras e descarta o resto em silêncio — medido num arquivo real, um convênio
 * `99999999` apareceu no laudo como `Contrato: 999999`.
 *
 * Barrar aqui importa porque o convênio é preenchível UMA VEZ: salvo com 8 dígitos, o campo trava e a
 * conta fica permanentemente incapaz de gerar remessa, sem caminho na tela para corrigir. O erro
 * apareceria só na hora de pagar, como `remittance-build-failed` — que não diz onde está o problema.
 *
 * Correção do emissor pedida em core-api#804 (CA2: recusar, nunca truncar).
 */
export const CONVENIO_MAX_DIGITS = 6

/**
 * Agência da conta-cedente: 4 dígitos + DV, `0000-0` — 5 dígitos crus (decisão da P.O., 25/08).
 *
 * O DV é OBRIGATÓRIO no cadastro, e a razão é a assimetria com o FAVORECIDO: para o favorecido o DV da
 * agência é opcional (o layout Multipag, campo G009, diz "Campo Não Obrigatório", e exigi-lo recusaria
 * pagamento por algo que o banco dispensa — decisão (a) da P.O. na core-api#708). Esta conta, porém, é a
 * NOSSA: o dado está à mão de quem cadastra, e é ele que vai ao header de todo arquivo. Deixar entrar sem
 * DV é criar um cadastro incompleto cujo defeito só aparece na hora de pagar.
 *
 * ⚠️ Assume agência de 4 dígitos, que é o desenho da máscara `agency` compartilhada
 * (`shared/ui/atoms/input/input.mask.ts`) e já vale para fornecedor/financiador/colaborador. O CNAB
 * reserva 5 posições para a agência (053-057), então uma agência de 5 dígitos SEM DV seria lida aqui como
 * 4+DV. Nenhum dos bancos do catálogo usa 5, e unificar a régua vale mais que cobrir o caso hipotético.
 */
export const AGENCY_TOTAL_DIGITS = 5
const AGENCY_BASE_DIGITS = 4

/**
 * O que o campo de agência guarda: só dígitos, no máximo 5.
 *
 * Vive aqui e não no binding porque o binding é adapter do núcleo e **não pode importar o design
 * system** (`boundaries`: `client-binding` alcança `shared`, nunca `shared-ui`) — então o `unmask` da
 * máscara está fora do seu alcance, e com razão. A MÁSCARA (apresentação) continua sendo a do DS,
 * aplicada na view; o que mora aqui é a regra do dado.
 */
export const agencyDigits = (value: string): string => value.replace(/\D/g, '').slice(0, AGENCY_TOTAL_DIGITS)

/** Os 4 dígitos da agência, sem o DV — o que o core-api guarda hoje. Ver a ressalva no submit. */
export const agencyBase = (rawDigits: string): string => rawDigits.slice(0, AGENCY_BASE_DIGITS)

export const OTHER_BANK_CODE = 'OUTRO'
export const OTHER_BANK_NAME = 'Outro'

/** Os 12 que já eram a lista curada — hoje o grupo "Mais usados" no topo do seletor. */
export const FREQUENT_BANK_OPTIONS: readonly BankOption[] = FREQUENT_BANKS

/** A tabela completa, sem a sentinela: é ela que a UI renderiza no grupo "Todos os bancos". */
export const BANK_OPTIONS: readonly BankOption[] = FEBRABAN_BANKS

export const BANKS: readonly BankOption[] = [
  ...FEBRABAN_BANKS,
  { code: OTHER_BANK_CODE, name: OTHER_BANK_NAME }, // #206: instituição não listada → nome manual
]

/**
 * Nome pelo código. A sentinela `OUTRO` é tratada aqui e não pela tabela porque ela não é um banco —
 * é a ausência de um. Contas já cadastradas com os 12 códigos antigos continuam resolvendo: todos os
 * 12 existem na tabela completa (o gerador falha se algum sumir da fonte).
 */
export const bankNameByCode = (code: string): string | undefined =>
  code === OTHER_BANK_CODE ? OTHER_BANK_NAME : sharedBankNameByCode(code)

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
  /** #722: convênio; `''` quando ausente. */
  convenio: string
  /**
   * A conta NÃO gera remessa (sem convênio). Derivado aqui e não na view: é regra de negócio, e a
   * view só desenha. Conta encerrada não recebe o aviso — ela não vai pagar nada de qualquer forma,
   * e alertar sobre remessa nela seria ruído.
   */
  missingConvenio: boolean
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
    convenio: a.convenio,
    missingConvenio: a.convenio.trim() === '' && a.status !== 'Closed',
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
