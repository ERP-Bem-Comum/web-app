# Feature Specification: Gestão de Parceiros (épico — módulo `partners`)

**Feature Branch**: `008-partners`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Épico Gestão de Parceiros no frontend v2 (web-app), módulo vertical `partners` consumindo o core-api via BFF. Cobre colaboradores, fornecedores, financiadores, estados e municípios parceiros, clonando fielmente o comportamento do legado e saneando bugs de borda."

> **Épico.** Esta spec é o guarda-chuva da Gestão de Parceiros. Cada sub-domínio é uma **user story
> independentemente entregável** (P1–P3). A fonte de dados é o `core-api` via **server functions** (Princ. I);
> prontidão da API detalhada em [`api-readiness-report.md`](./api-readiness-report.md). Evidência crua em
> `handbook/specs-desing-system/gestão de parceiros/`. Decomposição visual em [`design-system/`](./design-system/).

## Glossário / Linguagem ubíqua

| Termo (PT) | Significado |
|---|---|
| **Parceiro** | Entidade vinculada à organização. Guarda-chuva de Colaborador, Fornecedor e Financiador. |
| **Colaborador** | Pessoa física (PF) vinculada a programas; tem cadastro em 2 etapas (pré-cadastro → completo). |
| **Fornecedor** | Pessoa jurídica (PJ) prestadora de serviços; tem dados bancários + PIX. |
| **Financiador** | Entidade (PJ) que financia programas; cadastro simples. |
| **Estado/Município parceiro** | Localidade marcada como abrangência de parceria (não é "parceiro-pessoa"; é seleção territorial). |
| **Situação cadastral** | Para colaboradores: `Pré Cadastrado` → `Cadastrado` (eixo distinto de ativo/inativo). |
| **Status** | `Ativo`/`Inativo` (eixo de habilitação, transversal a todos os tipos). |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Colaboradores (Priority: P1)

Como administrador/ABC, quero cadastrar e gerenciar colaboradores (PF) em duas etapas — um pré-cadastro
rápido com dados essenciais e depois o cadastro completo — além de listar, filtrar, importar em lote e
desativar com motivo, para manter o quadro de pessoas vinculadas aos programas atualizado.

**Why this priority**: É o CRUD central de pessoas, o sub-domínio mais rico (status duplo, 2 etapas,
filtros avançados, import) e o de maior uso diário. Entrega valor sozinho.

**Independent Test**: Acessar `/colaboradores`, criar um pré-cadastro (`/colaboradores/adicionar`),
completar o cadastro em `/colaboradores/editar/:id`, filtrar a lista e desativar com motivo — tudo
observável na UI, sem depender dos outros sub-domínios.

**Acceptance Scenarios**:

1. **Given** a lista de colaboradores, **When** o usuário digita na busca, **Then** a tabela filtra por texto livre (representante legal/email).
2. **Given** o painel de filtros aberto (toggle do funil), **When** o usuário escolhe filtros (escolaridade, raça, ano, função, gênero, status, situação cadastral, vínculo) e clica "Filtrar", **Then** a lista reflete os filtros sem fechar o painel.
3. **Given** a tela "Adicionar", **When** o usuário preenche os 7 campos essenciais (Rep. Legal, Email, Área, Função, Início de Contrato, Vínculo, CPF), **Then** o colaborador é criado com situação `Pré Cadastrado`.
4. **Given** um colaborador pré-cadastrado, **When** completa os dados pessoais no Editar, **Then** a situação passa a `Cadastrado`.
5. **Given** o modal de Desativar, **When** o usuário não seleciona "Motivo", **Then** o botão "Desativar Colaborador(a)" permanece desabilitado.
6. **Given** um arquivo CSV/Excel válido, **When** o usuário importa em lote, **Then** os colaboradores são criados (ou o sistema reporta as linhas inválidas).

---

### User Story 2 - Fornecedores (Priority: P1)

Como gestor, quero cadastrar e gerenciar fornecedores (PJ) com dados cadastrais, bancários e PIX,
filtrar por categoria de serviço e exportar a listagem, para administrar quem presta serviços à organização.

**Why this priority**: Segundo CRUD mais usado; carrega dados financeiros (bancário/PIX) que outros
módulos (Contratos) herdam. Entrega valor sozinho.

