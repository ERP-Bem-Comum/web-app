# Code Review — `feat/contracts-detail-and-partners`

> **Data:** 2026-06-08 · **Base de comparação:** `origin/develop` (merge-base `063098f`)
> **Escopo:** 123 arquivos / ~6.600 linhas — detalhe de contratos (aditivos, distrato, anexo/ativação
> de documento, preview, octet-stream) + telas de parceiros/colaboradores.
> **Revisor:** Claude (Opus 4.8) + 8 subagentes especialistas + MCP `core-api` + MCP `acdg-skills`
> (base canônica: Uncle Bob, Fowler, Evans).

---

## 0. Como ler este relatório

Cada achado tem **5 partes**, nesta ordem (a pedido):

1. **O quê** — descrição objetiva do problema.
2. **Por quê** — a razão, com **citação** do ADR/constituição do projeto **e** da fonte canônica (ACDG) quando aplicável.
3. **Código atual** — o trecho real, com `arquivo:linha`.
4. **Código proposto** — a correção concreta.

Leia primeiro o **§1 Sumário executivo** (visão de tudo), depois mergulhe nos achados por severidade.
As citações canônicas completas estão no **Apêndice A**.

**Legenda de severidade**

| Nível | Significado |
|---|---|
| 🔴 **CRÍTICO** | Viola invariante da constituição/ADR ou cria risco real (SSR, dados, segurança). Corrigir antes do merge. |
| 🟠 **ALTO** | Dívida arquitetural relevante ou bug de UX/cache. Corrigir nesta branch ou logo após, com decisão consciente. |
| 🟡 **MÉDIO** | Inconsistência, fragilidade ou divergência de padrão. Higiene. |
| 🟢 **BAIXO** | Cosmético / preferência / nota. |

**Status dos gates automáticos:** `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test:all` ✅ ·
paridade de contrato com o core-api `origin/dev` ✅. **Nenhum bloqueador de build.** Os achados abaixo
são de **conformidade** (coisas que o lint não cobra) e de **higiene de cache/erro/a11y**.

---

## 1. Sumário executivo

| # | Sev | Título | Arquivo principal |
|---|-----|--------|-------------------|
| **C1** | 🔴 | `new Date()` no corpo do render (pureza/SSR) | `contract-aside.component.tsx:58` |
| **C2** | 🔴 | Zod importado na camada `domain/` | `server/domain/contracts.types.ts:5` |
| **C3** | 🔴 | `safeParse → throw new Error` nos mappers (errors-as-values) | `core-api/core-api-contracts.ts:297,319,350,507,568` |
| **A1** | 🟠 | `contract-detail.page` orquestra 4 fluxos + mistura UI-state↔`command.result` | `contract-detail/page/contract-detail.page.tsx:54-67` |
| **A2** | 🟠 | `ContractsError` triplicada (3 fontes, já com drift) | `contracts.errors.ts` · `contracts-shared.types.ts` · `contracts.repository.ts` |
| **A3** | 🟠 | `switch` sem guarda de exaustividade `never` | `data/helpers/contracts-error-tag.ts:7-43` |
| **A4** | 🟠 | Modais sem ESC / focus-trap / foco inicial | `attach-document-modal.tsx`, `amendment-modal.tsx`, `document-preview-modal.tsx` |
| **A5** | 🟠 | Invalidação de cache global + ampla + em erro de negócio | `app/query-client.ts:22` + 4 bindings |
| **A6** | 🟠 | Paginação de colaboradores sem `placeholderData` | `collaborator-list/collaborator-list.query.ts:10` |
| **A7** | 🟠 | `endContractFn` sem `try/catch` (diverge das irmãs) | `server-fns/end-contract.service.fn.ts:20` |
| **A8** | 🟠 | String de UI hardcoded sem i18n | `contract-detail/page/contract-detail.page.tsx:83` |
| **D1** | 🟠 | *(decisão)* `queryFn` nunca lança → cadeia 401→signOut não dispara | sistêmico (queries + `query-client.ts`) |
| **M1** | 🟡 | `staleTime` default 0 nas 3 queries novas | `*.query.ts` |
| **M2** | 🟡 | Tipografia fora da escala de tokens (escala-fantasma) | `contract-detail/page/contract-detail.css.ts` |
| **M3** | 🟡 | Physical properties em vez de logical (quebra RTL) | `contract-detail.css.ts` |
| **M4** | 🟡 | Modais sem `prefers-reduced-motion` | `*-modal.css.ts` |
| **M5** | 🟡 | `octet-stream-fetch`: body de erro sem teto + listener | `external/core-api/octet-stream-fetch.ts:47,80` |
| **M6** | 🟡 | `public-api` incompleto (fn/binding de aditivo ausentes) | `contracts/public-api/index.ts` |
| **M7** | 🟡 | `Money.cents: z.int()` aceita negativo | `contracts.schema.ts:16` + `contracts.model.ts` |
| **M8** | 🟡 | `formatDate` duplicado com bug de timezone | `contract-timeline.component.tsx:19` |
| **M9** | 🟡 | Gap spec 017 US2 (criar contrato já com documento) | `specs/017-*` vs implementação |
| **B1** | 🟢 | `key={idx}` em timeline reordenada | `contract-timeline.component.tsx:55` |
| **B2** | 🟢 | Tipos manuais duplicando `z.infer` | `core-api-contracts.ts:199,251` |
| **Bc** | 🟢 | `email: z.email()` quebra lista inteira por 1 registro legado | `partners/.../collaborator.schema.ts:12` |

