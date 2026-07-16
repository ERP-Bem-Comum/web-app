/**
/**
 * Binding do modal "Centros de Custo" (§1.5) — ADAPTER React (§XI). UI-state (aberto, centro selecionado, modo
 * do painel, campos do form, nós recolhidos) + ESCRITA REAL da estrutura via server-fn:
 * criar Centro → Categoria → Subcategoria (feature 061) e renomear/(des)ativar (feature 075).
 * Cada `onSuccess` invalida `planDetailQueryKey(id)` (a árvore relê pronta do BFF §III), e o centro
 * recém-criado é auto-selecionado (cascata: habilita criar sob ele).
 * Erros como valores (§V): `errorTag` (client-side `name-required` OU tag do backend).
 *
 * `active` é SERVER-STATE (§XI): mora na árvore relida, não num Set local. Até a feature 075 "desativar" era
 * um Set em memória — não saía do navegador e voltava no F5.
 */
import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isErr } from '#shared/primitives/result.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import type { PlanDetail, CostNodeLevel } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import type { BudgetPlansError } from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'
import { planDetailQueryKey } from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.query-key.ts'
import {
  buildCentrosTree,
  emptyCentroFormFields,
  nodeKey,
  validateCentroName,
  categoriaLock,
  subLock,
  CENTRO_TIPO_OPTIONS,
  SUB_TIPO_OPTIONS,
  RELEASE_TYPE_OPTIONS,
  type CentroNode,
  type CentroFormMode,
  type CentroFormFields,
  type CentroFormError,
  type NodeLock,
} from '#modules/budget-plans/client/planejamento/detalhe/centros-custo.view-model.ts'
import type {
  CostCenterType,
  SubCategoryType,
  ReleaseType,
} from '#modules/budget-plans/client/data/model/enums.ts'

/** Tag de erro exibida no painel de formulário: validação client-side OU eco do backend (§V). */
export type CentrosCustoErrorTag = CentroFormError | BudgetPlansError

export type CentrosCustoBinding = Readonly<{
  open: boolean
  programName: string
  centros: readonly CentroNode[]
  selectedCentroId: number | null
  selectedCentro: CentroNode | null
  formMode: CentroFormMode
  form: CentroFormFields
  centroTipoOptions: readonly CostCenterType[]
  subTipoOptions: readonly SubCategoryType[]
  releaseTypeOptions: readonly ReleaseType[]
  /** Tag de erro da submissão (ou `null`). A view resolve o rótulo i18n. */
  errorTag: CentrosCustoErrorTag | null
  /** Submissão em curso (algum dos 3 POSTs ou o PATCH pendente) — a view desabilita o botão de salvar. */
  submitting: boolean
  /**
   * Trava do switch por herança + o ancestral que a causou (`null` = livre). A view desabilita e explica.
   * `sub`: passe `categoriaId`; `centro` nunca trava (é raiz).
   */
  lockOf: (target: ToggleTarget) => NodeLock
  isCollapsed: (kind: 'centro' | 'categoria', id: number) => boolean
  toggleCollapse: (kind: 'centro' | 'categoria', id: number) => void
  openModal: () => void
  close: () => void
  selectCentro: (id: number) => void
  startForm: (mode: CentroFormMode) => void
  cancelForm: () => void
  setNome: (v: string) => void
  setCentroTipo: (v: CostCenterType) => void
  setSubTipo: (v: SubCategoryType) => void
  setReleaseType: (v: ReleaseType) => void
  submitForm: () => void
  /** Liga/desliga o nó (PATCH `{ active }`). No-op se travado por herança — a view já desabilita. */
  toggleActive: (target: ToggleTarget) => void
}>

/**
 * Alvo do switch. União discriminada (§IV) em vez de `(kind, id)` solto porque a subcategoria só é endereçável
 * SABENDO a categoria-pai: a árvore é aninhada e o `id` numérico é sintético (chave de render), não global.
 */
export type ToggleTarget =
  | Readonly<{ kind: 'centro'; centroId: number }>
  | Readonly<{ kind: 'categoria'; centroId: number; categoriaId: number }>
  | Readonly<{ kind: 'sub'; centroId: number; categoriaId: number; subId: number }>

