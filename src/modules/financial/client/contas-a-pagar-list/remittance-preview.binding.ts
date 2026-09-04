/**
 * Binding do PRÉ-VOO da remessa (VAN, core-api#728) — ADAPTER React (o único lugar do núcleo que conhece
 * React/Query, ADR-0009). Orquestra: seleção → server fn → ViewModel puro.
 *
 * É `useMutation`, não `useQuery`, e a razão não é o verbo HTTP: o pré-voo roda quando o operador PEDE
 * (abrir a conferência), não quando a tela monta. Um `useQuery` re-buscaria sozinho a cada foco/reconexão
 * com a seleção de antes — e conferência que muda sozinha debaixo do olho de quem confere é pior que
 * nenhuma. Nada é invalidado no cache: leitura pura não mexe em título nem em remessa.
 *
 * ⚠️ ORDEM (core-api#804): o pré-voo passou a exigir a CONTA-CEDENTE. Antes ele disparava no `start`, com
 * a conta ainda por escolher — agora `start` só guarda a seleção e abre o modal, e a conferência roda
 * quando a conta é conhecida. Não é capricho de contrato: a repartição em lotes se decide comparando o
 * banco do favorecido com o do cedente, então "o que vai sair" só tem resposta depois de saber quem paga.
 * Trocar a conta RE-roda o pré-voo, porque a resposta muda com ela.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { financialErrorTag } from '#modules/financial/client/data/helpers/financial-error-tag.ts'
import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import type {
  RemittancePreview,
  GeneratedRemittance,
} from '#modules/financial/client/data/model/remittance.model.ts'
import type { ReconciliationAccount } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { accountLabel } from './remittance-preview.view-model.ts'
import type { SentRemittance } from './remittance-preview.view-model.ts'

export type RemittancePreviewBinding = Readonly<{
  open: boolean
  running: boolean
  preview: RemittancePreview | null
  errorTag: string | null
  /**
   * Títulos que o operador DESMARCOU. Guardamos a exceção, não a seleção: o padrão é "vai tudo o que
   * pode ir", e um conjunto de exceções não precisa ser re-semeado quando o pré-voo volta.
   */
  unchecked: ReadonlySet<string>
  toggle: (payableId: string) => void
  /**
   * Abre a conferência com os TÍTULOS informados. NÃO dispara o pré-voo: ele roda quando a conta-cedente
   * for conhecida (escolhida ou auto-selecionada) — ver o cabeçalho.
   *
   * `notApprovedCount` entra como ARGUMENTO pelo mesmo motivo que `paymentDate` entra no `generate`: é
   * uma leitura do grid VÁLIDA NO INSTANTE DA ABERTURA, e o grid muda debaixo do modal. Ver o campo.
   */
  start: (payableIds: readonly string[], notApprovedCount: number) => void
  /**
   * Quantos títulos SELECIONADOS ficaram de fora por não estarem Aprovados, **congelado na abertura**.
   *
   * ⚠️ Era derivado ao vivo das linhas do grid (`r.status !== 'Aprovado'`), e isso o tornava mentiroso
   * exatamente quando ele era lido: gerada a remessa, o `onSuccess` invalida as listas, os títulos que
   * ACABARAM de entrar viram `Transmitido` e passam a contar como "não aprovado" — a tela acusava de ter
   * ficado de fora justamente o que entrou. O comprovante e este aviso descrevem o MESMO instante, então
   * os dois se congelam juntos (ver `sent`).
   */
  notApprovedCount: number
  close: () => void
  /**
   * O modal está aberto esperando a conta para poder conferir. É estado de ESPERA, não de erro: a tela
   * pede a conta em vez de mostrar uma conferência vazia ou um "carregando" que nunca termina.
   */
  awaitingAccount: boolean
  /**
   * Hoje em ISO LOCAL (YYYY-MM-DD), para o ViewModel decidir se a data de pagamento já passou.
   *
   * Lido a cada render, de propósito, e não congelado em `useState`: numa aba aberta desde ontem um
   * "hoje" congelado aprovaria uma remessa com data de ontem — que é exatamente o caso que a regra
   * existe para barrar. O valor só muda uma vez por dia, então recalcular não custa nada.
   */
  today: string

  // ── Geração (S3) — ⚠️ enfileira pagamento no banco ────────────────────────────
  /** Contas-cedente elegíveis a pagar. Vazio enquanto carrega ou se a listagem falhar. */
  accounts: readonly ReconciliationAccount[]
  cedenteAccountId: string
  setCedenteAccountId: (id: string) => void
  /** Confirmação armada: o clique em "Gerar" pede um segundo passo antes de mover dinheiro. */
  confirming: boolean
  arm: () => void
  disarm: () => void
  generating: boolean
  /** Comprovante do que foi gerado. Enquanto existe, o modal mostra o resultado, não a conferência. */
  generated: GeneratedRemittance | null
  /**
   * O que foi ENVIADO, congelado no clique. Existe porque a tela muda embaixo do comprovante: o
   * `onSuccess` invalida as listas, os títulos viram `Transmitido` (core-api#792) e saem da seleção —
   * então qualquer número relido do pré-voo depois do envio descreve o estado NOVO, não o que foi
   * enviado. `null` antes de gerar.
   */
  sent: SentRemittance | null
  /** Tag i18n da falha (comportamento) — §V. */
  generateErrorTag: string | null
  /** Mensagem PT-BR do core-api (texto). É ela que distingue as quatro recusas que chegam como 422. */
  generateErrorMessage: string | null
  /**
   * `paymentDate` entra como ARGUMENTO, e não é redundância: é o valor lido do pré-voo no instante em
   * que o operador confirma. Depois do envio esse valor já não existe na tela — ver `sent`.
   */
  generate: (payableIds: readonly string[], paymentDate: string) => void

  // ── Download do arquivo (specs/103) ───────────────────────────────────────────
  //
  // Oferecido em TODO ambiente (decisão da P.O., 21/08 — produção também vai baixar). ⚠️ Enquanto o
  // core-api registrar a rota só fora de produção, lá o clique volta 404 sem mensagem, e é a UI que diz
  // que o ambiente ainda não serve o arquivo. Não escondemos o botão: esconder por conta própria seria
  // impor uma política que a P.O. já decidiu não ter.
  downloading: boolean
  /** Tag i18n da falha (comportamento) — §V. */
  downloadErrorTag: string | null
  /** Mensagem PT-BR do core-api. `null` em produção, onde a rota nem existe (404 do Fastify). */
  downloadErrorMessage: string | null
  /** O objeto veio de `falhas/` — **o envio ao banco NÃO completou**. */
  downloadedFromFailures: boolean
  /** Baixa o arquivo da remessa que acabou de ser gerada. No-op sem comprovante na tela. */
  /** Baixa UM arquivo do lote (core-api#929) — o id identifica qual. */
  downloadFile: (remittanceId: string) => void
}>

