# Research — 019 contract-number-program

Decisões consolidadas (verificadas contra o código do front e o contrato do core-api #32).

> **Ratificado em 2026-06-10** (discussão com 3 peritos + usuária) → ver **ADR-0013 (convenção de IDs)**:
> - **Hashtable UUID↔número no BFF: REJEITADA** (3/3 peritos contra). IDs técnicos = UUID; número humano vem do backend (`programNumber`/`sequentialNumber`).
> - **Branded types: pragmático** — só `z.uuid()` string agora (sem brand); branding fica para refactor futuro.
> - **Parse resiliente (D9): adotar já** o branch de escape no `discriminatedUnion` de status.

## D1 — Mapear classificação no BFF (não trocar o domínio do front)
- **Decisão**: domínio do front continua `'Contract' | 'ServiceOrder'`; o adapter BFF traduz para/de `'CT'/'OS'` do #32 (read: CT→Contract, OS→ServiceOrder; write: Contract→CT, ServiceOrder→OS).
- **Rationale**: o enum `'Contract'/'ServiceOrder'` já é usado em model, controller, form (`<option value="Contract">`) e i18n. Trocar tudo para CT/OS seria invasivo e arriscado. Isolar o formato de wire no adapter respeita a fronteira (Zod na borda).
- **Alternativas**: (a) trocar o domínio para CT/OS — rejeitada (alto blast radius); (b) aceitar ambos no domínio — rejeitada (ambiguidade).

## D2 — IDs de programa/plano como string (UUID) — **sem brand agora**
- **Decisão**: `programId`/`budgetPlanId` e `program.id`/`budgetPlan.id` passam de `number` para **`z.uuid()` string** no model e no controller. **Sem branded type** nesta fatia (decisão pragmática 2026-06-10; brand vem em refactor futuro — ADR-0013).
- **Rationale**: #32 usa `varchar(36)` UUID. `z.number()` faz o parse do response **falhar**; e enviar number no create é rejeitado por `z.uuid()`.

## D3 — categorizacao/centroDeCusto como string livre
- **Decisão**: model `categorizacao`/`centroDeCusto` → `z.string()` (nullable/optional). O form mantém os 3 valores como opções de UI (rótulos), mas o tipo transportado é string.
- **Rationale**: #32 guarda string livre (`varchar(255)`); enum no front quebra a leitura se vier valor fora da lista.

## D4 — Bloco `program` (id + sigla)
- **Decisão**: parsear o bloco `program` do #32 (`{ id: uuid, sigla }`) e mapear para `program: { id: string, name: string }` no model; a **sigla** alimenta a coluna Programa do grid e o detalhe.
- **Ação no implement**: confirmar o nome exato do campo da sigla no `programSnapshotSchema` do #32 (sigla/acronym/name) e casar no mapper.

## D5 — Leitura backward-compat (nullable/optional)
- **Decisão**: todos os campos novos entram nos schemas do BFF como `.nullable().optional()`; o mapper trata ausência → `undefined`/"—".
- **Rationale**: contratos sem metadados (ou shape parcial) não podem zerar o grid/detalhe (precedente já documentado no próprio schema: "senão o parse falha e a lista zera").

## D6 — Numeração: remover a gambiarra
- **Decisão**: remover `sequentialNumber: ${random}/${year}` do body de create; o número exibido vem do response (já parseado). Passar `classification` real ao `formatContractNumber`.
- **Rationale**: #32 gera e ignora o enviado; o random é código morto e confuso.

## D7 — Create permanece Pending-only
- **Decisão**: o create envia `mode:'Pending'`. "Cadastro+assinatura" continua sendo o fluxo de 2 passos já existente (criar → anexar documento assinado → ativar, via `AttachDocumentModal`/activate).
- **Rationale**: o form de create **não tem** estado de `signedAt`/modo; adicionar create mode=Active seria nova feature de UI (escopo/risco). Os dois modos do #32 são cobertos no nível do **sistema** por dois fluxos distintos.
- **Impacto no spec**: FR-008/FR-009 lidos como "o sistema suporta ambos os modos" (create Pending + activate), não "o create faz ambos".

## D8 — Seletor de Programa com opções reais (UUID) — maior risco
- **Decisão**: ligar o `<select>` de Programa do form a uma **query de listagem de programas** exposta pelo `#modules/programs/public-api`, com opções `{ value: uuid, label: sigla }`. A query vive no **binding** do create (não na view).
- **budgetPlan**: sem endpoint de listagem de plano orçamentário confirmado → manter o campo **opcional/sem opções reais** nesta fatia (não envia id inválido); follow-up quando houver fonte.
- **Rationale**: as opções mock (1..4) não correspondem a UUIDs reais; criar com elas quebra no #32 e impede validar US2 via UI.
- **Fallback se inflar**: entregar leitura (US1+US2 display) primeiro; o seletor real de programa pode virar a última tarefa (ou follow-up), mantendo Programa **opcional** no create.

## D9 — Parse resiliente de status (escape branch) — **adotar nesta fatia**
- **Decisão**: o `discriminatedUnion` por `status` (list-item + detalhe) ganha um **branch de escape** que aceita o shape base + `status: z.string()` para valores futuros do backend (ex.: `'Cancelled'` do #32). `safeParse` por item no mapper para não zerar a linha no grid. A UI trata status não mapeado no `switch` exaustivo via `default` → tag i18n genérica.
- **Rationale**: o #32 adiciona `'Cancelled'`; com o union fechado, um contrato cancelado **quebraria o parse** e sumiria do grid. Resiliência barata, evita regressão iminente. (Tratar a UI/fluxo de cancelamento em si fica para o slice futuro.)

## Confirmações pendentes (resolver no implement, lendo o #32)
- Nome exato do campo da **sigla** no bloco `program` do response (`programSnapshotSchema`).
- Forma do `programId` no response (campo cru `programId` + bloco `program`, ambos? Só o bloco?) — casar com `contract-dto.ts` do #32.
- Endpoint/contrato de **listagem de programas** disponível no #32 para o seletor (D8).
