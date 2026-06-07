# Feature Specification: RBAC do menu de fornecedores

**Feature Branch**: `011-supplier-menu-rbac`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "RBAC do menu de fornecedores. Ligar o controle de acesso do subitem 'Fornecedores' (sob a seção 'Gestão de Parceiros') no menu de navegação do shell. Hoje o subitem está SEM `requiredPermission` (sempre visível) — a T037 da feature 010 deixou isso em aberto como 'item 2 / RBAC do menu, feature separada'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Usuário sem acesso a fornecedores não vê a entrada no menu (Priority: P1)

Um usuário autenticado que **não** possui a permissão de leitura de fornecedores não deve
enxergar o subitem "Fornecedores" no menu lateral. Como esse subitem é o único filho da
seção "Gestão de Parceiros", a seção inteira (o accordion) também desaparece, evitando um
agrupamento vazio e sem destino.

**Why this priority**: É o coração da feature — o objetivo é não expor uma área que o usuário
não pode acessar. Sem isso, o usuário vê um caminho que leva a uma tela onde não consegue
operar (ou que o backend recusa), gerando confusão e uma falsa sensação de permissão.

**Independent Test**: Pode ser testado isoladamente verificando a derivação do menu visível:
dado um conjunto de permissões SEM `supplier:read`, o menu derivado não contém o subitem
"Fornecedores" nem a seção "Gestão de Parceiros".

**Acceptance Scenarios**:

1. **Given** um usuário autenticado cujas permissões não incluem a leitura de fornecedores, **When** o menu de navegação é renderizado, **Then** o subitem "Fornecedores" não aparece.
2. **Given** o mesmo usuário, **When** o menu é renderizado, **Then** a seção "Gestão de Parceiros" também não aparece, por ter ficado sem subitens visíveis.

---

### User Story 2 - Usuário com acesso a fornecedores vê a entrada normalmente (Priority: P1)

Um usuário autenticado que possui a permissão de leitura de fornecedores continua vendo o
subitem "Fornecedores" sob "Gestão de Parceiros", exatamente como antes da feature, podendo
navegar para a listagem.

**Why this priority**: A contrapartida da US1 — garantir que o filtro não esconde a entrada de
quem tem direito. Sem essa garantia, a feature poderia "vazar para o lado seguro" e ocultar a
área de todos.

**Independent Test**: Dado um conjunto de permissões que inclui `supplier:read`, o menu
derivado contém a seção "Gestão de Parceiros" com o subitem "Fornecedores" apontando para a
listagem.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado cujas permissões incluem a leitura de fornecedores, **When** o menu de navegação é renderizado, **Then** a seção "Gestão de Parceiros" aparece com o subitem "Fornecedores".
2. **Given** o mesmo usuário, **When** ele clica em "Fornecedores", **Then** é levado à listagem de fornecedores.

---

### Edge Cases

- **Permissões vazias (degradação)**: quando a identidade do usuário chega sem nenhuma
  permissão (lista vazia — o comportamento de degradação simétrica do sistema quando o
  backend falha em informar permissões), o subitem e a seção devem ser tratados como
  **não visíveis** (lado seguro: na dúvida, esconde).
- **Outras seções/itens não afetados**: a introdução do controle no subitem de fornecedores
  não pode alterar a visibilidade de nenhuma outra seção ou item do menu que não exija
  permissão (itens sem exigência permanecem sempre visíveis).
- **Seção com múltiplos subitens (regressão futura)**: se a seção "Gestão de Parceiros" vier
  a ganhar outro subitem visível, a seção deve permanecer visível mesmo que "Fornecedores"
  seja filtrado — a seção só desaparece quando **todos** os seus subitens são filtrados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exigir a permissão de leitura de fornecedores (`supplier:read`) para exibir o subitem "Fornecedores" no menu de navegação.
