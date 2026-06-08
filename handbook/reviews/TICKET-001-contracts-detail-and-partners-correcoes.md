# TICKET-001 — Correções do code-review `feat/contracts-detail-and-partners`

> **Tipo:** dívida técnica / qualidade · **Branch de origem:** `review/contracts-detail-hardening`
> **Branch a corrigir:** `feat/contracts-detail-and-partners` · **PR alvo:** `develop`
> **Relatório completo (o "porquê" + citações canônicas):**
> [`2026-06-08-code-review-contracts-detail-and-partners.md`](./2026-06-08-code-review-contracts-detail-and-partners.md)

---

## Como usar este ticket

Este ticket **não corrige o código** — ele entrega ao desenvolvedor:

1. **A explicação tim-tim de cada erro** (o quê, por quê, código atual, como corrigir).
2. **Testes de regressão que FALHAM hoje de propósito** (🔴 vermelho) e passam (🟢) quando você corrigir. Eles são a sua rede de segurança.
3. **Regras de lint (hardening)** prontas para colar no `eslint.config.js`, para o bug **nunca voltar**.

### Fluxo de trabalho do dev (TDD reverso)

```bash
# 1. Veja a régua vermelha (a dívida):
pnpm test            # node:test — governança + unit
pnpm test:dom        # vitest — DOM/a11y

# 2. Pegue um achado (ex.: C1), leia a seção, aplique a correção.
# 3. Rode de novo: o teste daquele achado deve VIRAR VERDE.
# 4. (Hardening) cole a regra de lint da seção e rode `pnpm lint` — não pode quebrar.
# 5. Repita. No fim: pnpm verify deve passar 100%.
```

> ⚠️ **Esta branch deixa a suíte propositalmente vermelha.** É o sinal da dívida. Não faça merge
> desta branch em `develop` — ela é o "mapa de correção". As correções vão na
> `feat/contracts-detail-and-partners`, e os testes/regras de hardening migram junto.

### Mapa: achado → arquivo de teste de regressão

| Tipo | Arquivo |
|---|---|
| Governança (scan de fonte, `node:test`) | `tests/architecture/regression-contracts-partners-review.test.ts` |
| Unit (`node:test`) | `tests/modules/contracts/server/adapters/core-api-contracts.regression.test.ts` |
| Unit (`node:test`) | `tests/modules/partners/server/adapters/collaborator-schema.regression.test.ts` |
| DOM/a11y (`vitest`) | `tests/modules/contracts/client/ui/attach-document-modal.regression.spec.tsx` |

---

## Índice de achados

