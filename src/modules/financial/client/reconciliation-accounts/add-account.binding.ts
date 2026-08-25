/**
 * useAddAccount — controller do form "Nova Conta Bancária" (#138, POST /cedente-accounts). UI-state do
 * formulário + validação + submit via `reconciliationRepository.createAccount`. Sucesso → invalida o grid
 * (queryKey das contas) e fecha. Erros → tag i18n. `document` (CNPJ) é obrigatório (exigência do core-api).
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import { maskMoneyBRL, reaisToCents } from '#modules/financial/client/data/money.ts'
import { maskCnpj, unmaskCnpj } from '#shared/document/cnpj.ts'
import type {
  AccountType,
  CreateCedenteAccountInput,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
import {
  CONVENIO_MAX_DIGITS,
  OTHER_BANK_CODE,
  AGENCY_TOTAL_DIGITS,
  agencyBase,
  agencyDigits,
  maskDateInput,
  dateInputToIso,
} from './reconciliation-accounts.view-model.ts'

export type AddAccountBinding = Readonly<{
  bankCode: string
  customBankName: string // #206: instituição digitada quando banco = "Outro"
  needsBankName: boolean // true quando banco = "Outro" (a UI mostra o campo de instituição)
  type: AccountType
  typeLabel: string // #206: "Identificação da conta" exigida p/ Cartão corporativo/Outro
  needsTypeLabel: boolean // true quando type = Cartao/Outro (a UI mostra o campo)
  /**
   * Agência em DÍGITOS CRUS, `0000` + DV — 5 no total. A tela exibe mascarado (`0000-0`); aqui fica o cru,
   * como nos demais formulários que usam a máscara `agency` (fornecedor, financiador, colaborador).
   *
   * ⚠️ O DV é OBRIGATÓRIO (decisão da P.O., 25/08): conta cadastrada sem ele é um cadastro incompleto que
   * só aparece na hora de pagar. Ver `agencyIncomplete` e a ressalva do submit sobre onde o DV (não) é
   * guardado.
   */
  agency: string
  /**
   * Há agência digitada, mas ainda sem o DV. É estado de PENDÊNCIA, não de erro: enquanto o operador
   * digita `1`, `14`, `148`… o campo está a caminho, e acusá-lo a cada tecla seria ruído. A tela usa isto
   * para explicar por que o botão não libera.
   */
  agencyIncomplete: boolean
  account: string // "número-DV" combinado (ex.: 0012345-7); separado em accountNumber/accountDigit no submit
  document: string
  nickname: string
  openingBalance: string
  openingBalanceDate: string
  /** #722: convênio junto ao banco. OPCIONAL aqui — sem ele a conta concilia, mas não gera remessa. */
  convenio: string
  canSubmit: boolean
  submitting: boolean
  errorTag: string | null
  setBank: (code: string) => void
  setCustomBankName: (v: string) => void
  setType: (t: AccountType) => void
  setTypeLabel: (v: string) => void
  setAgency: (v: string) => void
  setAccount: (v: string) => void
  setDocument: (v: string) => void
  setNickname: (v: string) => void
  setOpeningBalance: (v: string) => void
  setOpeningBalanceDate: (v: string) => void
  setConvenio: (v: string) => void
  reset: () => void
  submit: () => void
}>

