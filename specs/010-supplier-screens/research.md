# Research — Telas de Fornecedores (Phase 0)

Decisões resolvidas antes do detalhamento. Formato: **Decisão / Racional / Alternativas**.

## R1 — Nomenclatura e estrutura das rotas

- **Decisão**: rotas sob `src/routes/_authenticated/parceiros/fornecedores/` → `index.tsx` (lista), `criar.tsx`, `$id.tsx` (detalhe), `$id.editar.tsx` (edição). URLs: `/parceiros/fornecedores[...]`.
- **Racional**: agrupa sob "parceiros" (coerente com o menu "Gestão de Parceiros", com as 3 entidades futuras e com o item de RBAC do menu). O `contracts` usa `/contratos` na raiz porque é uma entidade só; parceiros tem 4 → o agrupamento evita poluir a raiz e dá um prefixo natural.
- **Alternativas rejeitadas**: `/fornecedores` na raiz (espelho literal do contracts) → não escala para as 4 entidades; `/parceiros` com tabs → adia decisão de navegação, fora de escopo.

## R2 — Tipos de input: inferir das server fns vs. redefinir no client

- **Decisão**: os **schemas de entrada do usuário** (filtros da listagem + valores do formulário) são definidos como **Zod no client** (`domain/supplier.schemas.ts`) — usados pelo `validateSearch` da rota e pelo controller do form. Os **tipos de chamada das server fns** fluem por inferência ao chamar `listSuppliersFn({ data })` etc. (não reimportar `server/domain`).
- **Racional**: §IX exige validação na borda do cliente (form/search) — isso é responsabilidade do client e não existe no server fn da perspectiva da UI. Inferir o tipo da fn evita duplicar contrato e respeita a fronteira (§I: client não importa `server/domain`). É o que o `contracts/client/domain/schemas.ts` faz.
- **Alternativas rejeitadas**: importar os schemas de `supplier.io.ts` (server/domain) → viola a fronteira de boundaries; não validar no client → viola §IX.

## R3 — Response do BFF: parse defensivo no client (Model)

- **Decisão**: `data/model/supplier.model.ts` define um Zod que **valida o response** das query fns antes de virar Model consumido pela UI (espelha `contracts.model`). Os tipos `SupplierListItem`/`SupplierDetail`/`SupplierListResponse` vêm do `public-api` (já exportados).
- **Racional**: §IX "validação na fronteira… e no response". Defende a UI de divergência do BFF. Reusa os tipos públicos (não redefine).
- **Alternativas rejeitadas**: confiar cegamente no response → quebra silenciosa se o contrato mudar.

## R4 — Listagem: consumir organismos + estado via união discriminada

- **Decisão**: `supplier-list.page.tsx` compõe `PageHeader` (título + ação "Novo fornecedor") + barra de filtros (local) + `DataTable<SupplierRow>` + paginador (local). O binding deriva o `DataTableState` (`loading | error | ready`) a partir do `useQuery`. As colunas (`Column<SupplierRow>`) trazem header i18n e células (status via `Badge`, ações via botões).
- **Racional**: FR-014 (consumir organismos) + §XI (server-state no Query; view burra recebe `state` pronto). `DataTable` já trata loading/empty/error (spec 009).
- **Alternativas rejeitadas**: recriar tabela local (como o contracts fez antes da fundação) → contraria FR-014 e duplica.

## R5 — Filtros/busca/paginação na URL (estado compartilhável)

- **Decisão**: o estado da listagem (search, active, categories, order, page, limit) vive nos **search params da rota**, validados por `validateSearch` (Zod do client). O binding lê os params e monta o input da query; mudanças de filtro navegam atualizando os params (e resetam `page` para 1).
- **Racional**: FR-002 (estado restaurável/compartilhável). Padrão do `contracts` (`validateSearch: ContractListFiltersSchema`). Server-state ≠ UI-state: o filtro é "input", o resultado é server-state no Query.
- **Alternativas rejeitadas**: estado de filtro em `useState` → perde shareability e mistura camadas.