**Contestados (NÃO são dívida):** imports cross-submódulo "violando ADR-0001" (falso — é intra-módulo,
permitido) e "renomear `contract-attach-document/`" (preferência, não regra). Detalhe no **§5**.

---

## 2. Achados CRÍTICOS 🔴

### C1 — `new Date()` no corpo do render

**O quê.** O componente `ContractAside` lê o relógio (`new Date()`) durante o render e usa o valor para
derivar barra de vigência, dias decorridos e dias restantes.

**Por quê.** O render de um componente React deve ser **puro e SSR-safe**. Ler o relógio no corpo torna
o output não-determinístico → o HTML do servidor (SSR) e o da hidratação divergem (**hydration mismatch**),
e o mesmo render produz valores diferentes a cada chamada.

- **Constituição §XI:** *"O render MUST ser puro (sem `Math.random`/`Date.now`/I/O no corpo … SSR-safe)."*
- **Canônico — Fowler, _Refactoring_, p.343 (Command-Query Separation):** *"any function that returns a
  value should not have observable side effects."* Um componente é uma função que **retorna** a view; ler
  o relógio é um efeito observável no caminho de "query". (Apêndice A.2)

**Código atual** — `src/modules/contracts/client/contract-detail/components/contract-aside.component.tsx:58`
```tsx
export function ContractAside({ contract }: Props): ReactNode {
  // ...
  const today = new Date()                                    // ❌ efeito observável no render
  const startDate = contract.currentPeriod?.start ?? contract.originalPeriod.start
  const endDate = contract.currentPeriod?.end ?? contract.originalPeriod.end
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000))
  const elapsedDays = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / 86_400_000))
  const progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / 86_400_000)
  // ...
}
```

**Código proposto.** Tirar o "agora" do render. A derivação de vigência é pura se `now` for um argumento —
calcule na ViewModel/binding e passe por prop, ou (se precisar reagir ao tempo) capture via estado:
```tsx
// Opção A (preferida): a view-model recebe `now` e devolve a vigência já derivada (testável em node:test).
// contract-detail.view-model.ts
export function deriveVigencia(contract: Contract, now: Date) {
  const start = contract.currentPeriod?.start ?? contract.originalPeriod.start
  const end = contract.currentPeriod?.end ?? contract.originalPeriod.end
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000))
  const elapsedDays = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / 86_400_000))
  return {
    start, end,
    progressPercent: Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)),
    daysRemaining: Math.ceil((end.getTime() - now.getTime()) / 86_400_000),
  } as const
}

// ContractAside passa a receber `vigencia` por prop — render 100% puro.
interface Props { contract: Contract; vigencia: ReturnType<typeof deriveVigencia> }
```
```tsx
// Opção B (se a barra precisar "andar" sozinha): capturar o relógio fora do render.
const [now, setNow] = useState(() => Date.now())   // lazy init, fora do caminho puro
useEffect(() => {
  const id = setInterval(() => { setNow(Date.now()) }, 60_000)
  return () => { clearInterval(id) }
}, [])
```

> ⚠️ **Investigar:** a regra `purity` do `eslint-plugin-react-hooks` v7 lista `new Date()` explicitamente,
> mas o `pnpm lint` passou verde. Conferir se há `eslint-disable` inline ou gap de versão da regra.

---

### C2 — Zod importado na camada `domain/`

**O quê.** `server/domain/contracts.types.ts` faz `import * as z from 'zod'` e define ~13 schemas Zod
(`ContractSchema`, `ListContractsInputSchema`, `AttachSignedDocumentInputSchema`, …). O domínio passou a
depender de uma biblioteca de **infraestrutura de validação**.

**Por quê.** O domínio deve ser puro e livre de framework; validação de borda vive em `adapters/`.

- **AGENTS.md / boundary:** *"domínio e application nunca importam Zod; validação de invariante é via
  smart constructors → Result."*
- **Canônico — Evans, _Domain-Driven Design_, p.59 ("The Pitfalls of Infrastructure-Driven Packaging"):**
  *"…the enforcement of LAYERED ARCHITECTURE by placing infrastructure and user interface code into
  separate groups of packages, **leaving the domain layer physically separated into its own set of
  packages**."* (Apêndice A.3) — é o achado de maior fundamento teórico do review.

O próprio arquivo admite a origem do desvio no comentário: *"Definidos no server para evitar import
circular client→server"* — mas o lugar correto para fugir do ciclo é `adapters/`, não `domain/`.

**Código atual** — `src/modules/contracts/server/domain/contracts.types.ts:1-32`
```ts
/**
 * Tipos e schemas compartilhados do domínio de contratos (server-side).
 * Definidos no server para evitar import circular client→server.
 */
import * as z from 'zod'                                      // ❌ Zod no domain

export const ContractStatusSchema = z.enum(['Pendente', 'Em Andamento', 'Finalizado', 'Distrato'])
export type ContractStatus = z.infer<typeof ContractStatusSchema>
// ... +12 schemas (ContractSchema, ListContractsInputSchema, AttachSignedDocumentInputSchema, ...)
```

