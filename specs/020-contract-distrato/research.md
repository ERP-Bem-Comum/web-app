# Research: Distrato aderente ao #32

Investigação concluída lendo o código real do front (módulo `contracts`) e do core-api no branch `dev` (#32 mergeado). Todas as NEEDS CLARIFICATION resolvidas.

## Achados de código (mapa do fluxo atual)

### Front — gatilho do distrato (`contract-detail.page.tsx`)
Dois caminhos disparam o encerramento hoje, ambos chamando `endCommand.execute(contractId)` **sem** dados:
1. **Create-with-attach** (efeito `homologateChained`, L119–128): ao criar um aditivo com anexo pendente, faz `amendmentAttachCommand.execute(...)` e, se `isDistrato`, `endCommand.execute(contractId)`. O estado guardado (`pendingAmendmentAttach`) carrega só `{ file, signedAt, isDistrato }`.
2. **Attach-pending** (`onAttach` do AmendmentModal, L313–318): homologa um aditivo Pendente e, se `selectedAmendment?.type === 'distrato'`, `endCommand.execute(contractId)`.

### Front — o modal de aditivo JÁ captura tudo (`amendment-form.controller.ts`)
O estado do form (`AmendmentFormState`) tem: `description`, **`terminationDate`** (campo dedicado "data efetiva do distrato", L17), `signedAt` e `file` (via `AmendmentAttach`). `canSubmit` (modal, L101) **já exige** `terminationDate` para distrato. Ou seja: **motivo (description), data efetiva (terminationDate) e documento (file+signedAt) já são coletados na UI** — só não chegam ao `/end`.

### Front — cadeia BFF do `end` (a religar)
- `end-contract.service.fn.ts`: `EndContractFnInputSchema = z.object({ contractId: z.uuid() })` → cresce.
- `end-contract.use-case.ts`: só repassa `client.endContract(contractId, token)` → vira upload→end.
- `core-api-contracts.ts` `endContract` (L666): body fixo `{ kind:'Terminate' }` → `{ kind:'Terminate', terminatedAt, reason }`. `uploadDocument` (L606) hardcoda `categoria:'signed_contract'` → precisa de um irmão `signed_termination`.
- `statusApiToDomain` (L98): `Terminated → 'Distrato'` **já existe** → o reflexo no detalhe/grid é automático após invalidação.

### Padrão gêmeo a espelhar (`attach-signed-document.use-case.ts`)
`uploadDocument(signed_contract) → activate`, idempotente em `document-conflict`. O distrato é o **mesmo shape**: `uploadDocument(signed_termination) → end`.

### Core-api (#32, `dev`) — contrato confirmado
- `endContractBodySchema` (schemas.ts L222): discriminated union; `Terminate` exige `terminatedAt: string().min(1)` + `reason: string().min(1)`.
- `end-contract.ts` (use-case L99–114): valida `terminatedAt` data válida e **não-futura** (vs `clock.now()`) → `terminate-invalid-date`; exige documento `categoria==='signed_termination' && status==='Active'` vinculado ao **Contract** → `terminate-no-signed-document`.
- `DOCUMENT_CATEGORIES` inclui `signed_termination`; `uploadDocumentQuerySchema` (doc de contrato) **não** exige `signedAt` (diferente do doc de aditivo).
- `sendDomainError`→`toErrorEnvelope(code, code, …)`: o `error.code` do envelope = a string do erro (`'terminate-no-signed-document'`, `'terminate-invalid-date'`). Ambos **422**.

## D1 (CENTRAL) — Mecanismo: reaproveitar o aditivo de distrato (A) vs. passo dedicado (B)

- **Decisão**: **A — reaproveitar o fluxo de aditivo de distrato existente.**
- **Rationale**:
  - O modal de aditivo **já captura** os três inputs exigidos (description=reason, terminationDate=terminatedAt, file+signedAt=documento). Mecanismo A é o mais **aditivo** e de **menor risco de regressão** (FR-008/SC-004) — não introduz tela/modal novos.
  - Preserva a **linha de aditivo de distrato** na tabela e o **nó vermelho na timeline** que o front já renderiza (a UI espera um aditivo `distrato`). B apagaria essa noção (regressão visível).
  - Alinha com como a usuária já opera ("inclui um aditivo de distrato") e com a Assumption da spec.
- **Alternativa rejeitada (B — passo dedicado)**: mais limpo conceitualmente e com **um único** documento (`signed_termination`, sem o `signed_amendment`), mas exige modal/fluxo novos, remove a representação de aditivo do distrato (regressão de timeline/detalhe) e diverge do uso atual. Custo > benefício para esta fatia.
- **Custo aceito de A**: o PDF é enviado **duas vezes** — `signed_amendment` (homologa o aditivo) **e** `signed_termination` (pré-requisito do `/end`). Dois documentos persistem no contrato. É o preço de manter o aditivo + encerrar; aceitável e explícito.

## D2 — Origem de `reason` (motivo)

- **Decisão**: `reason` ← **`description` do aditivo de distrato** (o "Detalhe do Distrato" digitado no modal).
- **Regra**: tornar `description` **obrigatório quando `type==='distrato'`** no `canSubmit`/controller (hoje é opcional) — FR-002. Backend exige `reason` não-vazio (`min(1)`); a UI barra antes; a borda do BFF revalida (defesa).
- **Alternativas**: motivo livre num campo separado (duplicaria o "Detalhe do Distrato" já existente — descartado).

## D3 — Origem de `terminatedAt` (data efetiva)

- **Decisão**: `terminatedAt` ← **`terminationDate`** (campo "data efetiva do distrato" já no form), no caminho **create-with-attach** (o fluxo natural do distrato: criar o aditivo COM o documento).
- **Caminho attach-pending** (anexar doc a um distrato Pendente criado antes): `terminationDate` não é exibido nesse modo. Decisão: **degradar para `signedAt`** (data de assinatura do documento) como data efetiva, validada não-futura na borda. Justificativa: mantém o fluxo funcionando sem inflar a UI; a Assumption da spec permite reaproveitar a data de assinatura/efeito. *(Se a stakeholder quiser data efetiva explícita também no attach, é follow-up — não bloqueia US1.)*
- **Formato**: enviar **`YYYY-MM-DD`** (date-only, via `slice(0,10)`), convenção do BFF; o backend faz `new Date(terminatedAt)`.

## D4 — Documento `signed_termination`: mesmo arquivo do aditivo ou upload separado?

- **Decisão**: **mesmo arquivo (mesmos bytes)**, **upload separado** com `categoria:'signed_termination'` (parent = Contract), feito pelo `end-contract.use-case` **antes** do `/end`.
- **Rationale**: o `signed_amendment` fica vinculado ao **aditivo**; o `/end` só aceita um doc `signed_termination` vinculado ao **contrato**. Não há como reusar o vínculo — é uma categoria/parent diferente. Reusar os **bytes** (o mesmo PDF que a usuária já anexou) evita pedir o arquivo duas vezes.
- **Idempotência**: se o upload retornar `document-conflict` (já existe), seguir para o `/end` (igual a `attach-signed-document`).

## D5 — Validação de data não-futura na borda do front (espelhar o domínio)

- **Decisão**: reusar **`validateSignedDocument`** (já valida PDF magic-bytes, ≤20 MiB, e **data não-futura**) passando a **data efetiva** (`terminatedAt`) como a data a validar. Assim a borda do BFF rejeita data futura **antes** do core-api (mensagem amigável imediata) e valida o PDF.
- **Defesa em profundidade**: ainda assim mapeamos os erros do backend (`terminate-invalid-date`, `terminate-no-signed-document`) → tags i18n, caso a UI seja burlada.

## D7 — Distrato é passo-único (NÃO pode ficar Pendente) — ratificado pela usuária (2026-06-10)

- **Decisão**: o distrato **exige documento + data efetiva + data de assinatura para salvar**, e já encerra o contrato. **Não** pode ser salvo como Pendente (diferente de valor/prazo).
- **Rationale**: o distrato só tem efeito quando encerra o contrato, e o backend (#32) **exige** o documento `signed_termination` + `terminatedAt` + `reason` para encerrar. Um "distrato Pendente sem documento" não encerra nada e cria um estado órfão (a "Data do Distrato" digitada não seria persistida). Coerência com a RN > consistência com os demais tipos.
- **Implementação**: F3 no `canCreate` do `amendment-modal.component.tsx` (gating só para `type==='distrato'`). Validado em tela: sem arquivo → "Salvar Aditivo" desabilitado; com arquivo+data → encerra (homologado, com efeito).
- **Alternativa rejeitada**: permitir distrato Pendente (como valor/prazo) — descartada pela usuária; traria a data efetiva órfã e um estado sem efeito.

## D6 — Novos erros de domínio + tags i18n

- **Decisão**: `ContractsError += 'terminate-no-document' | 'terminate-invalid-date'`.
- **SLUG_TO_ERROR** (core-api-contracts): `'terminate-no-signed-document' → 'terminate-no-document'`, `'terminate-invalid-date' → 'terminate-invalid-date'`.
- **contractsErrorTag** + catálogo: `'contracts.distrato.error.no-document'` e `'contracts.distrato.error.invalid-date'` (mensagens amigáveis, sem detalhe técnico — FR-006). 400 genérico (Zod) continua degradando para `'server'`/`contracts.error.unexpected` (a UI já barra os campos).