export function useCentrosCusto(planId: string, detail: PlanDetail | null): CentrosCustoBinding {
  const queryClient = useQueryClient()

  const centros = useMemo<readonly CentroNode[]>(
    () => (detail !== null ? buildCentrosTree(detail) : []),
    [detail],
  )

  const [open, setOpen] = useState(false)
  const [selectedCentroId, setSelectedCentroId] = useState<number | null>(centros[0]?.id ?? null)
  const [formMode, setFormMode] = useState<CentroFormMode>({ kind: 'none' })
  const [form, setForm] = useState<CentroFormFields>(emptyCentroFormFields)
  // Nós recolhidos (chevron); por padrão tudo expandido → o Set guarda só os fechados.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [errorTag, setErrorTag] = useState<CentrosCustoErrorTag | null>(null)
  // Após criar um centro, guardamos o `ref` novo; a seleção derivada abaixo o prioriza quando a árvore relê
  // (cascata: o centro recém-criado fica selecionado sem effect — derivação pura §XI). `selectCentro` o limpa.
  const [pendingSelectRef, setPendingSelectRef] = useState<string | null>(null)

  // Seleção efetiva (derivada, sem setState-em-effect): o centro pendente (recém-criado) tem prioridade quando
  // já aparece na árvore; senão a seleção manual; senão o primeiro centro.
  const pendingCentro =
    pendingSelectRef !== null ? (centros.find((c) => c.ref === pendingSelectRef) ?? null) : null
  const selectedCentro = pendingCentro ?? centros.find((c) => c.id === selectedCentroId) ?? centros[0] ?? null

  const invalidateDetail = (): void => {
    void queryClient.invalidateQueries({ queryKey: planDetailQueryKey(planId) })
  }

  const addCostCenterMutation = useMutation({
    mutationFn: budgetPlansRepository.addCostCenter,
    onSuccess: (res) => {
      if (isErr(res)) {
        setErrorTag(res.error)
        return
      }
      invalidateDetail()
      setErrorTag(null)
      setFormMode({ kind: 'none' })
    },
    onError: () => {
      setErrorTag('unexpected')
    },
  })

  const addCategoryMutation = useMutation({
    mutationFn: budgetPlansRepository.addCategory,
    onSuccess: (res) => {
      if (isErr(res)) {
        setErrorTag(res.error)
        return
      }
      invalidateDetail()
      setErrorTag(null)
      setFormMode({ kind: 'none' })
    },
    onError: () => {
      setErrorTag('unexpected')
    },
  })

  const addSubcategoryMutation = useMutation({
    mutationFn: budgetPlansRepository.addSubcategory,
    onSuccess: (res) => {
      if (isErr(res)) {
        setErrorTag(res.error)
        return
      }
      invalidateDetail()
      setErrorTag(null)
      setFormMode({ kind: 'none' })
    },
    onError: () => {
      setErrorTag('unexpected')
    },
  })

  // Feature 075: renomear e (des)ativar caem no MESMO PATCH (`{ name?, active? }`) — uma mutation p/ os dois.
  const patchCostNodeMutation = useMutation({
    mutationFn: budgetPlansRepository.patchCostNode,
    onSuccess: (res) => {
      if (isErr(res)) {
        setErrorTag(res.error)
        return
      }
      invalidateDetail()
      setErrorTag(null)
      setFormMode({ kind: 'none' })
    },
    onError: () => {
      setErrorTag('unexpected')
    },
  })

  const submitting =
    addCostCenterMutation.isPending ||
    addCategoryMutation.isPending ||
    addSubcategoryMutation.isPending ||
    patchCostNodeMutation.isPending

  // Pré-preenche o form ao ENTRAR num modo de edição; add começa vazio. Limpa o erro anterior.
  const startForm = (mode: CentroFormMode): void => {
    setErrorTag(null)
    if (mode.kind === 'edit-centro') {
      const c = centros.find((x) => x.id === mode.centroId)
      setForm({ ...emptyCentroFormFields(), nome: c?.name ?? '', centroTipo: c?.type ?? 'A PAGAR' })
    } else if (mode.kind === 'edit-categoria') {
      const cat = centros
        .find((x) => x.id === mode.centroId)
        ?.categories.find((y) => y.id === mode.categoriaId)
      setForm({ ...emptyCentroFormFields(), nome: cat?.name ?? '' })
    } else if (mode.kind === 'edit-sub') {
      const sub = centros
        .find((x) => x.id === mode.centroId)
        ?.categories.find((y) => y.id === mode.categoriaId)
        ?.subCategories.find((s) => s.id === mode.subId)
      setForm({ ...emptyCentroFormFields(), nome: sub?.name ?? '' })
    } else {
      setForm(emptyCentroFormFields())
    }
    setFormMode(mode)
  }

  const submitForm = (): void => {
    const mode = formMode

    if (mode.kind === 'add-centro') {
      const nameErr = validateCentroName(form.nome)
      if (nameErr !== null) {
        setErrorTag(nameErr)
        return
      }
      setErrorTag(null)
      // Snapshot dos refs conhecidos AGORA (antes do POST) — o auto-select diffa contra ele na resposta, sem
      // depender do `centros` do render em que o onSuccess roda (que já pode ter relido a árvore com o novo nó).
      const knownRefs = new Set(centros.map((c) => c.ref))
      addCostCenterMutation.mutate(
        { planId, name: form.nome.trim(), direction: form.centroTipo },
        {
          onSuccess: (res) => {
            if (isErr(res)) return
            const created = res.value.costCenters.find((cc) => !knownRefs.has(cc.ref))
            if (created !== undefined) setPendingSelectRef(created.ref) // cascata: seleciona o centro novo
          },
        },
      )
      return
    }

    if (mode.kind === 'add-categoria') {
      const nameErr = validateCentroName(form.nome)
      if (nameErr !== null) {
        setErrorTag(nameErr)
        return
      }
      const parent = centros.find((c) => c.id === mode.centroId)
      if (parent?.ref === undefined) {
        setErrorTag('missing-parent')
        return
      }
      setErrorTag(null)
      addCategoryMutation.mutate({ planId, costCenterId: parent.ref, name: form.nome.trim() })
      return
    }

    if (mode.kind === 'add-sub') {
      const nameErr = validateCentroName(form.nome)
      if (nameErr !== null) {
        setErrorTag(nameErr)
        return
      }
      const parent = centros
        .find((c) => c.id === mode.centroId)
        ?.categories.find((cat) => cat.id === mode.categoriaId)
      if (parent?.ref === undefined) {
        setErrorTag('missing-parent')
        return
      }
      setErrorTag(null)
      addSubcategoryMutation.mutate({
        planId,
        categoryId: parent.ref,
        name: form.nome.trim(),
        launchType: form.releaseType,
      })
      return
    }

    // ── edit-* (feature 075): renomear via PATCH. O `id` numérico é sintético (chave de render), então o
    // alvo é sempre o `ref` uuid. Só o NOME sai daqui: o tipo do centro e o modelo de cálculo da subcategoria
    // não entram no contrato do PATCH (`{ name?, active? }`) — a view não os oferece na edição.
    if (mode.kind === 'edit-centro' || mode.kind === 'edit-categoria' || mode.kind === 'edit-sub') {
      const nameErr = validateCentroName(form.nome)
      if (nameErr !== null) {
        setErrorTag(nameErr)
        return
      }
      const target = resolveEditTarget(mode)
      if (target === null) {
        setErrorTag('missing-parent') // trava defensiva: a árvore mudou embaixo do painel aberto
        return
      }
      setErrorTag(null)
      patchCostNodeMutation.mutate({
        planId,
        level: target.level,
        nodeId: target.ref,
        name: form.nome.trim(),
      })
      return
    }

    setFormMode({ kind: 'none' })
  }

  /** Modo de edição → (nível, `ref` uuid do nó). `null` = o nó sumiu da árvore (não deveria ocorrer). */
  const resolveEditTarget = (
    mode: CentroFormMode,
  ): Readonly<{ level: CostNodeLevel; ref: string }> | null => {
    if (mode.kind === 'edit-centro') {
      const c = centros.find((x) => x.id === mode.centroId)
      return c === undefined ? null : { level: 'cost-center', ref: c.ref }
    }
    if (mode.kind === 'edit-categoria') {
      const cat = centros
        .find((x) => x.id === mode.centroId)
        ?.categories.find((y) => y.id === mode.categoriaId)
      return cat === undefined ? null : { level: 'category', ref: cat.ref }
    }
    if (mode.kind === 'edit-sub') {
      const sub = centros
        .find((x) => x.id === mode.centroId)
        ?.categories.find((y) => y.id === mode.categoriaId)
        ?.subCategories.find((s) => s.id === mode.subId)
      return sub === undefined ? null : { level: 'subcategory', ref: sub.ref }
    }
    return null
  }

  return {
    open,
    programName: detail?.programAbbreviation ?? '',
    centros,
    selectedCentroId: selectedCentro?.id ?? null,
    selectedCentro,
    formMode,
    form,
    centroTipoOptions: CENTRO_TIPO_OPTIONS,
    subTipoOptions: SUB_TIPO_OPTIONS,
    releaseTypeOptions: RELEASE_TYPE_OPTIONS,
    errorTag,
    submitting,
    lockOf: (target) => {
      const centro = centros.find((c) => c.id === target.centroId)
      if (centro === undefined) return null
      if (target.kind === 'centro') return null // raiz: não tem ancestral que a desligue
      const categoria = centro.categories.find((cat) => cat.id === target.categoriaId)
      if (categoria === undefined) return null
      return target.kind === 'categoria' ? categoriaLock(centro) : subLock(centro, categoria)
    },
    isCollapsed: (kind, id) => collapsed.has(nodeKey(kind, id)),
    toggleCollapse: (kind, id) => {
      const key = nodeKey(kind, id)
      setCollapsed((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    },
    openModal: () => {
      setFormMode({ kind: 'none' })
      setErrorTag(null)
      setOpen(true)
    },
    close: () => {
      setOpen(false)
    },
    selectCentro: (id) => {
      setSelectedCentroId(id)
      setPendingSelectRef(null) // seleção manual sobrepõe o auto-select do centro recém-criado
      setFormMode({ kind: 'none' })
      setErrorTag(null)
    },
    startForm,
    cancelForm: () => {
      setFormMode({ kind: 'none' })
      setErrorTag(null)
    },
    setNome: (v) => {
      setForm((f) => ({ ...f, nome: v }))
      setErrorTag(null)
    },
    setCentroTipo: (v) => {
      setForm((f) => ({ ...f, centroTipo: v }))
    },
    setSubTipo: (v) => {
      setForm((f) => ({ ...f, subTipo: v }))
    },
    setReleaseType: (v) => {
      setForm((f) => ({ ...f, releaseType: v }))
    },
    submitForm,
    toggleActive: (target) => {
      const centro = centros.find((c) => c.id === target.centroId)
      if (centro === undefined) return
      const categoria =
        target.kind === 'centro' ? undefined : centro.categories.find((cat) => cat.id === target.categoriaId)

      // O nó e o nível, pelo `ref` uuid (o `id` numérico é sintético — chave de render, não endereço).
      const node =
        target.kind === 'centro'
          ? { level: 'cost-center' as const, ref: centro.ref, active: centro.active }
          : target.kind === 'categoria'
            ? categoria === undefined
              ? null
              : { level: 'category' as const, ref: categoria.ref, active: categoria.active }
            : (() => {
                const sub = categoria?.subCategories.find((s) => s.id === target.subId)
                return sub === undefined
                  ? null
                  : { level: 'subcategory' as const, ref: sub.ref, active: sub.active }
              })()
      if (node === null) return

      // Travado por herança: no-op. A view já desabilita o switch — isto é a rede de segurança, não a regra.
      // Deixar passar mandaria um PATCH que "funciona" (200) e não muda o que se vê: o core gravaria a
      // intenção e devolveria o efetivo `false` do mesmo jeito, e o switch voltaria sozinho (core-api#469).
      const lock =
        target.kind === 'centro'
          ? null
          : target.kind === 'categoria'
            ? categoriaLock(centro)
            : categoria === undefined
              ? null
              : subLock(centro, categoria)
      if (lock !== null) return

      setErrorTag(null)
      // Só `active` (sem `name`): (des)ativar não renomeia. O core aceita os dois campos no mesmo PATCH, mas
      // mandar o nome atual junto reescreveria o nó por engano se a árvore em mãos estivesse velha.
      patchCostNodeMutation.mutate({
        planId,
        level: node.level,
        nodeId: node.ref,
        active: !node.active,
      })
    },
  }
}
