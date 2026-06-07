# Feature Specification: Geografia de Parceria (partners)

**Feature Branch**: `014-geography-screens`
**Created**: 2026-06-07
**Status**: Draft
**Input**: "Tela de geografia de parceria: selecionar estados e municípios onde o programa atua. Server-side pronto (4 server-fns). Molde DIFERENTE do CRUD — é seleção territorial por toggle."

## Clarifications

### Session 2026-06-07 (derivadas do contrato + decisão)
- Q: É CRUD? → A: **Não.** É **seleção territorial**: cada estado (UF) e cada município tem um marcador `isPartner` que o usuário liga/desliga (toggle idempotente; o core-api confirma o novo estado).
- Q: Layout? → A: **Dois painéis**. Esquerda: lista de **estados** (UF) com toggle. Ao selecionar um estado, a direita lista os **municípios** daquele UF com toggle.
- Q: Atualização? → A: **Otimista** (o contrato confirma o DTO; sem refetch). Erro → reverte o toggle e mostra mensagem amigável.
- Q: RBAC? → A: `geography:read` (ver), `geography:write` (alternar). Slugs já no catálogo.

## User Scenarios & Testing *(mandatory)*

> Uma única tela define a **abrangência territorial** do programa. Não há criar/editar/excluir entidades —
> apenas marcar/desmarcar estados e municípios como parceiros.

### User Story 1 - Selecionar estados parceiros (Priority: P1)
Usuário com leitura vê a lista de estados (UFs) com um marcador de parceria cada. Com escrita, liga/desliga
um estado; a mudança é refletida imediatamente (otimista) e confirmada pelo backend.

**Independent Test**: abrir a tela, ver a lista de UFs com o marcador correto; com escrita, alternar um estado e ver o marcador mudar.
**Acceptance**: (1) lista de UFs com marcador `isPartner`; (2) com escrita, alternar muda o marcador na hora; (3) sem escrita, os marcadores ficam desabilitados; (4) falha → marcador volta ao valor anterior + mensagem amigável; (5) sem leitura → subitem some do menu.

### User Story 2 - Selecionar municípios de um estado (Priority: P1)
Ao selecionar um estado, o usuário vê os municípios daquele UF com marcador de parceria cada e pode alterná-los.

**Independent Test**: selecionar um UF, ver a lista de municípios daquele UF com os marcadores; com escrita, alternar um município.
**Acceptance**: (1) selecionar um UF carrega seus municípios; (2) cada município tem marcador `isPartner`; (3) com escrita, alternar muda o marcador na hora; (4) sem escrita, desabilitados; (5) trocar de UF carrega a lista correta; (6) falha → reverte + mensagem.

### Edge Cases
- Sem leitura → subitem "Geografia" some do menu (RBAC de menu da 011).
- Nenhum estado selecionado → painel de municípios mostra estado vazio/instrução ("selecione um estado").
- UF sem municípios (ou carregando) → estado vazio/carregando claro.
- Permissões `[]` → toggles desabilitados (lado seguro).
- Toggle em voo (pending) → o controle fica desabilitado até confirmar/reverter (evita corrida).

## Requirements *(mandatory)*
- **FR-001**: Exibir a lista de estados (UFs) com o marcador `isPartner` de cada um.
- **FR-002**: Alternar o `isPartner` de um estado (ligar/desligar) com reflexo imediato (otimista).
- **FR-003**: Ao selecionar um estado, exibir os municípios daquele UF com o marcador `isPartner` de cada um.
- **FR-004**: Alternar o `isPartner` de um município (otimista).
- **FR-005**: RBAC: `geography:read` controla ver/menu; `geography:write` controla os toggles (sem escrita → desabilitados).
- **FR-006**: Em falha de um toggle, reverter o marcador ao valor anterior e exibir mensagem amigável (nunca status técnico).
- **FR-007**: Subitem "Geografia" no menu sob "Gestão de Parceiros", visível só com `geography:read`.
- **FR-008**: Toda string de UI vem do catálogo i18n (`partners.geography.*`).

## Key Entities *(include if feature involves data)*
- **Estado parceiro**: identificado por `uf` (2 letras), com `isPartner` (booleano).
- **Município parceiro**: identificado por `ibgeCode` (7 dígitos), com `uf`, `name` e `isPartner`.
- **Permissão**: `geography:read` (ver) e `geography:write` (alternar).

## Success Criteria *(mandatory)*
- **SC-001**: Um usuário com escrita marca/desmarca um estado e vê o resultado em menos de 1 segundo (otimista).
- **SC-002**: Selecionar um estado mostra seus municípios sem recarregar a tela.
- **SC-003**: 100% dos toggles ficam desabilitados sem `geography:write`; ver/menu indisponível sem `geography:read`.
- **SC-004**: 100% das falhas de toggle revertem o marcador e exibem mensagem amigável (zero status técnico).

## Impacto Arquitetural (core-api)
> Feature **só frontend (web-app), camada client/**. Não toca core-api nem os 4 server-fns (prontos).
- Web-app: novo `partners/client/geography` + subitem de menu + 1 rota. Server fn = única fronteira.
- Agregados/eventos/CLI/HTTP: nenhum. Violações I–XII: nenhuma prevista (UI própria, mas respeita MVVM/boundaries/só-tokens).

## Assumptions
- **Server pronto**: 4 fns (listStates/toggleState/listMunicipalities(uf)/toggleMunicipality) + `geography.io.ts` são a fonte.
- **UI própria** (não reusa DataTable/form CRUD): dois painéis com listas de toggle (Checkbox do DS). Rota `/parceiros/territorios`.
- **Otimista**: toggle atualiza o cache na hora (onMutate) e reverte em erro (onError); o DTO de retorno confirma.
- **Reuso**: `Checkbox` (atom), `can`/`partners-error-tag`, `partners-error.ts`. RBAC de menu da 011.
- **Fora de escopo**: edição de nomes/limites territoriais, importação em massa, core-api.