**Independent Test**: Em `/fornecedores`, criar um fornecedor com as 3 seções, filtrar por categoria,
abrir o detalhe (linha clicável) e desativar.

**Acceptance Scenarios**:

1. **Given** a tela "Adicionar Fornecedor", **When** o usuário preenche as 3 seções (cadastrais + bancários + PIX), **Then** o fornecedor é criado.
2. **Given** a listagem, **When** o usuário filtra por uma das categorias de serviço, **Then** a lista mostra só fornecedores daquela categoria.
3. **Given** uma linha da tabela, **When** o usuário clica em qualquer parte da linha, **Then** navega para o detalhe.
4. **Given** o modal de Desativar (ícone informativo, sem campo Motivo), **When** confirma, **Then** o fornecedor é desativado.

---

### User Story 3 - Financiadores (Priority: P2)

Como gestor, quero um CRUD simples de financiadores (6 campos), para registrar quem financia os programas.

**Why this priority**: Sub-domínio mais simples; valor real mas menor volume e sem filtros avançados.

**Independent Test**: Em `/financiadores`, criar/editar/detalhar/desativar com busca simples.

**Acceptance Scenarios**:

1. **Given** a lista (sem painel de filtros), **When** o usuário busca por texto, **Then** a lista filtra.
2. **Given** o formulário único (6 campos, sem seções), **When** preenche e salva, **Then** o financiador é criado.
3. **Given** o modal de Desativar, **When** abre, **Then** o texto é dinâmico ("...desativar o financiador [Nome].") e a ação segura é o botão de destaque.

---

### User Story 4 - Estados parceiros (Priority: P2)

Como gestor, quero marcar/desmarcar estados brasileiros como parceiros via um padrão de dois painéis
(transferência), com efeito imediato, para definir a abrangência territorial das parcerias.

**Why this priority**: Habilita a dimensão territorial; UX distinta (dual-panel, sem CRUD/Salvar).

**Independent Test**: Em `/estados`, adicionar um estado (botão +) e removê-lo (botão −), confirmando que a mudança é imediata.

**Acceptance Scenarios**:

1. **Given** o painel esquerdo com as 27 UFs, **When** o usuário clica em "+", **Then** o estado vai para o painel direito e o "+" vira "Adicionado".
2. **Given** um estado no painel direito, **When** clica em "−", **Then** ele volta ao painel esquerdo imediatamente (sem modal, sem Salvar).
3. **Given** ambos os painéis, **When** o usuário busca, **Then** cada painel filtra independentemente.

---

### User Story 5 - Municípios parceiros (Priority: P3)

Como gestor, quero marcar/desmarcar municípios como parceiros, filtrando por UF (obrigatório), com o
painel de selecionados mantendo municípios de qualquer UF (cross-state), para refinar a abrangência territorial.

**Why this priority**: Extensão de Estados; depende do mesmo padrão dual-panel + seleção de UF. Menor prioridade.

**Independent Test**: Em `/municipios`, selecionar uma UF no combobox, adicionar um município e confirmar que ele permanece no painel direito ao trocar de UF.

**Acceptance Scenarios**:

1. **Given** a tela sem UF selecionada, **When** o painel esquerdo é exibido, **Then** mostra "Nenhum resultado encontrado".
2. **Given** uma UF selecionada no combobox (com autocomplete), **When** carrega, **Then** o painel esquerdo lista os municípios daquela UF.
3. **Given** municípios adicionados de UFs diferentes, **When** o usuário troca a UF, **Then** o painel direito mantém todos os adicionados (cross-state).

### Edge Cases

