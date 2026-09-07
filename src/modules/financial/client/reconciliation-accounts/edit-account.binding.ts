/**
 * useEditAccount — editar conta-cedente (PATCH /cedente-accounts/:id). Form PRÉ-PREENCHIDO a partir da conta
 * (`open(account)`), com o subconjunto editável: banco, tipo(+identificação), agência, conta-DV, apelido.
 * CNPJ e saldo de abertura são IMUTÁVEIS (não aparecem). Sucesso → invalida o grid e fecha. Espelha
 * `useAddAccount`, mas via `editAccount` (PATCH) e sem os campos imutáveis.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import { maskMoneyBRL, reaisToCents } from '#modules/financial/client/data/money.ts'
import type {
  AccountType,
  EditCedenteAccountInput,
  ReconciliationAccount,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
import {
  CONVENIO_MAX_DIGITS,
  OTHER_BANK_CODE,
  AGENCY_TOTAL_DIGITS,
  agencyBase,
  agencyDigits,
  agencyDv,
  agencyFromParts,
  maskDateInput,
  dateInputToIso,
  isoToDateInput,
} from './reconciliation-accounts.view-model.ts'

export type EditAccountBinding = Readonly<{
  /** Conta em edição (modal aberto) — null quando fechado. */
  target: ReconciliationAccount | null
  bankCode: string
  customBankName: string
  needsBankName: boolean
  type: AccountType
  typeLabel: string
  needsTypeLabel: boolean
  /**
   * Agência em DÍGITOS CRUS, `0000` + DV — 5 no total, exibida mascarada (`0000-0`). Mesma régua do
   * cadastro (specs/107): o DV é OBRIGATÓRIO também aqui, senão a edição vira a porta dos fundos por
   * onde uma conta volta a ficar sem dígito.
   */
  agency: string
  /**
   * Há agência digitada, ainda sem o DV. ⚠️ Nasce `true` ao abrir uma conta ANTIGA: elas foram salvas
   * antes desta regra e têm só os 4 dígitos, então o modal já abre cobrando o que falta. É o efeito
   * pretendido — é assim que o cadastro velho se completa.
   */
  agencyIncomplete: boolean
  account: string // "número-DV" combinado
  nickname: string
  /** #722: convênio em edição. Vazio quando a conta ainda não tem. */
  convenio: string
  /**
   * Campo somente-leitura: a conta ATIVA já tem convênio. Trocar é recusado pelo core-api
   * (`cedente-convenio-already-set`), porque o convênio viaja no nome de toda remessa transmitida —
   * então o front nem tenta, e mostra o motivo em vez de deixar o operador descobrir pelo erro.
   *
   * ⚠️ Conta ENCERRADA destrava (core-api#995 B8.1): ali não há remessa nova a nomear, e é por este
   * campo que se desativa a numeração da linha morta (convênio VAZIO) para desfazer o conflito de NSA.
   */
  convenioLocked: boolean
  /**
   * Saldo de abertura, mascarado (`15.000,00`) — core-api#999. Deixou de ser imutável.
   *
   * ⚠️ Editar o par entra na trava do DADO BANCÁRIO (FR-008): conta com extrato importado recusa com
   * `cedente-account-bank-data-locked`, porque o saldo de abertura é a premissa de todo saldo
   * calculado depois. Por isso o submit só o envia quando o operador de fato mexeu.
   */
  openingBalance: string
  /** Data do saldo, `DD/MM/AAAA` — convertida para ISO no submit. Par coeso com o saldo (FR-006). */
  openingBalanceDate: string
  setOpeningBalance: (v: string) => void
  setOpeningBalanceDate: (v: string) => void
  canSubmit: boolean
  saving: boolean
  errorTag: string | null
  setBank: (code: string) => void
  setCustomBankName: (v: string) => void
  setType: (t: AccountType) => void
  setTypeLabel: (v: string) => void
  setAgency: (v: string) => void
  setAccount: (v: string) => void
  setNickname: (v: string) => void
  setConvenio: (v: string) => void
  open: (account: ReconciliationAccount) => void
  cancel: () => void
  submit: () => void
}>