**Código proposto.** Mover os **schemas** para `server/adapters/` (ex.: o já existente
`adapters/core-api/contracts.schema.ts` ou um novo `adapters/contracts-input.schema.ts`); o `domain/`
exporta **só tipos puros**. As server-fns passam a importar os schemas do adapter.
```ts
// server/domain/contracts.types.ts — APENAS tipos puros (zero import de zod)
export type ContractStatus = 'Pendente' | 'Em Andamento' | 'Finalizado' | 'Distrato'
export type AmendmentType = 'prazo' | 'valor' | 'escopo' | 'outro' | 'distrato'
export type Money = Readonly<{ cents: number }>
export type Period = Readonly<{ start: Date; end: Date }>
export type Contract = Readonly<{ /* … só tipos … */ }>
```
```ts
// server/adapters/contracts-input.schema.ts — os schemas de borda (input das server-fns)
import * as z from 'zod'
import type { ContractStatus } from '#modules/contracts/server/domain/contracts.types.ts'

export const ContractStatusSchema = z.enum(
  ['Pendente', 'Em Andamento', 'Finalizado', 'Distrato'],
) satisfies z.ZodType<ContractStatus>

export const AttachSignedDocumentInputSchema = z.object({ /* … */ })
```
```ts
// (recomendado) enforçar a regra no lint para não regredir:
// eslint.config.js — no-restricted-imports de 'zod' no escopo server/**/domain/**
```

---

### C3 — `safeParse → throw new Error` nos mappers (errors-as-values)

**O quê.** Os mappers de response do core-api fazem `safeParse` e, no caminho de falha, **lançam
exceção** (`throw new Error(...)`). Só não explode porque cada call-site as envolve num `try/catch` que
devolve `err('server')`.

**Por quê.** ADR-0002: erro é **valor** (`Result`); `throw` só na borda de infra, convertido para
`Result` na hora. O padrão atual espalha o tratamento de erro entre o mapper (que lança) e o call-site
(que captura) — frágil: um call-site futuro que esquecer o `try/catch` propaga exceção crua pela server-fn.
O **lado de colaboradores já faz certo** (`if (!parsed.success) return err('server')`).

- **ADR-0002 (errors-as-values):** `throw` só na borda; `Result` no resto.
- **Canônico — Uncle Bob, _Código Limpo_, p.48 ("Tratamento de erro é uma coisa só"):** *"As funções
  devem fazer uma coisa só. Tratamento de erro é uma coisa só. Portanto, uma função que trata de erros
  não deve fazer mais nada."* (Apêndice A.4) — mapear dados **e** sinalizar erro por exceção são duas
  coisas na mesma função.

**Código atual** — `src/modules/contracts/server/adapters/core-api/core-api-contracts.ts`
```ts
// :289  (apiContractDetailToDomain)
const parsed = CoreApiContractDetailSchema.safeParse(raw)
if (!parsed.success) {
  // ...fallback...
  throw new Error(`[contracts] resposta inválida do core-api: ${parsed.error.message}`)   // ❌
}

// :316 (apiListResponseToDomain)
if (!parsed.success) {
  throw new Error(`[contracts] resposta inválida do core-api (list): ${parsed.error.message}`)   // ❌
}

// :504 (create) — e :566 (createAmendment): o call-site embrulha com try/catch
try {
  const parsed = CoreApiContractListItemSchema.safeParse(r.value)
  if (!parsed.success) throw new Error(parsed.error.message)   // ❌ lança p/ ser pego logo abaixo
  return ok(apiContractToDomain(parsed.data))
} catch {
  return err('server')
}
```

**Código proposto.** Os mappers retornam `Result<T, ContractsError>`; o call-site faz `if (isErr(...))`.
Sem `throw`, sem `try/catch` redundante — espelha o mapper de colaboradores.
```ts
export const apiContractDetailToDomain = (raw: unknown): Result<Contract, ContractsError> => {
  const parsed = CoreApiContractDetailSchema.safeParse(raw)
  if (!parsed.success) {
    const listParsed = CoreApiContractListItemSchema.safeParse(raw)
    if (listParsed.success) return ok(apiContractToDomain(listParsed.data))
    return err('server')                                       // ✅ erro como valor
  }
  const c = parsed.data
  return ok({ ...apiContractToDomain(c), /* … */ })
}

// call-site (create):
const parsed = CoreApiContractListItemSchema.safeParse(r.value)
if (!parsed.success) return err('server')                      // ✅ sem throw/catch
return ok(apiContractToDomain(parsed.data))
```

---

## 3. Achados ALTOS 🟠

### A1 — `contract-detail.page` orquestra 4 fluxos + mistura UI-state↔`command.result`

**O quê.** A página (uma *view burra*) reúne 5 bindings de comando, 4 `useState` e deriva a abertura dos
modais a partir do `command.result` das mutations — ou seja, mistura **estado de UI** (`attachOpen`,
`selectedAmendment`) com **server-state** (resultado da mutation).

**Por quê.**
- **Constituição §XI:** na view só é permitido `useState` de *"interação puramente local de
  apresentação"*; orquestração de tela vive na **ViewModel**. E §XI proíbe explicitamente **misturar
  server-state com UI-state**.
- **Canônico — Fowler, CQS (p.343, Apêndice A.2):** o componente está usando o **resultado de um comando**
  (`command.result === null`) como **query** para decidir a UI — exatamente a fronteira que o CQS pede
  para manter separada.

O lint não barra (não há `useQuery`/`useReducer` direto aqui), mas a constituição exige o arranjo na
ViewModel.