- Lista vazia / 0 resultados de filtro → empty state, não tabela quebrada.
- Erro do BFF → a UI mostra tag i18n derivada de `AppError.kind` (nunca status HTTP cru) + opção de retry.
- Duplo submit em criar/desativar → reentrância bloqueada (command `running`).
- 401 → signOut + redirect `/login` preservando destino.
- Import CSV com linhas inválidas → relatório parcial (quais linhas falharam) sem abortar tudo.
- Estados/Municípios → integram a API real (toggles idempotentes); Município é identificado por `ibgeCode` (não por nome) e a listagem exige `uf` (ver `api-readiness-report.md`).
- Encoding incorreto vindo da API (ex.: `AvaliaÃ§Ã£o`) → saneado na borda (ver FR-013).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST listar cada tipo de parceiro com busca livre por texto e paginação (5/10/25 itens por página).
- **FR-002**: O sistema MUST oferecer filtros avançados em Colaboradores (escolaridade, raça, ano de contratação, função, identidade de gênero, status, situação cadastral, vínculo) e em Fornecedores (status, categoria), via painel toggle que não fecha ao aplicar.
- **FR-003**: Usuários MUST conseguir criar Colaborador em pré-cadastro (7 campos essenciais), resultando em situação `Pré Cadastrado`.
- **FR-004**: Usuários MUST conseguir completar o cadastro do Colaborador (dados pessoais, contato de emergência, identidade, saúde, biografia), promovendo a situação para `Cadastrado`.
- **FR-005**: O sistema MUST exibir o status duplo de Colaboradores (Ativo/Inativo + Cadastrado/Pré Cadastrado).
- **FR-006**: Usuários MUST conseguir desativar Colaborador com **Motivo obrigatório** (botão de confirmação desabilitado até selecionar o motivo).
- **FR-007**: Usuários MUST conseguir importar Colaboradores em lote via CSV/Excel, com relatório de linhas inválidas.
- **FR-008**: Usuários MUST conseguir criar Fornecedor (PJ) com dados cadastrais + bancários + PIX (3 seções), filtrar por categoria de serviço e exportar a listagem filtrada.
- **FR-009**: Usuários MUST conseguir o CRUD simples de Financiador (6 campos, sem seções) com busca simples e desativação por modal (texto dinâmico, sem Motivo).
- **FR-010**: Usuários MUST conseguir marcar/desmarcar Estados parceiros via dual-panel com persistência imediata (sem botão Salvar) e estado "Adicionado" visível.
- **FR-011**: Usuários MUST conseguir marcar/desmarcar Municípios parceiros por UF (seleção obrigatória, combobox com autocomplete), com painel de selecionados cross-state.
- **FR-012**: A navegação MUST seguir as rotas legadas: `/{colaboradores|fornecedores|financiadores}[/detalhes/:id | /editar/:id | /adicionar]` e `/estados`, `/municipios` (telas únicas).
- **FR-013**: O sistema MUST sanear bugs de borda da API que não são da UI (ex.: encoding `AvaliaÃ§Ã£o` → "Avaliação", breadcrumb singular/plural) — normalização na fronteira, registrada em ADR.
- **FR-014**: O sistema MUST integrar a API real do core-api (`/api/v1`) em **toda a superfície implementada** — incluindo import de Colaboradores (`text/csv`), export de Fornecedores, catálogo de categorias, e parceria territorial de Estados/Municípios (toggles idempotentes). O **ponto de troca** (gateway/repository) MUST permanecer isolado para que a UI/ViewModel não mude (ADR-0001) — mas mock **não é mais necessário** para esses sub-domínios (estado atual em `api-readiness-report.md`).
- **FR-015**: O sistema MUST preservar a coluna `CONTRATOS/ADITIVOS` (vazia/reservada) nas listagens onde o legado a exibe.
- **FR-016**: Todas as strings de UI MUST vir do catálogo i18n; toda falha MUST ser apresentada como `AppError.kind` mapeado para tag i18n (a UI nunca inspeciona status HTTP).

- **FR-017**: O catálogo de categorias de serviço de Fornecedores MUST vir do endpoint canônico `GET /api/v1/suppliers/service-categories` (**39 códigos**, union fechada no domínio). *(Resolvido — antes NEEDS CLARIFICATION sobre a fonte; o backend agora expõe o catálogo.)*

*Itens com NEEDS CLARIFICATION (pendentes — entram no `/speckit-clarify`):*

- **FR-018**: Financiador — o core-api é **PJ-only** (exige CNPJ; sem variante PF). [NEEDS CLARIFICATION: manter o formulário PJ-only no front (recomendado) ou aguardar suporte a PF no backend?]
- **FR-019**: Filtros de Colaborador — o core-api **descartou** `programa` (fora do BC) e `idade` (FR-012 do backend). [NEEDS CLARIFICATION: remover "programa" da UI de filtros e derivar idade de `dateOfBirth` no client (recomendado), ou manter alguma forma desses filtros?]

### Key Entities