| # | Sev | Título | Teste de regressão |
|---|-----|--------|--------------------|
| [C1](#c1) | 🔴 | `new Date()` no render | governança `c1-*` |
| [C2](#c2) | 🔴 | Zod na camada `domain/` | governança `c2-*` |
| [C3](#c3) | 🔴 | `throw` nos mappers (errors-as-values) | unit `c3-*` |
| [A1](#a1) | 🟠 | Page orquestra modais via `command.result` | governança `a1-*` |
| [A2](#a2) | 🟠 | `ContractsError` triplicada | governança `a2-*` |
| [A3](#a3) | 🟠 | `switch` sem guarda `never` | governança `a3-*` |
| [A4](#a4) | 🟠 | Modais sem ESC/focus-trap | DOM `a4-*` |
| [A5](#a5) | 🟠 | Invalidação de cache global/ampla | governança `a5-*` |
| [A6](#a6) | 🟠 | Paginação sem `placeholderData` | governança `a6-*` |
| [A7](#a7) | 🟠 | `endContractFn` sem `try/catch` | governança `a7-*` |
| [A8](#a8) | 🟠 | String de UI hardcoded | governança `a8-*` |
| [D1](#d1) | 🟠 | *(decisão)* `queryFn` não lança → 401 não desloga | — (decisão) |
| [M1](#m1) | 🟡 | `staleTime` default 0 | governança `m1-*` |
| [M2](#m2) | 🟡 | Tipografia fora dos tokens | (manual / hardening) |
| [M3](#m3) | 🟡 | Physical properties (RTL) | governança `m3-*` |
| [M4](#m4) | 🟡 | Modais sem `prefers-reduced-motion` | governança `m4-*` |
| [M5](#m5) | 🟡 | `octet-stream-fetch` listener/body | governança `m5-*` |
| [M6](#m6) | 🟡 | `public-api` incompleto | governança `m6-*` |
| [M7](#m7) | 🟡 | `Money.cents` aceita negativo | unit `m7-*` |
| [M8](#m8) | 🟡 | `formatDate` duplicado (bug TZ) | governança `m8-*` |
| [M9](#m9) | 🟡 | *(produto)* gap spec 017 US2 | — (decisão) |
| [B1](#b1) | 🟢 | `key={idx}` em lista reordenada | governança `b1-*` |
| [B2](#b2) | 🟢 | Tipos manuais vs `z.infer` | (manual) |
| [Bc](#bc) | 🟢 | `email: z.email()` derruba a lista | unit `bc-*` |

---

<a id="c1"></a>
## 🔴 C1 — `new Date()` no corpo do render

**Arquivo:** `src/modules/contracts/client/contract-detail/components/contract-aside.component.tsx:58`

**🐞 O erro.** O componente lê o relógio (`new Date()`) **durante o render** e usa o valor para calcular
a barra de vigência. Render de componente tem que ser **puro e SSR-safe**: ler o relógio torna o output
não-determinístico → o HTML do servidor diverge do da hidratação (**hydration mismatch**).

**🎯 Por quê.** Constituição §XI ("render MUST ser puro, sem `Date.now`/`new Date` no corpo"). Fundamento
canônico: Fowler, *Refactoring* p.343 (Command-Query Separation) — ver Apêndice A.2 do relatório.
**Por que o lint não pegou:** a regra `react-hooks/purity` **está ligada** mas tem um gap — flagra
`Date.now()`/`Math.random()` mas **não o construtor `new Date()`** (provado no relatório, §"hardening").

**❌ Atual**
```tsx
const today = new Date()
const elapsedDays = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / 86_400_000))
const progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / 86_400_000)
```

**✅ Como corrigir.** Tirar o "agora" do render. Derivar a vigência numa função pura que recebe `now`,
chamada na view-model/binding, e passar o resultado por prop (`ContractAside` recebe `vigencia`).
```tsx
// contract-detail.view-model.ts (puro, testável)
export function deriveVigencia(contract: Contract, now: Date) { /* …usa now como argumento… */ }
// ContractAside passa a receber `vigencia` por prop — render 100% puro.
```

**🧪 Teste de regressão:** `regression-...review.test.ts` → `c1-new-date-no-render`
Faz scan e assert que `contract-aside.component.tsx` **não contém** `new Date(` no corpo do componente.

**🛡️ Hardening (regra de lint):** ver [§Regras de lint](#regras) — selector `NewExpression[callee.name='Date']`
nas views/núcleo agnóstico. Fecha o gap do `purity`.

---

<a id="c2"></a>
## 🔴 C2 — Zod importado na camada `domain/`

**Arquivo:** `src/modules/contracts/server/domain/contracts.types.ts:5`

**🐞 O erro.** `server/domain/` faz `import * as z from 'zod'` e define ~13 schemas. O domínio passou a
depender de uma lib de **infraestrutura de validação**.

**🎯 Por quê.** Boundary do projeto: domínio/application **nunca** importam Zod (validação de borda vive em
`adapters/`). Canônico: Evans, *DDD* p.59 — "deixar a camada de domínio fisicamente separada"
(Apêndice A.3). **Por que o lint não pegou:** `eslint-plugin-boundaries` governa as **camadas internas**,
não restringe import de **pacote externo** (`zod`).

**✅ Como corrigir.**
1. Criar `server/adapters/contracts-input.schema.ts` e mover **todos** os schemas Zod para lá.
2. Em `server/domain/contracts.types.ts` deixar **só tipos puros** (`export type ContractStatus = 'Pendente' | …`).
3. Apontar as server-fns que importavam os schemas do domínio para o novo adapter.

**🧪 Teste de regressão:** `c2-zod-fora-do-domain` — scan que assert que **nenhum** arquivo em
`src/modules/*/server/domain/**` contém `from 'zod'`.

**🛡️ Hardening:** `no-restricted-imports` de `zod` em `server/**/domain/**` e `client/**/domain/**` (ver §Regras).

---

<a id="c3"></a>
## 🔴 C3 — `safeParse → throw new Error` nos mappers

**Arquivo:** `src/modules/contracts/server/adapters/core-api/core-api-contracts.ts` (linhas 297, 319, 350, 507, 568)

**🐞 O erro.** Os mappers de response fazem `safeParse` e, na falha, **lançam exceção**. Só não explode
porque os call-sites embrulham em `try/catch`. Mistura mapeamento de dados com tratamento de erro.

**🎯 Por quê.** ADR-0002 (errors-as-values): `throw` só na borda, convertido para `Result`. Canônico:
Uncle Bob, *Código Limpo* p.48 ("tratamento de erro é uma coisa só" — Apêndice A.4). O lado de
colaboradores já faz certo (`if (!parsed.success) return err('server')`).

**❌ Atual**
```ts
const parsed = CoreApiContractDetailSchema.safeParse(raw)
if (!parsed.success) { /* … */ throw new Error(`[contracts] resposta inválida: ${parsed.error.message}`) }
```

**✅ Como corrigir.** Mappers retornam `Result<T, ContractsError>`; call-site faz `if (isErr(...))`.
Remover os `try/catch` redundantes.
```ts
export const apiContractDetailToDomain = (raw: unknown): Result<Contract, ContractsError> => {
  const parsed = CoreApiContractDetailSchema.safeParse(raw)
  if (!parsed.success) { /* fallback list… */ return err('server') }
  return ok({ /* … */ })
}
```

**🧪 Teste de regressão:** `core-api-contracts.regression.test.ts` → `c3-mapper-nao-lanca`
Chama `apiContractDetailToDomain(<inválido>)` e assert que **não lança** (hoje lança → 🔴).

---

<a id="a1"></a>
## 🟠 A1 — Page orquestra 4 modais via `command.result`

**Arquivo:** `src/modules/contracts/client/contract-detail/page/contract-detail.page.tsx:54-67`

**🐞 O erro.** A page (view burra) mistura **UI-state** (`attachOpen`, `selectedAmendment`) com
**server-state** (`command.result`) para decidir abrir/fechar modais:
```tsx
const amendmentModalOpen = amendmentOpen && amendmentCommand.result === null && endCommand.result === null
```

**🎯 Por quê.** §XI: view só pode ter `useState` de apresentação pura; orquestração vai na ViewModel, e
server-state **não** se mistura com UI-state. CQS (Fowler) — usa resultado de comando como query.

**✅ Como corrigir.** Extrair a derivação dos modais para `contract-detail.view-model.ts` (função pura)
+ um binding que injeta UI-state e devolve `{ attach:{open,close}, create:{open,close}, … }`. A page só consome.

**🧪 Teste de regressão:** `a1-page-nao-deriva-de-command-result` — scan que assert que
`contract-detail.page.tsx` **não contém** `command.result === null` (a derivação saiu para a view-model).

---

<a id="a2"></a>
## 🟠 A2 — `ContractsError` triplicada

**Arquivos:** `server/domain/errors/contracts.errors.ts:5` · `server/adapters/contracts-shared.types.ts:8` · `client/data/repository/contracts.repository.ts:18`

**🐞 O erro.** A mesma união de 17 literais é **copiada em 3 lugares** e os schemas correlatos já
**divergem** (server `z.coerce.date()`/`z.string().trim()` vs client `z.date()`/`z.uuid()`).

**🎯 Por quê.** Fonte única de verdade (Fowler, *Refactoring* p.68 — DUPLICATED CODE, Apêndice A.1).

**✅ Como corrigir.** Manter **uma** definição em `contracts-shared.types.ts` (a fronteira `adapters`, que o
client-data já importa) e nos outros dois: `export type { ContractsError } from '…/contracts-shared.types.ts'`.

> ⚠️ **Ao corrigir, SUBSTITUA o teste existente** `tests/architecture/contracts-error-in-sync.test.ts`
> (ele hoje EXIGE as 3 cópias sincronizadas — fica obsoleto). O novo teste `a2-*` já cobre a fonte única.

**🧪 Teste de regressão:** `a2-contracts-error-fonte-unica` — assert que `contracts.repository.ts` e
`contracts.errors.ts` **reexportam** (`export type { ContractsError } from`) em vez de redefinir a união.

---

<a id="a3"></a>
## 🟠 A3 — `switch` sem guarda de exaustividade `never`

**Arquivo:** `src/modules/contracts/client/data/helpers/contracts-error-tag.ts:7-43`

**🐞 O erro.** Cobre os 17 casos, mas sem `default: { const _: never = e; return _ }`. Hoje a regra
`switch-exhaustiveness-check` está satisfeita (todos os casos presentes), mas **remover** um caso degrada o
retorno para `string | undefined` em silêncio.

**✅ Como corrigir.**
```ts
default: { const _exhaustive: never = e; return _exhaustive }
```

**🧪 Teste de regressão:** `a3-switch-guarda-never` — assert que `contracts-error-tag.ts` contém `: never`.

---

<a id="a4"></a>
## 🟠 A4 — Modais sem ESC / focus-trap / foco inicial

**Arquivos:** `attach-document-modal.component.tsx`, `amendment-modal.component.tsx`, `document-preview-modal.component.tsx`

**🐞 O erro.** Usam `<div role="dialog">` + clique no overlay. **Não fecham com ESC**, não têm focus-trap
nem foco inicial. Regressão de a11y frente ao `ConfirmDialog` (que usa `<dialog>`+`showModal()`).

**🎯 Por quê.** Constituição §X (a11y) + WAI-ARIA Dialog pattern. O `ConfirmDialog`
(`supplier-detail/components/confirm-dialog.component.tsx`) é o padrão correto **já no repo**.

**✅ Como corrigir.** Migrar os 3 modais para `<dialog>`+`showModal()` (idealmente extrair `<ModalShell>`),
com `aria-labelledby` no título e ESC roteado por `onCancel`.

**🧪 Teste de regressão:** `attach-document-modal.regression.spec.tsx` →
`a4-modal-fecha-no-esc` (dispara `keydown Escape` e espera `onClose`) e `a4-modal-tem-aria-labelledby`.
Hoje 🔴 (o overlay div não responde a ESC).

---

<a id="a5"></a>
## 🟠 A5 — Invalidação de cache global + ampla

**Arquivos:** `src/app/query-client.ts:22` + bindings `amendment-create`, `attach-amendment-document`, `attach-signed-document`, `end-contract`

**🐞 O erro.** `mutationCache.onSuccess` faz `invalidateQueries()` **sem filtro** (invalida o app inteiro),
e cada binding ainda invalida `['contracts']` por prefixo. Como as mutations retornam `Result`, isso dispara
**mesmo em erro de negócio**.

**✅ Como corrigir.** Remover a invalidação global (ou condicioná-la a `isOk`) e invalidar **cirurgicamente**
no binding: `contractDetailQueryKey(vars.contractId)` + `['contracts','list']`, só quando `isOk(result)`.

**🧪 Teste de regressão:** `a5-sem-invalidacao-global` — assert que `query-client.ts` **não** contém
`invalidateQueries()` sem argumento; e `a5-binding-invalidacao-escopada` — assert que os bindings não usam
`invalidateQueries({ queryKey: ['contracts'] })` cru (devem usar a key do detalhe).

---

<a id="a6"></a>
## 🟠 A6 — Paginação sem `placeholderData`

**Arquivo:** `src/modules/partners/client/collaborator-list/collaborator-list.query.ts:10`

**🐞 O erro.** `page` está na queryKey → a cada troca de página a tabela cai para loading e perde as linhas.

**✅ Como corrigir.**
```ts
import { keepPreviousData } from '@tanstack/react-query'
// nas options:
placeholderData: keepPreviousData,
```

**🧪 Teste de regressão:** `a6-paginacao-placeholderdata` — assert que `collaborator-list.query.ts` contém `placeholderData`.

---

<a id="a7"></a>
## 🟠 A7 — `endContractFn` sem `try/catch`

**Arquivo:** `src/modules/contracts/server/adapters/server-fns/end-contract.service.fn.ts:20`

**🐞 O erro.** Diverge das fns irmãs: se `getCurrentUserFn`/`resolveAccessTokenFn` lançar, vira rejeição
crua de RPC fora do `switch` exaustivo (ADR-0002).

**✅ Como corrigir.** Envolver o corpo do handler num `try/catch` → `{ ok: false, error: 'server' }`
(espelhar `attach-signed-document.service.fn.ts`).

**🧪 Teste de regressão:** `a7-end-contract-try-catch` — assert que `end-contract.service.fn.ts` contém `try`.

---

<a id="a8"></a>
## 🟠 A8 — String de UI hardcoded

**Arquivo:** `src/modules/contracts/client/contract-detail/page/contract-detail.page.tsx:83`

**🐞 O erro.** Renderiza o literal `"Erro ao carregar contrato"` (+ `style` inline) em vez de tag i18n.

**🎯 Por quê.** §X: strings de UI = tags i18n. **Por que o lint não pegou:** não há regra
`no-literal-string`/i18next configurada.

**✅ Como corrigir.** Adicionar `'contracts.detail.error.loading'` ao `catalog.pt-BR.ts` e usar `t(...)`.

**🧪 Teste de regressão:** `a8-sem-literal-erro-carregar` — assert que `contract-detail.page.tsx`
**não contém** o literal `Erro ao carregar contrato`.

**🛡️ Hardening:** `eslint-plugin-i18next/no-literal-string` escopado às views (ver §Regras).

---

<a id="d1"></a>
## 🟠 D1 — *(DECISÃO)* `queryFn` não lança → cadeia 401→signOut não dispara

**Arquivos:** queries de contracts/partners + `src/app/query-client.ts:14`

**🐞 O sintoma.** Os `queryFn` retornam `Result` (sucesso sempre). Um `unauthorized` vira `query.data =
err('unauthorized')` e o usuário com **sessão expirada vê erro na tela em vez de ir para /login** — o
handler `auth:expired` do `queryCache` é código morto para essas telas.

**⚖️ É uma DECISÃO, não um fix mecânico** (o padrão é pré-existente do projeto, herdado da feature `auth`).
Escolher e registrar em ADR:
- **Opção A** — alinhar ao doc: `queryFn` lança `QueryError(mapToAppError('unauthorized'))` no caminho 401 → aciona o signOut central.
- **Opção B** — manter `Result` no data e registrar ADR de que a expiração é tratada por outro mecanismo (guard de rota / refresh), tornando o handler `auth:expired` deliberadamente restrito.

**Ação:** levar ao dono da arquitetura. **Sem teste automatizado** até a decisão (a opção escolhida define o teste).

---

<a id="m1"></a>
## 🟡 M1 — `staleTime` default 0

**Arquivos:** `contract-detail.query.ts`, `contract-list.query.ts`, `collaborator-list.query.ts`
**🐞** Refetch agressivo (somado a A5). **✅** Adicionar `staleTime: 30_000` (ou `'static'`) às options.
**🧪** `m1-querytime-definido` — assert que as 3 query options contêm `staleTime`.

---

<a id="m2"></a>
## 🟡 M2 — Tipografia fora dos tokens

**Arquivo:** `src/modules/contracts/client/contract-detail/page/contract-detail.css.ts`
**🐞** ~25 tamanhos crus (`0.6rem`…`1.625rem`) — escala-fantasma fora de `vars.font.size.*`.
**✅** Mapear p/ tokens; onde a wireframe exige micro-tipografia, **propor tokens novos** (`font.size.xxs`).
**🧪** Sem teste automatizado forte (o lint só barra px/hex/rgb). **Hardening opcional:** estender a regra
tokens-only para `rem` fora de allowlist — porém alto risco de falso-positivo; **revisar manualmente**.

---

<a id="m3"></a>
## 🟡 M3 — Physical properties (quebra RTL)

**Arquivo:** `contract-detail.css.ts`
**🐞** `paddingLeft/Right`, `marginLeft`, `left/right` (bottombar) — regrediu vs logical properties do resto da branch.
**✅** `paddingInline`, `marginInlineStart`, `insetInlineStart/End`, `borderInlineStart`.
**🧪** `m3-sem-physical-properties` — assert que `contract-detail.css.ts` não contém `paddingLeft`/`marginLeft`.
**🛡️ Hardening:** estender a regra tokens-only com selectors contra propriedades físicas (ver §Regras).

---

<a id="m4"></a>
## 🟡 M4 — Modais sem `prefers-reduced-motion`

**Arquivos:** `amendment-modal.css.ts`, `attach-document-modal.css.ts`, `document-preview-modal.css.ts`
**🐞** `transition`/`backdropFilter` sem a guarda de movimento que o resto da branch tem (ex.: `input.css.ts`).
**✅** Adicionar `'@media': { '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' } }`.
**🧪** `m4-modais-reduced-motion` — assert que os 3 `*-modal.css.ts` contêm `prefers-reduced-motion`.

---

<a id="m5"></a>
## 🟡 M5 — `octet-stream-fetch`: listener + body de erro

**Arquivo:** `src/external/core-api/octet-stream-fetch.ts:47,80`
**🐞** Listener `abort` (com `{ once:true }`, auto-removido no abort) fica registrado se a request completar
sem abort; e o body de erro é lido inteiro (`r.text()`) sem teto.
**✅** Remover o listener no bloco final (`removeEventListener`); ler no máx. N KB do corpo de erro.
**🧪** `m5-octet-cleanup` — assert que o arquivo contém `removeEventListener` (sinal do cleanup explícito).

---

<a id="m6"></a>
## 🟡 M6 — `public-api` incompleto

**Arquivo:** `src/modules/contracts/public-api/index.ts`
**🐞** Faltam `attachAmendmentDocumentFn` e `useAttachAmendmentDocumentBinding` (a page importa por caminho profundo).
**✅** Reexportar ambos no `public-api`.
**🧪** `m6-public-api-completo` — assert que o `index.ts` exporta `attachAmendmentDocumentFn`.

---

<a id="m7"></a>
## 🟡 M7 — `Money.cents` aceita negativo

**Arquivos:** `server/adapters/core-api/contracts.schema.ts:16`, `server/domain/contracts.types.ts:25`, `client/data/model/contracts.model.ts`
**🐞** `z.object({ cents: z.int() })` aceita centavos negativos; valor de contrato é ≥ 0.
**✅** `cents: z.int().nonnegative()`.
**🧪** `core-api-contracts.regression.test.ts` → `m7-money-rejeita-negativo` — `MoneySchema.safeParse({cents:-1})`
deve falhar (hoje passa → 🔴).

---

<a id="m8"></a>
## 🟡 M8 — `formatDate` duplicado (bug de timezone)

**Arquivo:** `src/modules/contracts/client/contract-detail/components/contract-timeline.component.tsx:19`
**🐞** `formatDate` local **sem** `timeZone:'UTC'` → recua 1 dia em BRT. Há versão correta em `domain/format.ts`.
**✅** Remover a função local e `import { formatDate } from '#modules/contracts/client/domain/format.ts'`.
**🧪** `m8-timeline-usa-format-do-domain` — assert que `contract-timeline.component.tsx` importa `format.ts`
e **não** define `formatDate` local.

---

<a id="m9"></a>
## 🟡 M9 — *(PRODUTO)* gap spec 017 US2

**🐞** A spec 017 define US2 ("criar contrato já com documento → Em Andamento"), mas só há criar→Pendente +
anexar no detalhe. **Ação:** validar com o P.O. se US2 é MVP. **Sem teste** até a decisão de produto.

---

<a id="b1"></a>
## 🟢 B1 — `key={idx}` em lista reordenada

**Arquivo:** `src/modules/contracts/client/contract-detail/components/contract-timeline.component.tsx:55`
**🐞** Lista é `[...events].reverse()` e cresce → `key={idx}` é instável.
**✅** Key estável (`a.id` p/ aditivos; `'created'`/`'signed'` p/ os fixos).
**🧪** `b1-timeline-sem-key-index` — assert que o arquivo não contém `key={idx}`.

---

<a id="b2"></a>
## 🟢 B2 — Tipos manuais vs `z.infer`

**Arquivo:** `src/modules/contracts/server/adapters/core-api/core-api-contracts.ts:199,251`
**🐞** `apiContractToDomain` e `ContractorDto` reescrevem à mão shapes que `z.infer<typeof …>` já dá.
**✅** Tipar via `z.infer<typeof CoreApiContractListItemSchema>` / `CoreApiContractorSchema`.
**🧪** Sem teste automatizado (heurística frágil). **Revisar manualmente.**

---

<a id="bc"></a>
## 🟢 Bc — `email: z.email()` derruba a lista por 1 registro legado

**Arquivo:** `src/modules/partners/server/adapters/core-api/collaborator.schema.ts:12`
**🐞** O response da lista valida `email: z.email()`, mas o core-api expõe `z.string()` (base legada). 1 e-mail
malformado faz o `safeParse` falhar e a **lista inteira** vira `err('server')`.
**✅** `email: z.string().trim()` no schema do **response** (validação estrita fica nos forms).
**🧪** `collaborator-schema.regression.test.ts` → `bc-email-legado-nao-derruba` —
`CoreApiCollaboratorItemSchema.safeParse({…, email:'invalido'})` deve ter `success===true` (hoje `false` → 🔴).

---

<a id="regras"></a>
## 🛡️ Hardening — regras de lint para colar no `eslint.config.js`

> Ative cada regra **junto** da correção do achado correspondente (senão o `pnpm lint` fica vermelho).
> O teste de governança correspondente já prova que a regra é necessária hoje.

### H1 — Anti `new Date()` no render (fecha C1)
No bloco das views burras (`*.page.tsx`/`*.component.tsx`) e no núcleo agnóstico, adicionar ao `no-restricted-syntax`:
```js
{ selector: "NewExpression[callee.name='Date']:not([arguments.length>0])", message: 'Relógio no render quebra pureza/SSR (§XI). Receba `now`/data derivada por prop da ViewModel.' },
```

### H2 — i18n: sem literal de UI (fecha A8)
```js
// import i18next from 'eslint-plugin-i18next'
{
  files: ['src/modules/*/client/**/*.{page,component}.tsx'],
  plugins: { i18next },
  rules: { 'i18next/no-literal-string': ['error', { mode: 'jsx-text-only' }] },
}
```
> ⚠️ Pode surfacear literais **pré-existentes** em outras telas. Escopar/limpar incrementalmente.

### H3 — Zod fora do domínio (fecha C2)
```js
{
  files: ['src/modules/*/server/domain/**/*.ts', 'src/modules/*/client/domain/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', { paths: [{ name: 'zod', message: 'Domínio é puro (DDD/Evans p.59). Schemas Zod vivem em adapters/.' }] }],
  },
}
```

### H4 — CSS physical properties (fecha M3)
No bloco do design system (`*.css.ts`), adicionar ao `no-restricted-syntax`:
```js
{ selector: "Property[key.name=/^(paddingLeft|paddingRight|marginLeft|marginRight|left|right|borderLeft|borderRight)$/]", message: 'Use logical properties (paddingInline/marginInlineStart/insetInlineStart) — RTL-safe.' },
```

### H5 — Invalidação de cache cega (fecha A5)
```js
{ selector: "CallExpression[callee.property.name='invalidateQueries'][arguments.length=0]", message: 'invalidateQueries() sem escopo invalida o app inteiro. Passe { queryKey }.' },
```

---

## ✅ Checklist de aceite (Definition of Done)

- [ ] Todos os achados 🔴 e 🟠 corrigidos; seus testes de regressão **verdes**.
- [ ] Achados 🟡/🟢 corrigidos ou explicitamente adiados com justificativa.
- [ ] D1 e M9 **decididos** (ADR / P.O.) e registrados.
- [ ] As 5 regras de hardening (H1–H5) ativas no `eslint.config.js`.
- [ ] `tests/architecture/contracts-error-in-sync.test.ts` substituído (ver A2).
- [ ] `pnpm verify` (typecheck + lint + test) **100% verde**.
- [ ] `pnpm test:dom` verde.
- [ ] `pnpm test:visual` rodado (mudança visual em `contract-detail` — baseline `-linux` se intencional).

---

## Apêndice — por que a tooling não pegou (resumo)

| Camada | Estado | Consequência |
|---|---|---|
| ESLint | rodou ✅ verde | cobertura: a maioria dos achados é classe **sem regra** (i18n, zod-no-domain, invalidação, rem/physical, duplicação). C1 caiu em **gap da regra `purity`** (`new Date()` não coberto). |
| Hooks | só do Claude Code, nesta máquina | `eslint-fix` não bloqueia; `verify-gate` é lembrete (gate real só com `CLAUDE_VERIFY_GATE=1`). **Sem git hook** (husky/lint-staged ausentes). |
| Prettier | **inexistente** | sem formatação enforçada. |
| CI | `deploy-qa.yml` só build+deploy | **não roda lint/typecheck/test**; dispara em push na `develop`, não em PR. |

> O gate real (husky+lint-staged + CI em PR + Prettier) é tratado como item separado de infraestrutura —
> ver tasks da branch `review/contracts-detail-hardening`.
