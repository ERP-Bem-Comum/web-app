# Feature Specification: Exportar histórico do Colaborador em CSV (D4)

**Feature Branch**: `integration/collaborator-history-033`

**Created**: 2026-06-17

**Status**: Draft

**Input**: O core-api já entrega o histórico de alterações do Colaborador (EPIC #65 / US4), mas **somente como export CSV** — não há endpoint JSON. O front não monta timeline na tela: oferece um **botão de download** no detalhe do Colaborador. Faz parte da fatia D do Colaborador (D1 perfil, D2 território #39, D3 banco/PIX #45 — já em develop).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Exportar o histórico de alterações de um Colaborador (Priority: P1)

Um operador, no detalhe de um Colaborador, aciona "Exportar histórico" e o navegador baixa um arquivo CSV com o log de auditoria das alterações daquele colaborador.

**Why this priority**: É a entrega — o backend já expõe o histórico (US4); falta a ação no front. Fecha a fatia D do Colaborador.

**Independent Test**: Abrir o detalhe de um colaborador que sofreu edições, clicar "Exportar histórico" e confirmar o download do CSV com as linhas de alteração.

**Acceptance Scenarios**:

1. **Given** o detalhe de um Colaborador, **When** o operador clica "Exportar histórico", **Then** o navegador baixa o CSV (`collaborator-<id>-history.csv`) com o conteúdo vindo do core-api.
2. **Given** um colaborador sem alterações registradas, **When** exporta, **Then** baixa o CSV **só com o cabeçalho** (não é erro).
3. **Given** uma falha do backend (ex.: 503 reader indisponível, ou sem permissão), **When** exporta, **Then** uma mensagem de erro i18n é exibida e nenhum download corrompido ocorre.
4. **Given** a exportação em andamento, **When** o operador aguarda, **Then** há feedback de carregamento e o botão não dispara duplo download.

### Edge Cases

- **Histórico vazio**: criação e complete-registration NÃO geram histórico; CSV pode vir só com cabeçalho — comportamento válido.
- **Erro/permissão**: 503/403 → mensagem i18n; sem download.
- **Sem timeline na tela**: não há contrato JSON — qualquer visualização rica fica fora de escopo.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O detalhe do Colaborador MUST oferecer uma ação "Exportar histórico" (CSV).
- **FR-002**: A ação MUST obter o CSV do core-api (`GET /collaborators/:id/export?type=history`) via server function do BFF e disparar o download no navegador, preservando o nome do arquivo do `content-disposition`.
- **FR-003**: Histórico vazio (CSV só com cabeçalho) MUST ser tratado como sucesso (download normal), não erro.
- **FR-004**: Erros do backend (503/permissão) MUST virar mensagem i18n na UI; sem download corrompido.
- **FR-005**: A ação MUST ter estado de carregamento e evitar disparo duplo.
- **FR-006**: Reuso do padrão de export/CSV já existente no módulo (export de lista / importCsv) — sem duplicação divergente.
- **FR-007**: Mudança ADITIVA, sem regressão; gates verdes; strings de UI via i18n.

### Key Entities

- **Histórico do Colaborador (CSV)**: log de auditoria por campo; colunas legadas `tipo_alteracao;historico_antes;historico_depois;data_alteracao;programa` (separador `;`). Conteúdo é opaco para o front (repassa o arquivo).

## Success Criteria _(mandatory)_

- **SC-001**: No detalhe, "Exportar histórico" baixa o CSV do colaborador.
- **SC-002**: Colaborador sem alterações → CSV só com cabeçalho, sem erro.
- **SC-003**: Falha do backend → mensagem i18n; nenhum arquivo corrompido baixado.
- **SC-004**: Zero regressão; suítes verdes.
- **SC-005**: Sem duplicação do mecanismo de download/CSV (reuso do padrão existente).

## Impacto Arquitetural (frontend / BFF) _(obrigatório)_

> Somente frontend — backend já entregue (US4). Sem alteração no backend.

- **BC**: Parceiros (Colaborador — detalhe).
- **Borda**: nova server function (ex.: `export-collaborator-history.query.fn.ts`) + método no client core-api (`core-api-collaborators.ts` ou reuso de `core-api-partners-export.ts`) que faz `GET /collaborators/:id/export?type=history` (fetch nativo, não `resultFetch` que força JSON).
- **UI**: botão no detalhe (`collaborator-detail` page/view-model) → download (Blob + filename).
- **Reuso**: padrão de download CSV dos exports existentes.

## Assumptions

- Contrato (consultor): `GET /api/v1/collaborators/:id/export?type=history` → `text/csv`; `type` obrigatório literal `history`; permissão `collaborator:read`; 503 se reader indisponível.
- Escopo = export do histórico apenas. Timeline visual = nova feature de backend (issue separada), fora daqui.
- Off `develop`; PR próprio → develop.

## Dependencies

- Backend: nenhuma pendência (core-api US4 / EPIC #65 entregue). Caso se queira timeline na tela, abrir issue no core-api para um endpoint JSON `GET /collaborators/:id/history`.