- **Partner** (conceito guarda-chuva): identidade comum (nome, status ativo/inativo, datas). Especializado em Collaborator/Supplier/Financier.
- **Collaborator** (PF): rep. legal, email, CPF, área de atuação, função, início de contrato, vínculo empregatício, situação cadastral; + dados completos (RG, endereço, nascimento, celular, contato de emergência, identidade de gênero, raça/cor, alergias, categoria alimentar, escolaridade, experiência setor público, biografia). Motivo de desativação.
- **Supplier** (PJ): nome, email, CNPJ, razão social, nome fantasia, categoria de serviço, dados bancários (banco, agência, conta, dígito), PIX (tipo de chave, chave).
- **Financier** (PJ): nome, razão social, representante legal, CNPJ, telefone, endereço.
- **PartnerState**: associação Estado (UF) ↔ parceria (booleano de pertencimento).
- **PartnerMunicipality**: associação Município (UF + nome) ↔ parceria (cross-state no painel).
- **Value Objects (server/domain)**: `CPF`, `CNPJ`, `Email`, `UF`, `Phone`, `PixKey` — branded + smart constructor `Result<T,E>`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário cria um pré-cadastro de colaborador válido em < 2 minutos.
- **SC-002**: A listagem renderiza em < 1s (p95) para o volume de teste (≤ 50 registros) com filtros aplicados.
- **SC-003**: 100% das telas/fluxos do legado (5 sub-domínios) têm paridade funcional observável (clone fiel), com os bugs de borda catalogados saneados.
- **SC-004**: O bundle do client não contém `accessToken`/`refreshToken`/`Bearer`/segredo (verificável por grep, como na auth).
- **SC-005**: Trocar um sub-domínio de mock para API real não exige alteração em `client/ui` nem em `*.view-model.ts` (só no gateway/repository).

## Impacto Arquitetural (web-app / BFF) *(obrigatório se a feature toca `src/`)*

- **Módulo(s) vertical(is) afetado(s)**: [x] novo `src/modules/partners/` — espelha `contracts`/`auth`.
- **Server functions novas (a fronteira, Princ. I)**: `listCollaborators`, `getCollaborator`, `createCollaborator`, `completeCollaboratorRegistration`, `updateCollaborator`, `deactivateCollaborator`, `importCollaborators`; análogas para `supplier*` e `financier*`; `listPartnerStates`/`togglePartnerState`, `listMunicipalitiesByUf`/`togglePartnerMunicipality`.
- **Integração core-api**: parceiros vivem em **`/api/v1`** (não `/api/v2`). Prontidão (revisada): Financiadores/Fornecedores/Colaboradores/Estados/Municípios **🟢 todos prontos** (incl. import/export/catálogo/territorial). Fora de escopo: financiador-PF e filtros programa/idade. Ver `api-readiness-report.md`.
- **Novos agregados / VOs (server/domain, Princ. IV)**: Collaborator, Supplier, Financier + VOs branded (CPF/CNPJ/Email/UF/PixKey).
- **Eventos no client (Event Bus, Princ. XII)**: opcional (ex.: `ColaboradorDesativado` → invalida lista). Vivem em `client/data`.
- **Design System**: novos organismos (DataTable, FilterPanel, FormCard 1/2/3 seções, DualPanel, DeactivateModal com/sem Motivo) — ver `design-system/`.
- **Possíveis violações da constituição**: nenhuma prevista. Mock/fallback isolado no gateway (não vaza para UI). Atenção a só-tokens nas telas novas.

## Assumptions

- A stack de auth/sessão já existe (módulo `auth`) e protege as rotas de parceiros (401 → login).
- O design system base (`shared/ui` + tokens vanilla-extract) já está disponível e é reusado.
- "Clone fiel" significa paridade de comportamento visível, não replicar bugs de API/encoding.
- Onde a API não existe, mock/fallback é aceitável para a Fase 1 (entrega progressiva).

## Out of Scope

- Implementação ou alteração do `core-api` (backend) — apenas consumo via BFF; gaps são reportados, não resolvidos aqui.
- CRUD de usuários/permissões (Zero Trust) — fora do épico.
- Telas de Contratos/Aditivos (módulo `contracts` já existe) — apenas a coluna reservada é mantida.
- Relatórios/dashboards de parceiros (dashboard é outra evidência).