// base64 (RPC) → Blob (browser). O tipo é `application/octet-stream` de propósito, o mesmo que o core-api
// serve: com `text/plain` o navegador poderia normalizar a quebra de linha ao salvar, e **CNAB com
// terminador trocado é arquivo recusado pelo banco**.
const CNAB_MIME = 'application/octet-stream'
const saveAs = (base64: string, fileName: string): void => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: CNAB_MIME }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// `falhas/` é o prefixo do agente para envio que NÃO completou (ADR-0060/0061 do core-api). Quem vai
// comparar bytes com o banco precisa saber disso ANTES de tratar o arquivo como o que foi pago.
const FAILURES_PREFIX = 'falhas/'

export function useRemittancePreview(): RemittancePreviewBinding {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(() => new Set())
  const [chosenAccountId, setChosenAccountId] = useState('')
  const [confirming, setConfirming] = useState(false)
  // Congelado no clique de gerar; zerado ao abrir e ao fechar, junto do comprovante que ele descreve.
  const [sent, setSent] = useState<SentRemittance | null>(null)
  // A seleção que veio do grid, guardada até haver conta com que conferi-la.
  const [pendingIds, setPendingIds] = useState<readonly string[]>([])
  // Congelado na abertura, pelo mesmo motivo que `sent`: o grid muda debaixo do modal. Ver o binding.
  const [notApprovedCount, setNotApprovedCount] = useState(0)

  // Contas-cedente: só busca com o modal aberto. Compartilha a queryKey do grid de contas (#168).
  const accountsQuery = useQuery({
    queryKey: ['financial', 'reconciliation', 'accounts'] as const,
    queryFn: () => reconciliationRepository.listAccounts(),
    staleTime: 60_000,
    enabled: open,
  })
  const accounts =
    accountsQuery.data?.ok === true ? accountsQuery.data.value.filter((a) => a.status !== 'Closed') : []

  /**
   * Conta efetiva: a escolhida ou, quando só UMA das contas pode gerar remessa, ela — sem convênio a
   * conta nem gera (#722), então oferecer uma escolha de um item só faria o operador clicar para
   * confirmar o óbvio antes de ver a conferência. Com duas ou mais, ninguém escolhe por ele: errar a
   * conta aqui é pagar pela conta errada.
   */
  const eligible = accounts.filter((a) => a.convenio !== '')
  const [soleEligible] = eligible
  const cedenteAccountId =
    chosenAccountId !== ''
      ? chosenAccountId
      : eligible.length === 1 && soleEligible !== undefined
        ? soleEligible.id
        : ''

  const previewMut = useMutation({
    mutationKey: ['financial', 'remittances', 'preview'] as const,
    mutationFn: (input: Readonly<{ cedenteAccountId: string; payableIds: readonly string[] }>) =>
      financialRepository.previewRemittance(input),
  })

  const { mutate, reset } = previewMut

  /**
   * Dispara a conferência quando (e só quando) os dois insumos existem. Efeito, e não um clique, porque
   * um dos insumos é ASSÍNCRONO: a auto-seleção da conta única só se resolve quando a listagem chega.
   *
   * A `ref` guarda o par já conferido. Sem ela, qualquer re-render repetiria a chamada — e em dev o
   * StrictMode a repetiria sempre, fazendo duas conferências para cada abertura.
   */
  const lastRun = useRef<string | null>(null)
  useEffect(() => {
    if (!open || pendingIds.length === 0 || cedenteAccountId === '') return
    const key = `${cedenteAccountId}|${pendingIds.join(',')}`
    if (lastRun.current === key) return
    lastRun.current = key
    mutate({ cedenteAccountId, payableIds: pendingIds })
  }, [open, pendingIds, cedenteAccountId, mutate])

  // ⚠️ GERAÇÃO — a única chamada da tela que move dinheiro. Sem retry automático: repetir sozinha uma
  // requisição que pode ter enfileirado o pagamento é a receita para pagar duas vezes. Se o resultado for
  // incerto, quem decide reenviar é o operador (e o backend recusa o documento já preso).
  const generateMut = useMutation({
    mutationKey: ['financial', 'remittances', 'generate'] as const,
    retry: false,
    mutationFn: (payableIds: readonly string[]) =>
      // A MESMA conta com que o pré-voo foi feito: gerar com outra tornaria a conferência que o operador
      // acabou de ler uma descrição de um arquivo que não é este.
      financialRepository.generateRemittance({ cedenteAccountId, payableIds }),
    // Erros são valores: a `fn` resolve com `Result`, então esta callback roda nos DOIS desfechos.
    onSuccess: (res) => {
      // O título saiu para o banco, e a listagem tem de deixar de oferecê-lo — senão o operador reenvia
      // o que já foi. ⚠️ Hoje o refetch traz o MESMO estado: o core-api não move o título de `Aprovado`
      // (`Transmitted` está no enum e nada o atribui — core-api#792). A invalidação fica porque é o que
      // estará certo quando a transição existir, mas não conte com ela para esconder o que já saiu.
      //
      // O conflito entra aqui pelo mesmo motivo, e não por otimismo: `conflict` significa que ALGUÉM
      // prendeu o título antes de nós (a reserva sob lock do core-api#814 fecha a corrida). Ou seja, a
      // tela está comprovadamente desatualizada — é o caso em que revalidar é MAIS necessário, não
      // menos, e a mensagem do backend manda o operador fazer exatamente isso ("Atualize a lista e
      // refaça a seleção").
      if (!isOk(res) && res.error.error !== 'conflict') return
      void queryClient.invalidateQueries({ queryKey: ['financial', 'payable-titles'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
    },
  })

  const { mutate: mutateGenerate, reset: resetGenerate } = generateMut

  // Download (specs/103) — LEITURA pura: serve o objeto que já está no bucket, não regera nada. Por isso,
  // ao contrário da geração, repetir é inofensivo e não há razão para `retry: false`. Ainda assim não é
  // `useQuery`: baixar é ato do operador, não efeito de montar a tela.
  const downloadMut = useMutation({
    mutationKey: ['financial', 'remittances', 'file'] as const,
    mutationFn: (remittanceId: string) => financialRepository.downloadRemittanceFile(remittanceId),
    onSuccess: (res) => {
      if (!isOk(res)) return
      saveAs(res.value.base64, res.value.fileName)
    },
  })

  const { mutate: mutateDownload, reset: resetDownload } = downloadMut

  const start = useCallback(
    (payableIds: readonly string[], excluded: number): void => {
      if (payableIds.length === 0) return
      setOpen(true)
      setUnchecked(new Set()) // nova conferência começa com tudo o que pode ir, marcado
      setConfirming(false)
      resetGenerate()
      resetDownload()
      setSent(null) // comprovante velho e o que ele descreve saem juntos
      // Congela o que o grid dizia AGORA: daqui em diante ele muda (a geração transmite os títulos).
      setNotApprovedCount(excluded)
      // Guarda a seleção; quem dispara a conferência é o efeito, quando houver conta.
      setPendingIds(payableIds)
    },
    [resetGenerate, resetDownload],
  )

  const toggle = useCallback((payableId: string): void => {
    setUnchecked((prev) => {
      const next = new Set(prev)
      if (next.has(payableId)) next.delete(payableId)
      else next.add(payableId)
      return next
    })
  }, [])

  const close = useCallback((): void => {
    setOpen(false)
    setConfirming(false)
    setPendingIds([])
    setNotApprovedCount(0)
    // Esquece o par já conferido: reabrir com a MESMA seleção e a mesma conta tem de conferir de novo —
    // entre uma abertura e outra o operador pode ter corrigido justamente o cadastro que estava impedindo.
    lastRun.current = null
    reset() // não guarda pré-voo velho: reabrir com outra seleção não pode mostrar o resultado da anterior
    resetGenerate() // nem comprovante velho: ele é de um pagamento que já aconteceu
    setSent(null) // e o que ele descreve some junto — os dois são o mesmo fato
    resetDownload() // nem erro de download da remessa anterior
  }, [reset, resetGenerate, resetDownload])

  const result = previewMut.data
  const preview = result !== undefined && isOk(result) ? result.value : null
  const errorTag = result !== undefined && !isOk(result) ? financialErrorTag(result.error) : null

  const dlResult = downloadMut.data
  const dlFailure = dlResult !== undefined && !isOk(dlResult) ? dlResult.error : null
  const dlObjectKey = dlResult !== undefined && isOk(dlResult) ? dlResult.value.objectKey : null

  const genResult = generateMut.data
  const generated = genResult !== undefined && isOk(genResult) ? genResult.value : null
  const genFailure = genResult !== undefined && !isOk(genResult) ? genResult.error : null

  return {
    open,
    running: previewMut.isPending,
    preview,
    errorTag,
    unchecked,
    toggle,
    start,
    notApprovedCount,
    close,
    // Esperando a conta: há seleção, o modal está aberto e ninguém conseguiu (ou escolheu) uma conta ainda.
    awaitingAccount: open && pendingIds.length > 0 && cedenteAccountId === '',
    // `en-CA` dá YYYY-MM-DD no fuso LOCAL. `toISOString()` daria UTC e recuaria um dia à noite em
    // Brasília — reprovando como "ontem" uma remessa que é de hoje.
    today: new Date().toLocaleDateString('en-CA'),
    accounts,
    cedenteAccountId,
    setCedenteAccountId: setChosenAccountId,
    confirming,
    arm: () => {
      setConfirming(true)
    },
    disarm: () => {
      setConfirming(false)
    },
    generating: generateMut.isPending,
    generated,
    generateErrorTag: genFailure === null ? null : financialErrorTag(genFailure.error),
    generateErrorMessage: genFailure?.message ?? null,
    sent,
    generate: (payableIds, paymentDate) => {
      if (payableIds.length === 0 || cedenteAccountId === '') return
      setConfirming(false)
      // A conta é lida AQUI, do id que disparou este envio — e não do seletor depois. O seletor
      // continua editável com o comprovante aberto: relê-lo adiante nomearia a conta escolhida agora,
      // não a que pagou.
      const payer = accounts.find((a) => a.id === cedenteAccountId)
      // Congela ANTES de disparar: o `onSuccess` invalida as listas, e a partir dali a tela descreve o
      // estado novo. Depois do envio não há mais de onde reler para que dia a remessa foi.
      setSent({
        paymentDate,
        // `payer` só é `undefined` se a conta sumir da lista entre a escolha e o clique (refetch com a
        // conta encerrada). Cair para vazio deixa o comprovante sem a conta; inventar um rótulo seria
        // pior, porque o comprovante afirma um fato.
        account: payer === undefined ? '' : accountLabel(payer),
        convenio: payer?.convenio ?? '',
      })
      mutateGenerate(payableIds)
    },
    downloading: downloadMut.isPending,
    downloadErrorTag: dlFailure === null ? null : financialErrorTag(dlFailure.error),
    downloadErrorMessage: dlFailure?.message ?? null,
    downloadedFromFailures: dlObjectKey?.startsWith(FAILURES_PREFIX) === true,
    // POR ARQUIVO (core-api#929): o lote pode ter um por modalidade, e cada um é um objeto próprio no
    // bucket. Um botão só, baixando o primeiro, entregaria metade da evidência a quem vai conferir
    // bytes com o banco — e sem dizer que faltava metade.
    downloadFile: (remittanceId: string) => {
      mutateDownload(remittanceId)
    },
  }
}