**Código atual** — `src/modules/contracts/client/contract-detail/page/contract-detail.page.tsx:54-67`
```tsx
const { attachCommand } = useAttachSignedDocumentBinding()
const { createCommand: amendmentCommand } = useAmendmentCreateBinding()
const { attachCommand: amendmentAttachCommand } = useAttachAmendmentDocumentBinding()
const { endCommand } = useEndContractBinding()
const [attachOpen, setAttachOpen] = useState(false)
const [amendmentOpen, setAmendmentOpen] = useState(false)
const [selectedAmendment, setSelectedAmendment] = useState<AmendmentForAttach | null>(null)
// ❌ flag de UI (amendmentOpen) combinada com server-state (command.result)
const amendmentModalOpen = amendmentOpen && amendmentCommand.result === null && endCommand.result === null
const amendmentAttachOpen = selectedAmendment !== null && amendmentAttachCommand.result === null
const modalOpen = attachOpen && attachCommand.result === null
```

**Código proposto.** Encapsular a orquestração dos modais numa view-model/binding que devolve o estado já
derivado; a page só consome por props (como `CollaboratorListPage` já faz).
```ts
// contract-detail.view-model.ts (derivação pura, testável)
export function deriveModalState(ui: UiFlags, cmds: Commands) {
  return {
    attach:  { open: ui.attachOpen && cmds.attach.result === null },
    create:  { open: ui.amendmentOpen && cmds.amendmentCreate.result === null && cmds.end.result === null },
    attachAmendment: { open: ui.selectedAmendment !== null && cmds.amendmentAttach.result === null },
  } as const
}
```
```tsx
// a page desestrutura e passa adiante — sem lógica condicional de orquestração
const modals = useContractDetailModals(contractId)   // binding que injeta UI-state + commands + deriva
<AttachDocumentModal open={modals.attach.open} onClose={modals.attach.close} ... />
```

---

### A2 — `ContractsError` triplicada (3 fontes, já com drift)

**O quê.** A mesma união de 17 literais está **copiada em 3 arquivos**, e a duplicação **já começou a
divergir** nos schemas correlatos (server usa `z.coerce.date()`/`z.string().trim()`; client usa
`z.date()`/`z.uuid()`; o regex de `fileName` só existe no server).

**Por quê.**
- **"Make illegal states unrepresentable"** depende de **uma** fonte de verdade — três listas independentes
  não têm garantia de sincronia.
- **Canônico — Fowler, _Refactoring_, p.68 ("DUPLICATED CODE"):** *"If you see the same code structure in
  more than one place… If you need to change the duplicated code, you have to find and catch each
  duplication."* (Apêndice A.1)

**Código atual** — três definições idênticas:
```ts
// server/domain/errors/contracts.errors.ts:5
export type ContractsError = 'invalid-code' | 'invalid-value' | /* … 17 literais … */ | 'storage-unavailable'

// server/adapters/contracts-shared.types.ts:8
export type ContractsError = 'invalid-code' | /* … os mesmos 17 … */

// client/data/repository/contracts.repository.ts:18
/** … definido localmente para evitar cross-layer import. */
export type ContractsError = 'invalid-code' | /* … os mesmos 17 … */
```

**Código proposto.** Fonte única na fronteira `adapters` (que o client-data já pode importar — ele já
importa `ContractHistoryEvent` de lá); os demais **reexportam**.
```ts
// server/adapters/contracts-shared.types.ts  → ÚNICA definição
export type ContractsError =
  | 'invalid-code' | 'invalid-value' | 'invalid-period' | 'missing-contractor'
  | 'contract-not-found' | 'amendment-not-found' | 'invalid-amendment-type'
  | 'connectivity' | 'server' | 'unauthorized' | 'not-implemented'
  | 'invalid-pdf' | 'file-too-large' | 'invalid-signed-at'
  | 'no-signed-document' | 'document-conflict' | 'storage-unavailable'
```
```ts
// server/domain/errors/contracts.errors.ts
export type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

// client/data/repository/contracts.repository.ts
export type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'
```

---

### A3 — `switch` sem guarda de exaustividade `never`

**O quê.** O `contractsErrorTag` cobre os 17 casos, mas **não tem** o `default` com `const _: never = e`.