export function useEditAccount(
  bankNameOf: (code: string) => string | undefined,
  onSaved: () => void,
): EditAccountBinding {
  const qc = useQueryClient()
  const [target, setTarget] = useState<ReconciliationAccount | null>(null)
  const [bankCode, setBankCode] = useState('')
  const [customBankName, setCustomBankName] = useState('')
  const [type, setType] = useState<AccountType>('Corrente')
  const [typeLabel, setTypeLabel] = useState('')
  const [agency, setAgency] = useState('')
  const [account, setAccount] = useState('')
  const [nickname, setNickname] = useState('')
  const [convenio, setConvenio] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [openingBalanceDate, setOpeningBalanceDate] = useState('')
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: (input: EditCedenteAccountInput) => reconciliationRepository.editAccount(input),
    onSuccess: (res) => {
      if (res.ok) {
        setErrorTag(null)
        setTarget(null)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'accounts'] })
        onSaved()
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  const needsBankName = bankCode === OTHER_BANK_CODE
  const needsTypeLabel = type === 'Cartao' || type === 'Outro'
  // Travado pelo que veio do BACKEND, não pelo estado do input: o que decide é a conta já ter
  // convênio, e não o operador ter digitado algo nesta sessão.
  //
  // ⚠️ A TRAVA VALE SÓ EM CONTA ATIVA (core-api#995 B8.1/B8.3), e a razão é a mesma que a criou. O #722
  // travou a troca porque o convênio viaja no NOME de toda remessa transmitida: reescrevê-lo faria as
  // remessas antigas apontarem para um contrato que a conta não declara mais.
  //
  // Em conta ENCERRADA não há remessa nova a nomear, e travar o campo ali não protege nada — só força
  // `UPDATE` direto no banco de produção, que foi o que aconteceu em 06/09/2026. É por aqui que o
  // operador desativa a numeração da linha morta (convênio VAZIO) e desfaz o conflito de NSA com a
  // conta irmã, sem depender de ninguém.
  //
  // As duas pontas mudaram juntas: destravar só na tela produziria um Salvar que volta 409.
  const convenioLocked = (target?.convenio ?? '') !== '' && target?.status !== 'Closed'
  // Mesma régua do cadastro (specs/107): agência só está completa com o DV.
  const agencyComplete = agency.length === AGENCY_TOTAL_DIGITS
  const agencyIncomplete = agency.length > 0 && !agencyComplete

  const canSubmit =
    bankCode.trim() !== '' &&
    agencyComplete &&
    account.trim() !== '' &&
    (!needsBankName || customBankName.trim() !== '') &&
    (!needsTypeLabel || typeLabel.trim() !== '')

  return {
    target,
    agencyIncomplete,
    bankCode,
    customBankName,
    needsBankName,
    type,
    typeLabel,
    needsTypeLabel,
    agency,
    account,
    nickname,
    convenio,
    convenioLocked,
    openingBalance,
    openingBalanceDate,
    canSubmit,
    saving: mut.isPending,
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
    // Guarda o CRU (só dígitos, no máximo 5); a máscara é apresentação e fica na view.
    setAgency: (v) => {
      setAgency(agencyDigits(v))
    },
    setAccount: (v) => {
      setAccount(v)
    },
    setNickname: (v) => {
      setNickname(v)
    },
    // Só dígitos e teto de 6 (ver CONVENIO_MAX_DIGITS). Ignora a digitação quando travado — o input
    // já sai `readOnly`, isto é a segunda barreira, para o caso de a trava visual falhar.
    setOpeningBalance: (v) => {
      setOpeningBalance(maskMoneyBRL(v))
    },
    setOpeningBalanceDate: (v) => {
      setOpeningBalanceDate(maskDateInput(v))
    },
    setConvenio: (v) => {
      if (convenioLocked) return
      setConvenio(v.replace(/\D/g, '').slice(0, CONVENIO_MAX_DIGITS))
    },
    open: (a) => {
      setTarget(a)
      setBankCode(a.bankCode)
      setCustomBankName(a.bankName)
      setType(a.type)
      setTypeLabel(a.typeLabel ?? '')
      // O CAMINHO DE VOLTA (core-api#856): a base vem de `branch` e o DV de `branchDv`, cada um da sua
      // fonte, e a tela os remonta como o operador os digitou.
      //
      // ⚠️ Sem esta linha lendo o DV, ligar só o ENVIO não consertaria nada: o dado seria gravado e a
      // edição continuaria reabrindo em vermelho, com o Salvar travado — o sintoma sobreviveria ao fix.
      // Conta gravada ANTES do campo existir volta com `branchDv: ''` e segue incompleta de propósito:
      // ela de fato não tem o dado. Ver `agencyIncomplete`.
      setAgency(agencyFromParts(a.branch, a.branchDv))
      setAccount(a.accountDv !== '' ? `${a.accountNumber}-${a.accountDv}` : a.accountNumber)
      setNickname(a.alias)
      setConvenio(a.convenio)
      // Pré-preenche com o que está gravado, para o operador CORRIGIR em vez de redigitar do zero — e
      // para o submit conseguir comparar e mandar só o que mudou (FR-008: mandar sem mudar já dispara
      // a trava do dado bancário).
      setOpeningBalance(maskMoneyBRL(a.openingBalanceCents ?? ''))
      setOpeningBalanceDate(isoToDateInput(a.openingBalanceDate))
      setErrorTag(null)
    },
    cancel: () => {
      if (mut.isPending) return
      setErrorTag(null)
      setTarget(null)
    },
    submit: () => {
      if (target === null || !canSubmit || mut.isPending) return

      // ── SALDO DE ABERTURA (core-api#999) ──────────────────────────────────────
      //
      // FR-006: saldo e data são um PAR. Um sem o outro volta `opening-balance-requires-date`, e
      // validar cedo dá mensagem clara em vez de um 4xx genérico. Mesma régua do cadastro.
      const balanceRaw = openingBalance.trim()
      const dateRaw = openingBalanceDate.trim()
      if ((balanceRaw !== '') !== (dateRaw !== '')) {
        setErrorTag('financial.recon.add.balancePair')
        return
      }

      let openingBalanceCents: string | undefined
      let openingBalanceDateIso: string | undefined
      if (balanceRaw !== '') {
        const r = reaisToCents(balanceRaw)
        if (!r.ok) {
          setErrorTag('financial.recon.add.invalidBalance')
          return
        }
        const iso = dateInputToIso(dateRaw)
        if (iso === null) {
          setErrorTag('financial.recon.add.invalidDate')
          return
        }
        openingBalanceCents = r.value
        openingBalanceDateIso = iso
      }

      // ⚠️ SÓ VIAJA SE MUDOU, e isto não é economia de bytes — é o que decide se o Salvar funciona.
      // O backend trata o saldo como DADO BANCÁRIO (FR-008) e checa por PRESENÇA: mandar o mesmo
      // valor de volta já dispara `cedente-account-bank-data-locked` em qualquer conta que tenha
      // extrato importado. Comparar contra o que veio do backend é o que mantém a edição de apelido
      // (e de qualquer outro campo) possível nessas contas.
      const balanceChanged =
        (openingBalanceCents ?? '') !== (target.openingBalanceCents ?? '') ||
        (openingBalanceDateIso ?? '') !== (target.openingBalanceDate ?? '')

      // "0012345-7" → número "0012345" + DV "7"; sem '-' → DV vazio.
      const acc = account.trim()
      const dash = acc.lastIndexOf('-')
      const accountNumber = dash > 0 ? acc.slice(0, dash) : acc
      const accountDigit = dash > 0 ? acc.slice(dash + 1, dash + 3) : ''
      const bankName = needsBankName ? customBankName.trim() : bankNameOf(bankCode)

      // ── O PATCH É UM DIFF, e isto é o que mantém a edição possível ────────────
      //
      // ⚠️ Antes o submit mandava `bankCode`, `agency`, `accountNumber`, `accountDigit` e `type`
      // SEMPRE, mudados ou não. O backend decide a trava FR-008 por PRESENÇA:
      //
      //     wantsBankDataChange = input.bankCode !== undefined || input.agency !== undefined || …
      //     if (wantsBankDataChange && hasActivity) → 'cedente-account-bank-data-locked'
      //
      // Então QUALQUER edição — só o apelido, só o convênio, só o DV — virava "alteração de dado
      // bancário" e era recusada em toda conta com remessa ou extrato. Medido no local em 06/09: a
      // conta "Demonstrativa PG" (9 remessas) recusava até o preenchimento do DV da agência.
      //
      // E o mais caro: isso ANULAVA uma carve-out deliberada do backend. Lá, preencher um DV vazio
      // NÃO é alterar dado bancário ("PREENCHER o que está vazio não é alterar dado bancário — TROCAR
      // um dígito já definido é"). A permissão existia e o front não a alcançava, porque mandava
      // `agency` junto.
      //
      // Mandar só o que mudou não é economia de bytes: é o que faz a régua do backend valer.
      const agencyPatch = agencyBase(agency)
      const agencyDigitPatch = agencyDv(agency)
      const targetAgency = agencyBase(agencyDigits(target.branch))
      const changed = {
        bankCode: bankCode !== target.bankCode,
        bankName: bankName !== undefined && bankName !== target.bankName,
        type: type !== target.type,
        typeLabel: typeLabel.trim() !== (target.typeLabel ?? ''),
        agency: agencyPatch !== targetAgency,
        agencyDigit: agencyDigitPatch !== target.branchDv,
        accountNumber: accountNumber !== target.accountNumber,
        accountDigit: accountDigit !== target.accountDv,
        nickname: nickname.trim() !== target.alias,
      }

      mut.mutate({
        id: target.id,
        ...(changed.bankCode ? { bankCode } : {}),
        ...(changed.bankName && bankName !== undefined ? { bankName } : {}),
        ...(changed.type ? { type } : {}),
        ...(changed.typeLabel && needsTypeLabel && typeLabel.trim() !== ''
          ? { typeLabel: typeLabel.trim() }
          : {}),
        // A agência PARTIDA em dois campos, como o header do CNAB a espera — base nas 053-057, DV na
        // 058. ⚠️ Nunca concatenar: ver a nota em `add-account.binding.ts` e specs/107.
        ...(changed.agency ? { agency: agencyPatch } : {}),
        // Preencher um DV vazio é o caminho que a #856 abriu e que a trava do backend deixa passar de
        // propósito. Só chega lá se `agency` NÃO viajar junto — ver o bloco acima.
        ...(changed.agencyDigit && agencyDigitPatch !== '' ? { agencyDigit: agencyDigitPatch } : {}),
        ...(changed.accountNumber ? { accountNumber } : {}),
        ...(changed.accountDigit ? { accountDigit } : {}),
        ...(changed.nickname && nickname.trim() !== '' ? { nickname: nickname.trim() } : {}),
        // Conta ATIVA (#722): só viaja quando ela AINDA não tinha convênio e o operador preencheu
        // agora. Reenviar o valor existente seria pedir a troca que o core-api recusa — e um 409 aqui
        // apareceria como falha de "salvar a conta", escondendo que nada estava errado.
        //
        // Conta ENCERRADA (core-api#995 B8.2): o campo é editável e o VAZIO é INTENÇÃO — é assim que se
        // desativa a numeração da linha morta e se desfaz o conflito de NSA com a conta irmã. Sem esta
        // condição, limpar o campo não sairia da tela: a régua antiga só enviava valor não-vazio, e o
        // operador veria "salvo" sem nada ter mudado.
        ...(!convenioLocked && (convenio.trim() !== '' || target.status === 'Closed')
          ? { convenio: convenio.trim() }
          : {}),
        // O par inteiro, ou nada. Ver `balanceChanged` acima para o porquê do "só se mudou".
        ...(balanceChanged && openingBalanceCents !== undefined && openingBalanceDateIso !== undefined
          ? { openingBalanceCents, openingBalanceDate: openingBalanceDateIso }
          : {}),
      })
    },
  }
}
