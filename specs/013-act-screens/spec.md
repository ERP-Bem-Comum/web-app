# Feature Specification: Telas de ACTs (partners)

**Feature Branch**: `013-act-screens`
**Created**: 2026-06-07
**Status**: Draft
**Input**: "Telas de ACT (4º tipo de parceiro) espelhando o molde de fornecedores/financiadores. Server-side pronto (6 server-fns + act.io.ts). Entrega só o client/ + menu."

## Clarifications

### Session 2026-06-07 (derivadas do contrato + molde 010/012)

- Q: Quais campos e particularidades? → A: **PF** — 7 campos: nome, e-mail, **CPF** (com/sem máscara, 11 dígitos), área de atuação (enum PARC/DDI/DCE/EPV), cargo/função, **data de início** (YYYY-MM-DD), vínculo (enum CLT/PJ). **Dois status**: cadastral (`pre-registration`/`complete`, somente leitura) e ativação (`active`/`inactive`, alternável).
- Q: Navegação pós-save? → A: criar→listagem, editar→detalhe (igual supplier/financier).
- Q: RBAC? → A: leitura para ver/menu, escrita para criar/editar/ativar/desativar. (Slug confirmado no plano: ver Assumptions.)
- Q: A ação de status mexe em qual status? → A: **ativação** (ativar/desativar). O status **cadastral** é apenas exibido (não há complete-registration nesta fase — ADR-0036 do core-api).

## User Scenarios & Testing *(mandatory)*

> Um **ACT** é o 4º tipo de parceiro (pessoa física). Mesmo molde CRUD do fornecedor/financiador,
> com as nuances acima (PF, enums, data, status duplo).

### User Story 1 - Listar ACTs (Priority: P1)
Usuário com leitura vê lista paginada (busca por nome, filtro ativo/inativo, ordenação). Colunas:
nome, e-mail, área de atuação, cargo, status cadastral, status de ativação. Botão "Novo ACT" (gated por escrita).

**Independent Test**: abrir a listagem com permissão de leitura, povoar, buscar, filtrar, paginar.
**Acceptance**: (1) tabela com as colunas e os 2 status; (2) busca filtra por nome; (3) filtro ativo/inativo; (4) paginação preserva filtros; (5) sem escrita → "Novo ACT" oculto; (6) falha → mensagem amigável.

### User Story 2 - Cadastrar ACT (Priority: P1)
Usuário com escrita cria um ACT: 7 campos (nome, e-mail, CPF, área de atuação, cargo, data de início, vínculo).

**Independent Test**: preencher 7 campos válidos, salvar, ver na listagem.
**Acceptance**: (1) form com os 7 campos (2 selects enum + 1 data); (2) salva e volta à listagem; (3) CPF com máscara aceito; (4) campo inválido bloqueia envio; (5) erro do backend → mensagem amigável.

### User Story 3 - Detalhar + alternar ativação (Priority: P2)
Detalhe com todos os campos (incl. CPF, data de início, vínculo) + os 2 status. Com escrita: ativar/desativar.

**Independent Test**: abrir detalhe, conferir campos, desativar/reativar.
**Acceptance**: (1) detalhe completo + 2 status; (2) ativo→inativar; (3) inativo→reativar; (4) sem escrita → ações ocultas; (5) falha → mensagem e status mantido.

### User Story 4 - Editar ACT (Priority: P2)
Reusa o form de criação com valores atuais; update = PUT total dos 7 campos.

**Independent Test**: abrir edição pré-preenchida, alterar, salvar, ver no detalhe.
**Acceptance**: (1) form pré-preenchido; (2) salva e reflete; (3) obrigatório vazio bloqueia; (4) sem escrita indisponível.

### Edge Cases
- Sem leitura → subitem "ACTs" some do menu (RBAC de menu da 011).
- Lista vazia → estado vazio claro (não erro). Permissões `[]` → ações de escrita ocultas (lado seguro).
- CPF com/sem máscara → mesmo cadastro. Área de atuação legada (string fora do enum) → exibida como veio (tolerância do model).

## Requirements *(mandatory)*

- **FR-001**: Listar ACTs paginado, com busca por nome, filtro por ativação e ordenação.
- **FR-002**: Listagem exibe nome, e-mail, área de atuação, cargo e os dois status (cadastral + ativação).
- **FR-003**: Criar ACT com os 7 campos (nome, e-mail, CPF, área de atuação, cargo, data de início, vínculo), aceitando CPF com/sem máscara.
- **FR-004**: Detalhe exibe todos os campos, incluindo CPF, data de início e vínculo, e os dois status.
- **FR-005**: Alternar a **ativação** (ativar/desativar); o status cadastral é somente leitura.
- **FR-006**: Editar ACT (substituição total dos 7 campos).
- **FR-007**: RBAC: leitura controla ver/menu; escrita controla criar/editar/ativar/desativar; ações sem permissão ocultas/desabilitadas.
- **FR-008**: Subitem "ACTs" no menu sob "Gestão de Parceiros", visível só com a permissão de leitura.
- **FR-009**: Falhas do backend viram mensagem amigável (nunca status técnico).
- **FR-010**: Toda string de UI vem do catálogo i18n (`partners.acts.*`).
- **FR-011**: Validações de campo (obrigatório/enum/data/CPF) bloqueiam o envio antes do backend.

## Key Entities *(include if feature involves data)*
- **ACT**: parceiro PF. Campos: nome, e-mail, CPF, área de atuação (PARC/DDI/DCE/EPV), cargo, data de início, vínculo (CLT/PJ); status cadastral (pre-registration/complete) e de ativação (active/inactive).
- **Permissão**: leitura/escrita de ACT (slugs do RBAC de parceiros — ver plano).

## Success Criteria *(mandatory)*
- **SC-001**: Localizar um ACT (busca+filtro) e abrir o detalhe em <30s.
- **SC-002**: Cadastrar um ACT (7 campos) numa única tela.
- **SC-003**: 100% das ações de escrita indisponíveis sem a permissão de escrita; leitura/menu indisponível sem leitura.
- **SC-004**: 100% das falhas de backend como mensagem amigável.
- **SC-005**: Paridade funcional com fornecedores (010)/financiadores (012): as 4 jornadas existem e passam pelos mesmos critérios.

## Impacto Arquitetural (core-api)
> Feature **só frontend (web-app), camada client/**. Não toca core-api nem os server-fns (prontos).
- BCs core-api: N/A. Web-app: novo `partners/client/act-*` + subitem de menu + rotas.
- Agregados/eventos/CLI/HTTP: nenhum. Server fn é a única fronteira; consome os 6 act fns existentes.
- Violações I–XII: nenhuma prevista (mesmo molde validado 010/012).

## Assumptions
- **Server pronto**: 6 act fns (list/get/create/update/deactivate/reactivate) + `act.io.ts` são a fonte dos campos/validações.
- **Slug RBAC (RESOLVIDO)**: usar **`collaborator:read`/`collaborator:write`** (já no catálogo). ACT é pré-cadastro que "espelha o núcleo do Colaborador"; quem gerencia colaboradores vê/gerencia ACTs. Não existe `act:*` no catálogo e o core-api já entrega `collaborator:*`. Se o backend criar `act:*` no futuro, trocar é 1 linha (menu) + os `can()` dos bindings.
- **Molde**: espelha `partners/client/financier-*`; nuances = PF (CPF), 2 enums (selects), 1 data, 2 status (badges).
- **Reuso**: `DataTable`/`PageHeader`, `can`/`partners-error-tag`, `partners-error.ts`.
- **Fora de escopo**: geografia (feature própria, a seguir), colaboradores, complete-registration, core-api.