- **FR-002**: O sistema MUST ocultar a seção "Gestão de Parceiros" quando, após aplicar o filtro de permissões, ela não tiver nenhum subitem visível.
- **FR-003**: O sistema MUST tratar a ausência da permissão (inclusive lista de permissões vazia) como "não visível" para o subitem e, por consequência, para a seção.
- **FR-004**: O sistema MUST manter inalterada a visibilidade de todos os demais itens e seções do menu que não declaram permissão exigida.
- **FR-005**: O comportamento MUST ser determinado pelas permissões reais do usuário autenticado já disponíveis na identidade da sessão; a feature não introduz nova fonte de permissões nem altera como elas são obtidas.
- **FR-006**: A regra MUST ser coberta por teste automatizado puro (sem DOM) sobre a derivação do menu visível, cobrindo: (a) com a permissão → subitem e seção visíveis; (b) sem a permissão → subitem e seção ocultos; (c) permissões vazias → ocultos.

### Key Entities *(include if feature involves data)*

- **Item de menu (subitem)**: entrada navegável do menu que pode declarar opcionalmente uma
  permissão exigida; quando declarada, só é visível se o usuário a possuir.
- **Seção de menu**: agrupamento (accordion) que contém subitens; visível enquanto tiver ao
  menos um subitem visível (ou um destino próprio).
- **Permissão**: capacidade nomeada concedida ao usuário (slug). A relevante aqui é a leitura
  de fornecedores (`supplier:read`), já existente no catálogo de permissões de parceiros.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos usuários sem a permissão de leitura de fornecedores deixam de ver o subitem "Fornecedores" e a seção "Gestão de Parceiros" no menu.
- **SC-002**: 100% dos usuários com a permissão de leitura de fornecedores continuam vendo o subitem e a seção, sem regressão de navegação.
- **SC-003**: A visibilidade das demais seções/itens do menu permanece idêntica ao comportamento anterior (zero regressão para itens sem permissão exigida).
- **SC-004**: A regra de visibilidade é verificável de forma determinística por teste automatizado, cobrindo os três casos (com permissão, sem permissão, permissões vazias).

## Impacto Arquitetural (core-api) *(obrigatório se a feature toca `src/`)*

> Esta feature é **exclusivamente do frontend (web-app)**. **Não** toca o `core-api`.

- **Bounded Contexts afetados**: N/A no core-api. No web-app, toca o módulo **shell** (dado de
  menu + derivação na ViewModel) e **consome** o catálogo de permissões já exposto pelo módulo
  **partners** (`supplier:read`). Nenhuma mudança de contrato HTTP.
- **Novos agregados / Value Objects?**: Nenhum.
- **Novos eventos de domínio (outbox)?**: N/A (sem core-api).
- **Novos subcomandos de CLI?**: N/A.
- **Borda HTTP envolvida?**: NÃO. As permissões já chegam pelo fluxo de sessão existente
  (`GET /me` do core-api → identidade da sessão → contexto de rota autenticada → menu). A
  feature apenas passa a **consumir** um campo já disponível.
- **Possíveis violações da constituição (I–VIII / I–XII)?**: Nenhuma prevista. A derivação do
  menu permanece no núcleo agnóstico/puro da ViewModel (sem React, testável em node:test);
  as fronteiras de import continuam respeitadas (a UI recebe o menu já filtrado por props).

## Assumptions

- O slug correto da permissão é **`supplier:read`** — leitura/listagem de fornecedores — já
  presente no catálogo de permissões de parceiros. (Decisão de produto registrada; se o RBAC
  do backend usar outro slug para "ver o menu de fornecedores", basta trocar o valor.)
- As permissões reais do usuário já chegam de ponta a ponta até a derivação do menu pelo fluxo
  de sessão existente; **nenhuma** mudança nessa cadeia de obtenção é necessária.
- A infraestrutura de filtragem por permissão do menu (campo opcional de permissão exigida no
  subitem + derivação que filtra subitens e esconde seções vazias) **já existe** e está ligada;
  esta feature apenas **preenche** a permissão exigida do subitem de fornecedores e garante a
  cobertura de teste.
- **Fora de escopo**: o RBAC das ações de escrita dentro das telas de fornecedores (já tratado
  na feature 010 via verificação de permissão nas views); o caminho de obtenção de permissões
  pelo cliente que hoje retorna lista vazia e serve a outro fluxo; e qualquer mudança no
  core-api.