export function useAddAccount(
  bankNameOf: (code: string) => string | undefined,
  /**
   * CNPJ do CEDENTE já cadastrado nas outras contas. É sempre o mesmo — a conta pertence à
   * organização, não à instituição financeira —, então repetir a digitação a cada conta nova só cria
   * oportunidade de errar um dígito que vai parar no header do arquivo CNAB (019-032).
   *
   * Vem de conta existente porque não há entidade "organização" no core-api de onde puxá-lo. Vazio na
   * PRIMEIRA conta: aí não há o que herdar, e o operador digita.
   */
  defaultDocument: string,
  onCreated: () => void,
): AddAccountBinding {
  const qc = useQueryClient()
  const [bankCode, setBankCode] = useState('')
  const [customBankName, setCustomBankName] = useState('')
  const [type, setType] = useState<AccountType>('Corrente')
  const [typeLabel, setTypeLabel] = useState('')
  const [agency, setAgency] = useState('')
  const [account, setAccount] = useState('')
  const [document, setDocument] = useState('')
  // Enquanto o operador não tocar no campo, vale o CNPJ herdado. Depois de tocado vale o que ele
  // digitou — inclusive vazio: um pré-preenchido que se recusa a sair vira armadilha, não ajuda.
  const [documentTouched, setDocumentTouched] = useState(false)
  const [nickname, setNickname] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [openingBalanceDate, setOpeningBalanceDate] = useState('')
  const [convenio, setConvenio] = useState('')
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const reset = () => {
    setBankCode('')
    setCustomBankName('')
    setType('Corrente')
    setTypeLabel('')
    setAgency('')
    setAccount('')
    setDocument('')
    setDocumentTouched(false)
    setNickname('')
    setOpeningBalance('')
    setOpeningBalanceDate('')
    setConvenio('')
    setErrorTag(null)
  }

  const mut = useMutation({
    mutationFn: (input: CreateCedenteAccountInput) => reconciliationRepository.createAccount(input),
    onSuccess: (res) => {
      if (res.ok) {
        setErrorTag(null)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'accounts'] })
        reset()
        onCreated()
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  // #206: banco "Outro" pede o nome da instituição; tipo Cartão corporativo/Outro pede a identificação da conta.
  const effectiveDocument = documentTouched ? document : maskCnpj(defaultDocument)

  const needsBankName = bankCode === OTHER_BANK_CODE
  const needsTypeLabel = type === 'Cartao' || type === 'Outro'
  // Agência só está completa com o DV — 4 dígitos + 1. `agencyIncomplete` distingue "ainda digitando"
  // de "vazio": campo em branco não é pendência, é o estado inicial.
  const agencyComplete = agency.length === AGENCY_TOTAL_DIGITS
  const agencyIncomplete = agency.length > 0 && !agencyComplete

  const canSubmit =
    bankCode.trim() !== '' &&
    agencyComplete &&
    account.trim() !== '' &&
    effectiveDocument.trim() !== '' &&
    (!needsBankName || customBankName.trim() !== '') &&
    (!needsTypeLabel || typeLabel.trim() !== '')

  return {
    bankCode,
    customBankName,
    needsBankName,
    type,
    typeLabel,
    needsTypeLabel,
    agency,
    agencyIncomplete,
    account,
    document: effectiveDocument,
    nickname,
    openingBalance,
    openingBalanceDate,
    convenio,
    canSubmit,
    submitting: mut.isPending,
    errorTag,
    setBank: (code) => {
      setBankCode(code)
    },
    setCustomBankName: (v) => {
      setCustomBankName(v)
    },
    setType: (t) => {
      setType(t)
    },
    setTypeLabel: (v) => {
      setTypeLabel(v)
    },
    // Guarda o CRU (só dígitos, no máximo 5) — a máscara é apresentação e fica na view. A extração
    // mora no view-model porque o binding não alcança o design system (`boundaries`).
    setAgency: (v) => {
      setAgency(agencyDigits(v))
    },
    setAccount: (v) => {
      setAccount(v)
    },
    setDocument: (v) => {
      setDocumentTouched(true)
      setDocument(maskCnpj(v)) // máscara CNPJ ao digitar (cru vai ao backend no submit via unmaskCnpj)
    },
    setNickname: (v) => {
      setNickname(v)
    },
    setOpeningBalance: (v) => {
      setOpeningBalance(maskMoneyBRL(v))
    },
    setOpeningBalanceDate: (v) => {
      setOpeningBalanceDate(maskDateInput(v)) // máscara DD/MM/AAAA (convertida p/ ISO no submit)
    },
    // Só dígitos e teto de 6 — ver CONVENIO_MAX_DIGITS.
    setConvenio: (v) => {
      setConvenio(v.replace(/\D/g, '').slice(0, CONVENIO_MAX_DIGITS))
    },
    reset,
    submit: () => {
      if (!canSubmit) return
      // Saldo de abertura: o backend exige saldo E data juntos (ou ambos vazios) — valida cedo c/ msg clara.
      const hasBalance = openingBalance.trim() !== ''
      const hasDate = openingBalanceDate.trim() !== ''
      if (hasBalance !== hasDate) {
        setErrorTag('financial.recon.add.balancePair')
        return
      }
      const balance = openingBalance.trim()
      let openingBalanceCents: string | undefined
      if (balance !== '') {
        const r = reaisToCents(balance)
        if (!r.ok) {
          setErrorTag('financial.recon.add.invalidBalance')
          return
        }
        openingBalanceCents = r.value
      }
      // Data do saldo: "DD/MM/AAAA" → ISO "AAAA-MM-DD" (o backend exige z.iso.date). Vazia → undefined.
      let isoDate: string | undefined
      const dateStr = openingBalanceDate.trim()
      if (dateStr !== '') {
        const iso = dateInputToIso(dateStr)
        if (iso === null) {
          setErrorTag('financial.recon.add.invalidDate')
          return
        }
        isoDate = iso
      }
      // "0012345-7" → número "0012345" + DV "7"; sem '-' → DV vazio.
      const acc = account.trim()
      const dash = acc.lastIndexOf('-')
      const accountNumber = dash > 0 ? acc.slice(0, dash) : acc
      const accountDigit = dash > 0 ? acc.slice(dash + 1, dash + 3) : ''
      // #206: banco "Outro" → o nome vem do campo livre; senão, do catálogo.
      const bankName = needsBankName ? customBankName.trim() : bankNameOf(bankCode)
      mut.mutate({
        bankCode,
        bankName,
        type,
        ...(needsTypeLabel && typeLabel.trim() !== '' ? { typeLabel: typeLabel.trim() } : {}), // #206
        // ⚠️ Vai só a BASE (4 dígitos) — o DV é exigido na tela mas NÃO É GUARDADO, e isto é intencional
        // até o core-api ter onde. Hoje não há: `fin_cedente_accounts` tem `account_digit` e nenhum
        // `agency_digit`, e `createCedenteAccountBodySchema` só conhece `agency`.
        //
        // Concatenar (`1487-2`) seria pior que perder: o CNAB trata o campo como POSICIONAL —
        // `digits(c.agency, 5)` remove o hífen e escreveria `14872` nas posições 053-057, onde o banco
        // espera `01487`, enquanto a 058 (DV) segue em branco porque `generate-remittance.ts` fixa
        // `agencyDigit: ''`. Todo arquivo daquela conta sairia com o header errado, em silêncio.
        //
        // Ligar o envio é UMA LINHA quando o campo existir. Ver a issue do core-api referida na spec.
        agency: agencyBase(agency),
        accountNumber,
        accountDigit,
        // #722: só viaja se preenchido. Vazio NÃO é enviado — a conta nasce sem convênio e pode
        // ganhá-lo depois pela edição; mandar `''` seria afirmar um valor que o operador não deu.
        ...(convenio.trim() !== '' ? { convenio: convenio.trim() } : {}),
        document: unmaskCnpj(effectiveDocument.trim()), // CNPJ cru — a UI guarda mascarado
        nickname: nickname.trim() === '' ? undefined : nickname.trim(),
        openingBalanceCents,
        openingBalanceDate: isoDate,
      })
    },
  }
}