**Por quê.** A invariante do projeto ("discriminated unions + `switch` exaustivo com guarda
`const _: never = x`") protege contra **remoção** de um caso: hoje, remover um membro degrada o retorno
para `string | undefined` em silêncio (o `switch-exhaustiveness-check` só pega quando se **adiciona** um
membro novo, não quando se remove um do tipo).

**Código atual** — `src/modules/contracts/client/data/helpers/contracts-error-tag.ts:6-43`
```ts
export const contractsErrorTag = (e: ContractsError): string => {
  switch (e) {
    case 'invalid-code': return 'contracts.error.invalid-code'
    // ... 16 casos ...
    case 'storage-unavailable': return 'contracts.attach.error.storage'
  }                                                          // ❌ sem default → retorno implícito undefined
}
```

**Código proposto.**
```ts
export const contractsErrorTag = (e: ContractsError): string => {
  switch (e) {
    case 'invalid-code': return 'contracts.error.invalid-code'
    // ... 16 casos ...
    case 'storage-unavailable': return 'contracts.attach.error.storage'
    default: {
      const _exhaustive: never = e                           // ✅ remove um caso → erro de compilação
      return _exhaustive
    }
  }
}
```

---

### A4 — Modais sem ESC / focus-trap / foco inicial

**O quê.** `AttachDocumentModal`, `AmendmentModal` e `DocumentPreviewModal` usam
`<div overlay onClick={onClose}>` + `<div role="dialog" aria-modal>`. Não fecham com **ESC**, não têm
**focus-trap** nem **foco inicial**, e o fundo não fica inerte.

**Por quê.** É **regressão de acessibilidade** frente ao padrão que já existe no repo: o `ConfirmDialog`
usa `<dialog>` nativo + `showModal()`, que entrega de graça focus-trap, ESC, `inert` no fundo, top-layer e
restauração de foco. (Constituição §X — acessibilidade; WAI-ARIA Dialog pattern.)

**Código atual** — `attach-document-modal.component.tsx:62-64` (mesmo shape nos outros 2)
```tsx
return (
  <div className={s.overlay} onClick={onClose}>                       {/* ❌ sem ESC, sem trap */}
    <div className={s.content} onClick={(e) => { e.stopPropagation() }}
         role="dialog" aria-modal="true">                            {/* ❌ sem aria-labelledby */}
```

**Padrão correto (já no repo)** — `supplier-detail/components/confirm-dialog.component.tsx:18-47`
```tsx
const ref = useRef<HTMLDialogElement>(null)
useEffect(() => {
  const el = ref.current
  if (el === null) return
  if (props.open && !el.open) el.showModal()                         // ✅ trap + ESC + inert + top-layer
  else if (!props.open && el.open) el.close()
}, [props.open])

return (
  <dialog ref={ref} aria-labelledby={titleId} aria-describedby={messageId}
    onCancel={(e) => { e.preventDefault(); props.onCancel() }}        // ✅ ESC roteado
    onClick={(e) => { if (e.target === ref.current) props.onCancel() }}>
```

**Código proposto.** Migrar os 3 modais para o padrão `<dialog>`+`showModal()` do `ConfirmDialog`
(idealmente extrair uma casca `<ModalShell>` reutilizável, DRY), associando `aria-labelledby` ao título
(usar `useId()`).

---

### A5 — Invalidação de cache global + ampla + em erro de negócio

**O quê.** Há **dupla** invalidação: o `mutationCache.onSuccess` global invalida **todas** as queries do
app sem filtro; e cada binding ainda faz um 2º `invalidateQueries(['contracts'])` por prefixo (que também
casa as *mutation keys*). Pior: como as mutations retornam `Result`, elas **resolvem "com sucesso" mesmo
no erro de negócio** — então um distrato que falhou ainda dispara a invalidação global.

**Por quê.** A doc do TanStack Query recomenda invalidar de forma **escopada** na ação do usuário, pela
`queryKey` específica. Invalidar tudo = refetch do app inteiro a cada mutation (inclui `['auth','me']`,
listas de outros módulos), desperdício e flicker.

**Código atual**
```ts
// app/query-client.ts:21-25
mutationCache: new MutationCache({
  onSuccess: () => {
    void queryClient.invalidateQueries()                     // ❌ invalida TUDO, sem filtro
  },
}),
```
```ts
// contract-attach-document/attach-signed-document.binding.ts:27-32 (idem nos outros 3 bindings)
onSuccess: (result) => {
  attachSignedDocumentViewModel.onSuccess(result)
  if (isOk(result)) {
    void queryClient.invalidateQueries({ queryKey: ['contracts'] })   // ❌ prefixo amplo + redundante
  }
},
```

**Código proposto.** Remover a invalidação global (ou torná-la escopada/condicionada a `isOk`) e manter
**só** a invalidação cirúrgica no binding, na key do detalhe + lista (reusando `contractDetailQueryKey`):
```ts
// app/query-client.ts — sem invalidação global "cega"
mutationCache: new MutationCache({ /* sem onSuccess global, ou com onError p/ telemetria */ }),
```
```ts
// binding — escopado e só em sucesso de negócio
import { contractDetailQueryKey } from '#modules/contracts/client/contract-detail/contract-detail.query.ts'

onSuccess: (result, vars) => {
  if (!isOk(result)) return                                  // ✅ erro de negócio não invalida
  void queryClient.invalidateQueries({ queryKey: contractDetailQueryKey(vars.contractId) })
  void queryClient.invalidateQueries({ queryKey: ['contracts', 'list'] })
},
```

---

### A6 — Paginação de colaboradores sem `placeholderData`

**O quê.** A `queryKey` inclui `page` (via `filters`); a cada troca de página a query vira `isPending` e a
tabela cai para o estado de loading, perdendo as linhas anteriores (flicker).

**Por quê.** A doc de *Paginated Queries* recomenda `placeholderData: keepPreviousData` exatamente para
esse caso — manter os dados anteriores enquanto a próxima página carrega.

**Código atual** — `src/modules/partners/client/collaborator-list/collaborator-list.query.ts:10-13`
```ts
export const collaboratorListQueryOptions = (input: CollaboratorListFilters) => ({
  queryKey: collaboratorListQueryKey(input),
  queryFn: () => collaboratorRepository.list(input),         // ❌ sem placeholderData
})
```

**Código proposto.**
```ts
import { keepPreviousData } from '@tanstack/react-query'

export const collaboratorListQueryOptions = (input: CollaboratorListFilters) => ({
  queryKey: collaboratorListQueryKey(input),
  queryFn: () => collaboratorRepository.list(input),
  placeholderData: keepPreviousData,                         // ✅ não zera a tabela ao paginar
  staleTime: 30_000,                                         // (ver M1)
})
```

---

### A7 — `endContractFn` sem `try/catch` (diverge das irmãs)

**O quê.** `attachSignedDocumentFn` e `attachAmendmentDocumentFn` envolvem o handler num `try/catch` que
converte exceção inesperada em `{ ok: false, error: 'server' }`. O `endContractFn` **não tem** esse guard.

**Por quê.** ADR-0002: a server-fn é borda — se `getCurrentUserFn`/`resolveAccessTokenFn` lançar (falha de
RPC interno/cookie/store), o erro vira rejeição crua fora do `switch` exaustivo, e a UI vê um erro genérico
não mapeável.

**Código atual** — `src/modules/contracts/server/adapters/server-fns/end-contract.service.fn.ts:20-30`
```ts
.handler(async ({ data }): Promise<EndContractFnResult> => {
  const user = await getCurrentUserFn()                      // ❌ pode lançar, sem catch
  if (user === null) return { ok: false, error: 'unauthorized' }
  const accessToken = await resolveAccessTokenFn()
  if (accessToken === null) return { ok: false, error: 'unauthorized' }
  const r = await contractsServer().endContract(data.contractId, accessToken)
  if (isErr(r)) return { ok: false, error: r.error }
  return { ok: true, data: r.value }
})
```

**Código proposto** — espelhar a irmã `attach-signed-document.service.fn.ts:17-48`
```ts
.handler(async ({ data }): Promise<EndContractFnResult> => {
  try {
    const user = await getCurrentUserFn()
    const accessToken = await resolveAccessTokenFn()
    if (user === null || accessToken === null) return { ok: false, error: 'unauthorized' }
    const r = await contractsServer().endContract(data.contractId, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  } catch (e) {
    console.error('[end-contract] erro inesperado:', e instanceof Error ? e.message : String(e))
    return { ok: false, error: 'server' }                    // ✅ converte exceção em Result na borda
  }
})
```

---

### A8 — String de UI hardcoded sem i18n

**O quê.** O estado de erro do detalhe renderiza o literal `"Erro ao carregar contrato"`. O catálogo
cresceu +59 linhas nesta branch, mas esta string ficou de fora.

**Por quê.** **Invariante do projeto:** *"Strings de UI = tags i18n, nunca literais."* (Constituição §X.)

**Código atual** — `src/modules/contracts/client/contract-detail/page/contract-detail.page.tsx:79-87`
```tsx
if (!data || !isOk(data)) {
  return (
    <div className={screen}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        Erro ao carregar contrato                            {/* ❌ literal sem i18n + style inline */}
      </div>
    </div>
  )
}
```

**Código proposto.**
```ts
// src/shared/i18n/catalog.pt-BR.ts
'contracts.detail.error.loading': 'Erro ao carregar contrato.',
```
```tsx
// page — usar a tag + classe do design system (sem style inline)
if (!data || !isOk(data)) {
  return <div className={screen}><div className={centered}>{t('contracts.detail.error.loading')}</div></div>
}
```

---

### D1 — *(Decisão de arquitetura)* `queryFn` nunca lança → cadeia 401→signOut não dispara

**O quê.** Os `queryFn` retornam `Promise<Result<…>>` — **sucesso sempre**, mesmo em erro. O
`queryCache.onError` só faz `signOut` quando `appError.kind === 'auth:expired'`; como o `queryFn` nunca
lança, um `unauthorized` vira `query.data = err('unauthorized')` e o usuário com **sessão expirada vê uma
mensagem de erro na tela em vez de ser redirecionado para /login**.

**Por quê.** A cadeia de erro documentada (AGENTS.md / `handbook/arquiteture.md`) prevê
`queryFn → throw QueryError(mapToAppError(...))`. **Importante:** isto **não foi introduzido por esta
branch** — é o padrão pré-existente do projeto (a feature-modelo `auth` também não lança). A branch apenas
**propaga** o padrão para detalhe de contrato, lista de colaboradores e distrato.

**Por isso é uma DECISÃO, não um fix mecânico.** Duas saídas — escolher uma e registrar:

```ts
// Opção A — alinhar ao doc: o queryFn lança no caminho 'unauthorized' p/ acionar o signOut central
queryFn: async () => {
  const r = await contractsRepository.getById(id)
  if (isErr(r) && r.error === 'unauthorized') {
    throw new QueryError(mapToAppError('unauthorized'))      // dispara queryCache.onError → signOut
  }
  return r
}
```
```text
Opção B — manter o padrão atual (Result no data) e registrar um ADR explicitando que a expiração de
sessão é tratada por outro mecanismo (ex.: guard de rota / refresh proativo), tornando o handler
'auth:expired' do queryCache deliberadamente restrito. Hoje esse handler é efetivamente código morto
para estas telas.
```

> **Ação:** levar ao dono da arquitetura antes de mudar em massa. Não decidi por você.

---

## 4. Achados MÉDIOS 🟡

### M1 — `staleTime` default 0 nas 3 queries novas
**Por quê.** Com `staleTime` 0, toda montagem/refoco refaz a query; somado a A5 (invalidação global), o
refetch fica agressivo. O projeto já usa `30_000`/`'static'` em outras queries.
**Atual:** `contract-detail.query.ts`, `contract-list.query.ts`, `collaborator-list.query.ts` — nenhum define `staleTime`.
**Proposto:** adicionar `staleTime: 30_000` (ou `'static'` para tabelas de referência) às `*QueryOptions`.

### M2 — Tipografia fora da escala de tokens (escala-fantasma)
**Por quê.** ADR-0007 (design system "só tokens"): há ~25 tamanhos crus (`0.6rem`, `0.625rem`, `1.625rem`…)
em `contract-detail.css.ts`. Passa no lint (que só barra px/hex/rgb), mas cria uma escala paralela ao DS.
**Proposto:** mapear para `vars.font.size.*`; onde a wireframe exige micro-tipografia, **propor tokens novos**
em `tokens.values.ts` (`font.size.xxs`, `font.size.micro`) e consumi-los. Idem para `letterSpacing` cru.

### M3 — Physical properties em vez de logical (quebra RTL)
**Por quê.** `contract-detail.css.ts` usa `paddingLeft/Right`, `marginLeft`, `left/right` (bottombar) —
regrediu vs as logical properties usadas no resto da branch (`collaborator-*`, `page-header`).
**Proposto:** `paddingInline`, `marginInlineStart`, `insetInlineStart/End`, `borderInlineStart`.

### M4 — Modais sem `prefers-reduced-motion`
**Por quê.** O padrão do projeto encerra todo `transition` com `@media (prefers-reduced-motion: reduce)`
(ver `input.css.ts:49-52`). Os 3 modais de contratos têm `transition`/`backdropFilter` sem a guarda.
**Proposto:** adicionar o bloco zerando `transitionDuration` em cada `style` animado.

### M5 — `octet-stream-fetch`: body de erro sem teto + listener
**Por quê.** Em `!response.ok`, `safeReadBody` faz `await r.text()` do corpo de erro **inteiro**, sem
limite. O `addEventListener('abort', …, { once: true })` (linha 47) já se auto-remove no abort, mas
permanece registrado se a request **completar sem abort** (vive enquanto o `signal` externo viver).
O **input** já é capado a 20 MiB na validação de borda, então o caminho de sucesso está protegido.
**Atual:** `external/core-api/octet-stream-fetch.ts:47,80`.
**Proposto:** ler no máx. N KB do corpo de erro; remover o listener no bloco final (`removeEventListener`)
para sinais de vida longa. Baixo risco — higiene de borda.

### M6 — `public-api` incompleto
**Por quê.** AGENTS.md: o `public-api` é *"o ÚNICO ponto de import externo"* e deve refletir a superfície
do módulo. Faltam `attachAmendmentDocumentFn` e `useAttachAmendmentDocumentBinding` (a page importa por
caminho profundo). Funciona (a `instance` importa direto), mas a superfície fica assimétrica.
**Atual:** `contracts/public-api/index.ts` exporta `attachSignedDocumentFn`/`endContractFn`, mas não o de aditivo.
**Proposto:**
```ts
export { attachAmendmentDocumentFn } from '#modules/contracts/server/adapters/server-fns/attach-amendment-document.service.fn.ts'
export { useAttachAmendmentDocumentBinding } from '#modules/contracts/client/amendment-create/attach-amendment-document.binding.ts'
```

### M7 — `Money.cents: z.int()` aceita negativo
**Por quê.** "Make illegal states unrepresentable": o valor de contrato é ≥ 0 (o próprio
`CreateContractInputSchema` usa `.positive()`). O response deveria espelhar.
**Atual:** `contracts.schema.ts:16` `const MoneyDtoSchema = z.object({ cents: z.int() })` (idem `contracts.model.ts` / `contracts.types.ts:25`).
**Proposto:** `z.object({ cents: z.int().nonnegative() })`.

### M8 — `formatDate` duplicado com bug de timezone
**Por quê.** Há 3 `formatDate`: `contract-aside` (UTC, **correto**), `domain/format.ts` (UTC, **correto**)
e `contract-timeline` (**sem** `timeZone:'UTC'` → recua 1 dia em BRT, **bug**).
**Atual:** `contract-timeline.component.tsx:19-21`
```ts
function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')                    // ❌ sem timeZone:'UTC'
}
```
**Proposto:** remover a função local e importar o helper puro:
```ts
import { formatDate } from '#modules/contracts/client/domain/format.ts'  // ✅ já trata UTC e Date|string
```

### M9 — Gap spec 017 US2 (criar contrato já com documento)
**Por quê.** A spec 017 define US2 ("incluir documento na criação → contrato Em Andamento"). A implementação
cobre criar→Pendente, depois anexar no detalhe (US1/US3), mas **não** o fluxo atômico de criação com doc.
**Proposto:** validar com o P.O. se US2 é MVP. Se for, adicionar modal de finalização no `contract-create`.

---

## 5. Achados BAIXOS 🟢 e ajuste defensivo

### B1 — `key={idx}` em timeline reordenada
`contract-timeline.component.tsx:55` — a lista é `[...events].reverse()` e cresce com aditivos; `key={idx}`
é instável. **Proposto:** key estável a partir do conteúdo (`a.id` para aditivos; `'created'`/`'signed'` para os fixos).

### B2 — Tipos manuais duplicando `z.infer`
`core-api-contracts.ts:199` (`apiContractToDomain`) e `:251` (`ContractorDto`) reescrevem à mão shapes que
`z.infer<typeof …Schema>` já fornece (`CoreApiContractListItem`, `CoreApiContractorSchema`). **Proposto:**
tipar via `z.infer` para eliminar drift.

### Bc — `email: z.email()` quebra a lista inteira por 1 registro legado *(ajuste defensivo recomendado)*
**O quê / Por quê.** O response da **lista de colaboradores** valida `email: z.email()`, mas o core-api
expõe `email: z.string()` (base com migração legada). Se 1 registro vier com e-mail malformado, o
`safeParse` falha e a **lista inteira** retorna `err('server')`.
**Atual** — `src/modules/partners/server/adapters/core-api/collaborator.schema.ts:9-17`
```ts
export const CoreApiCollaboratorItemSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  email: z.email(),                                          // ❌ 1 e-mail ruim derruba a lista
  // ...
})
```
**Proposto.** Afrouxar no **response** (a borda de entrada é tolerante; a validação estrita fica nos forms):
```ts
  email: z.string().trim(),                                  // ✅ alinha à frouxidão do core-api
  // ou: z.email().or(z.literal('')).catch('')  se quiser sinalizar inválido sem quebrar
```

---

## 6. Achados que CONTESTO (não tratar como dívida)

1. **"Imports cross-módulo violam ADR-0001 (CRÍTICO)"** — **Falso.** `contract-detail.page` importa de
   `amendment-create`/`contract-attach-document`/`contract-terminate` via `#modules/contracts/...`. São
   **submódulos do mesmo módulo** `contracts` — explicitamente permitido (AGENTS.md: *"cross-sublayer no
   mesmo módulo com `#modules/<m>/…`"*). O `eslint-plugin-boundaries` passou **verde**, confirmando.
   ADR-0001 trata de cross-**módulo** (contracts↔partners), que **não** ocorre aqui. *(Pode-se, por
   consistência, mover alguns símbolos para o `public-api` — ver M6 — mas não é violação.)*

2. **"Renomear `contract-attach-document/` (CRÍTICO)"** — é **preferência de nomenclatura**, não violação
   de ADR. No máximo 🟢 BAIXO.

---

## 7. Plano de ataque sugerido

1. **C1, C2, C3** — invariantes da constituição (pureza/SSR, fronteira de domínio, errors-as-values).
2. **A2 + A3** (fonte única de erro + guarda `never`) e **A5 + A6** (cache) — alto impacto, fix barato.
3. **A1 + A4 + A8** (MVVM + a11y + i18n) e **Bc** (robustez da lista).
4. **A7, M1, M6, M7, M8** — higiene rápida.
5. **D1** — *decisão* com o dono da arquitetura (não mecânico).
6. **M2–M4, M9, B1–B2** — limpeza incremental / produto.

> **Pós-UI:** como há mudança visual pesada em `contract-detail`, rodar `pnpm test:visual` antes do merge
> (e regenerar baseline `-linux` se a mudança for intencional/aprovada). Ver `.claude/guides/visual-testing.md`.

---

## Apêndice A — Citações canônicas (MCP `acdg-skills`, verificadas)

> Todas extraídas com `skills_citar` + `verificarTerms` (GROUNDING OK — sem alucinação).

**A.1 — Martin Fowler, _Refactoring_, p.68 — "DUPLICATED CODE"** *(fundamenta A2)*
> "If you see the same code structure in more than one place, you can be sure that your program will be
> better if you find a way to unify them. Duplication means that every time you read these copies, you need
> to read them carefully to see if there's any difference. If you need to change the duplicated code, you
> have to find and catch each duplication."

**A.2 — Martin Fowler, _Refactoring_, p.343 — Command-Query Separation** *(fundamenta C1, A1)*
> "When I have a function that gives me a value and has no observable side effects, I have a very valuable
> thing… A good rule to follow is that any function that returns a value should not have observable side
> effects — the command-query separation."

**A.3 — Eric Evans, _Domain-Driven Design_, p.59 — "The Pitfalls of Infrastructure-Driven Packaging"** *(fundamenta C2)*
> "An example of a very useful framework standard is the enforcement of LAYERED ARCHITECTURE by placing
> infrastructure and user interface code into separate groups of packages, leaving the domain layer
> physically separated into its own set of packages."

**A.4 — Robert C. Martin, _Código Limpo_, p.48 — "Tratamento de erro é uma coisa só"** *(fundamenta C3, A7)*
> "As funções devem fazer uma coisa só. Tratamento de erro é uma coisa só. Portanto, uma função que trata
> de erros não deve fazer mais nada."

---

## Apêndice B — Metodologia

- **Gates:** `pnpm typecheck` (exit 0), `pnpm lint` / ESLint MCP (exit 0), `pnpm test:all` (exit 0).
- **8 subagentes especialistas:** React 19/MVVM, TypeScript estrito, Zod 4, TanStack Query, TanStack
  Start/BFF, CSS vanilla-extract, core-api (paridade de contrato), arquitetura/ADRs.
- **MCP `core-api`:** paridade dos 5 fluxos validada contra `origin/dev` — gaps restantes (distrato rico,
  conteúdo/URL de documento, doc↔aditivo) são **pendências de backend já registradas em tickets**; o BFF
  degrada honestamente (`url:''`, sem mock — ADR-0011).
- **MCP `acdg-skills`:** 4 citações canônicas verificadas (Apêndice A).
- **Cânone consultado:** `.specify/memory/constitution.md` (§I–XII), ADR-0001/0002/0004/0007/0009/0010/0012,
  `src/modules/auth/README.md` (feature-modelo).
