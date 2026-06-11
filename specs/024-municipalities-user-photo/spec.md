# Feature Specification: Municípios parceiros adicionados (cross-state)

**Feature Branch**: `feat/municipalities-user-photo-024`

> **Nota de escopo (2026-06-11):** este pacote foi originalmente especificado com 2 user stories
> (municípios cross-state + foto de perfil de usuário). Na investigação do plano, confirmou-se que a
> **exibição** da foto está **bloqueada no backend** (o `imageUrl` do `GET /me` é só a chave opaca de
> storage; não há rota que sirva os bytes nem URL renderável — só `PUT`/`DELETE /me/photo`). Portanto a
> **US2 (foto) foi REMOVIDA** deste escopo e virou um pedido ao backend (ticket
> `handbook/core-api/tickets/USR-ME-PHOTO-DISPLAY.md`). A foto permanece **gated** no front. O nome da
> branch/pasta foi mantido por histórico; o escopo efetivo é **apenas municípios cross-state (§1.8)**.

**Created**: 2026-06-11

**Status**: Draft

**Input**: Destravar a última pendência de geografia do handoff #32 (§1.8): o painel "Municípios Parceiros Adicionados" (cross-state) que o front mantém como placeholder, mas que o backend já entrega via `GET /partner-municipalities/added`. Frontend-only, aditivo, sem tocar core-api, sem regressão.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver municípios parceiros de todos os estados (Priority: P1)

Um gestor abre a tela **"Estados e Municípios"**. Na seção **Municípios**, além da "Lista Geral" (que mostra os municípios de uma UF selecionada), o painel da direita **"Municípios Parceiros Adicionados"** mostra hoje apenas um aviso de "indisponível". Com a feature, esse painel passa a **listar todos os municípios marcados como parceiros, de qualquer UF** (ex.: Arapiraca/AL e Sobral/CE juntos), com **busca** e **contador**, do mesmo jeito que o painel "Estados Parceiros Adicionados" já funciona. Assim o gestor enxerga, num lugar só, a cobertura municipal de parcerias sem precisar selecionar UF por UF.