## R6 — Categorias de serviço da fonte do backend

- **Decisão**: as categorias (filtro + select do form) vêm de `listServiceCategoriesFn` via uma query própria (cacheada). Nunca lista fixa no client.
- **Racional**: FR-006. O BFF é a autoridade do conjunto de categorias.

## R7 — Formulário create/edit: um componente, grupos condicionais

- **Decisão**: um `supplier-form.component.tsx` (burro) + `supplier-form.controller.ts` (estado + validação Zod), reusado por create e edit (edit pré-preenche via query). Grupos **bancário** e **PIX** são opcionais, mas **"tudo ou nada"** (se iniciar um, os subcampos obrigatórios do grupo passam a ser exigidos). Campos sensíveis (bancário/PIX) só editáveis com `supplier:edit-sensitive`.
- **Racional**: FR-004/FR-005/FR-010/FR-011. Espelha `contract-form` + `contract-form.controller`. Controller isola estado de digitação (§XI) e valida na borda (§IX).
- **Alternativas rejeitadas**: dois formulários separados → duplicação; validar só no backend → viola §IX.

## R8 — CNPJ com e sem máscara

- **Decisão**: o input aceita máscara; o controller **normaliza para 14 dígitos** antes de enviar; a validação Zod do client checa formato (com-ou-sem-máscara → 14 dígitos válidos). O server fn aceita 14–18 (com máscara).
- **Racional**: edge case da spec; o `supplier.io.ts` documenta "aceita máscara; o client normaliza p/ 14 dígitos".

## R9 — Detalhe + mudança de status (inativar/reativar) com confirmação

- **Decisão**: `supplier-detail.page.tsx` mostra hero (dados básicos) + aside (bancário/PIX, respeitando `edit-sensitive`) + ações de status. Inativar/reativar usam mutations (`deactivateSupplierFn`/`reactivateSupplierFn`) com **confirmação** via um **componente local de confirmação** (o diálogo modal genérico ainda não é organismo — fora da spec 009). Após sucesso, invalida a query do detalhe/lista.
- **Racional**: FR-008/FR-009. As fns são idempotentes (sem motivo na borda). Confirmação local até existir o organismo modal.
- **Alternativas rejeitadas**: esperar o organismo modal (US4 da spec 009, fora de escopo) → bloquearia esta feature; `window.confirm` → fora do design system. Componente local com tokens é o meio-termo.

## R10 — RBAC: `can()` + permissões do contexto de rota

- **Decisão**: as permissões do operador chegam pelo contexto da área `_authenticated` (como o shell já recebe `user`); o binding/view-model usa `can(granted, 'supplier:write'|...)` para habilitar/ocultar ações. Dados sensíveis (bancário/PIX) gated por `supplier:edit-sensitive`.
- **Racional**: FR-011/§IX. Reusa `partners/client/data/helpers/can.ts` (já existe e testado).
- **Pendência leve (resolver na implementação)**: confirmar como as `permissions` do usuário são expostas hoje no contexto da rota `_authenticated` (o shell recebe `user`; checar se traz `permissions`). Se não trouxer, expor via o mesmo loader/contexto. Default: ler do mesmo lugar que o shell.

## R11 — Erros → tag i18n (switch exaustivo)

- **Decisão**: `supplier-error-tag.ts` mapeia `AppError.kind` (e códigos de domínio relevantes: cnpj-duplicado, not-found, validation) para tags `partners.suppliers.error.*`, com `switch` exaustivo (`const _: never`). A UI consome só a tag.
- **Racional**: §II/§V/FR-012. Espelha `contracts-error-tag`.

## Resumo

Nenhum `NEEDS CLARIFICATION` pendente. Feature de baixo risco arquitetural (replica `contracts`, consome BFF + organismos prontos). Pendências leves resolvidas na implementação: (R9) forma da confirmação de status; (R10) origem das `permissions` no contexto de rota.