**Why this priority**: Fecha o **último item de geografia** do handoff (#32 §1.8) e remove um placeholder visível em produção. Entrega valor sozinha e é de baixo risco (leitura, sem mutação nova).

**Independent Test**: Com municípios marcados como parceiros em ≥2 UFs diferentes, abrir "Estados e Municípios" → seção Municípios → painel "Adicionados" lista todos eles (de UFs distintas), o contador bate, e a busca filtra por nome/UF. A "Lista Geral" por UF e a adição/remoção continuam funcionando exatamente como antes.

**Acceptance Scenarios**:

1. **Given** municípios marcados como parceiros em mais de uma UF, **When** o gestor abre a seção Municípios, **Then** o painel "Adicionados" lista todos eles (de qualquer UF) com nome e UF, e o contador reflete o total.
2. **Given** o painel "Adicionados" populado, **When** o gestor digita um termo na busca, **Then** a lista filtra por nome do município (e/ou UF) sem recarregar a página.
3. **Given** um município é adicionado/removido na "Lista Geral" (por UF), **When** a operação conclui, **Then** o painel "Adicionados" reflete a mudança (município aparece/some) de forma consistente.
4. **Given** nenhum município parceiro em nenhuma UF, **When** o gestor abre a seção Municípios, **Then** o painel "Adicionados" mostra um estado vazio claro (não um erro nem o placeholder antigo).

---

### Edge Cases

- Município parceiro cuja UF **não é** estado parceiro (ex.: Arapiraca/AL sem AL parceiro) deve aparecer no painel "Adicionados" mesmo assim (a parceria de município é independente da do estado).
- Muitos municípios parceiros (dezenas/centenas) — a lista precisa permanecer utilizável (busca/contador; rolagem); ordenação previsível (ex.: por UF e depois nome).
- Erro ao carregar o cross-state → o painel mostra estado de erro amigável, sem derrubar a seção de Estados nem a "Lista Geral" (que são independentes).
- Remoção do último município de uma UF → o item some do painel "Adicionados" após a operação concluir.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir, na seção Municípios da tela "Estados e Municípios", a lista de **todos os municípios marcados como parceiros em qualquer UF**, no painel "Municípios Parceiros Adicionados".
- **FR-002**: Cada item da lista MUST mostrar, no mínimo, o **nome do município** e a **UF**.
- **FR-003**: O painel MUST oferecer **busca** (filtra por nome do município e/ou UF) e um **contador** do total, espelhando o comportamento já existente no painel "Estados Parceiros Adicionados".
- **FR-004**: O painel "Adicionados" MUST refletir adições/remoções feitas na "Lista Geral" por UF (consistência após a operação).
- **FR-005**: O sistema MUST tratar **lista vazia** com um estado vazio claro e **erro de carga** com mensagem amigável, sem afetar a seção de Estados nem a "Lista Geral".
- **FR-006**: A adição/remoção de municípios pela "Lista Geral" (por UF) MUST permanecer inalterada (sem regressão).
- **FR-007**: Toda comunicação com o backend MUST passar pela fronteira única do app (server function/BFF); o browser não fala com o core-api diretamente.
- **FR-008**: As mudanças MUST ser **aditivas**, sem regressão nos fluxos existentes (Estados, Lista Geral de municípios e demais telas de parceiros).

### Key Entities *(include if feature involves data)*

- **Município parceiro (cross-state)**: representa um município marcado como parceiro. Atributos relevantes para a UI: identificador (código IBGE), nome e UF. Coleção lida de uma única fonte cross-state (todos os parceiros, qualquer UF).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Com municípios parceiros em ≥2 UFs, **100%** deles aparecem no painel "Adicionados" (nenhum omitido por causa da UF não ser parceira), conferível em tela.
- **SC-002**: O gestor encontra um município parceiro específico pela busca em **1 ação** (digitar o termo), sem navegar UF por UF.
- **SC-003**: Após adicionar/remover um município na "Lista Geral", o painel "Adicionados" reflete a mudança **sem recarregar** a página.
- **SC-004**: **Zero regressão**: Estados, Lista Geral de municípios e demais telas de parceiros seguem funcionando como antes (verificado em tela + suíte de testes verde).

## Impacto Arquitetural *(frontend v2 — esta feature NÃO toca o core-api)*

- **Bounded Contexts (core-api) afetados**: **Nenhum.** Feature **frontend-only**; consome o endpoint **já existente** `GET /partner-municipalities/added` (#32). Sem mudança de agregados, eventos (outbox), CLI ou borda HTTP do backend.
- **Módulo do front afetado**: `partners` (recurso `geography`). Não compartilha arquivos de domínio com 022 (act-*) nem 023 (supplier-*/contracts), exceto, possivelmente, o catálogo i18n compartilhado.
- **Fronteira client↔server**: a **server function (BFF)** continua sendo a única fronteira; nova server fn de leitura para o cross-state.
- **Invariantes v2 (lint cobra)**: `Result<T,E>` sem throw fora da borda; sem `any`/`class`/`this`; imutabilidade; design system só-tokens (`vars.*`); strings de UI = tags i18n; views burras (MVVM, sem `useQuery`/`useMutation` em page/component); fronteiras por `public-api`/boundaries; Zod na borda (input da server fn + response do core-api); naming por postfix; `switch` exaustivo com guard `never`.

## Assumptions

- **Backend pronto (#32, core-api@dev)**: `GET /partner-municipalities/added` existe e devolve `{ items: [{ ibgeCode, uf, name }], meta: { currentPage, itemsPerPage, itemCount, totalItems, totalPages } }`, com query `?search=&page=&limit=` (limit ≤ 100). Verificado no `core-api@dev` em 2026-06-11.
- **Espelhar Estados**: o painel "Adicionados" reusa o mecanismo do painel "Estados Parceiros Adicionados" (lista + busca + contador + estado vazio, via componente `TerritoryColumn` já existente).
- **Carregar todos os parceiros**: como o endpoint pagina (limit ≤ 100), para manter a paridade com Estados (busca/contagem client-side), o app carrega a lista completa de parceiros (acumulando páginas no server, se necessário). Paginação server-side na UI fica como **follow-up** se o volume crescer muito.
- **Lista Geral por UF inalterada**: adicionar/remover município (por UF) já funciona via `POST`/`DELETE /partner-municipalities/:ibgeCode` e **não muda**; apenas passa a **invalidar** também a query do cross-state.
- **Fora de escopo**: foto de perfil de usuário (US2 removida — bloqueada no backend, ver ticket `USR-ME-PHOTO-DISPLAY.md`); logo de programa (também bloqueado); qualquer mudança no core-api; ACT (022) e avaliação/cancelamento (023).
