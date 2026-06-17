# Feature Specification: CNPJ alfanumérico (Serpro/2026) no frontend

**Feature Branch**: `integration/cnpj-alfanumerico-027`

**Created**: 2026-06-17

**Status**: Implemented (validação manual em tela pendente — T026)

**Input**: Adequar o frontend ao novo formato de CNPJ alfanumérico já suportado pelo core-api (PR #96 / ADR-0044). Hoje o front assume "14 dígitos numéricos" em máscara, validação de formato, normalização e exibição; a partir de 07/2026 um CNPJ válido com letras seria mutilado ou rejeitado.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Cadastrar/editar parceiro com CNPJ alfanumérico (Priority: P1)

Um operador cadastra ou edita um Fornecedor, Financiador (financier) ou ACT informando um CNPJ no novo formato Serpro (ex.: `12ABC34501DE35`). Ele digita o documento no campo, vê a máscara aplicada corretamente (incluindo as letras), recebe feedback imediato de formato e, ao salvar, o documento chega ao backend normalizado e é aceito.

**Why this priority**: É o caminho que **quebra** quando o formato alfanumérico entrar em produção — sem ele, não é possível cadastrar parceiros com os novos CNPJs. É a razão de ser da feature.

**Independent Test**: Pode ser testado isoladamente cadastrando um parceiro com CNPJ alfanumérico válido e confirmando que (a) a máscara preserva letras, (b) o formato inválido é sinalizado, (c) o valor enviado ao BFF tem 14 caracteres sem máscara e em maiúsculas.

**Acceptance Scenarios**:

1. **Given** o formulário de cadastro de Fornecedor, **When** o operador digita `12abc34501de35`, **Then** o campo exibe `12.ABC.345/01DE-35` (letras em maiúsculas, agrupamento preservado) e o estado de validação fica "válido".
2. **Given** um CNPJ numérico legado `11222333000181`, **When** digitado, **Then** continua sendo mascarado/validado/enviado normalmente (retrocompatibilidade).
3. **Given** um documento com letras nas duas últimas posições `12ABC34501DEAB`, **When** digitado, **Then** o formato é sinalizado como inválido (as 2 últimas posições devem ser numéricas).
4. **Given** um CNPJ alfanumérico válido preenchido, **When** o operador salva, **Then** o BFF recebe o valor com exatamente 14 caracteres, sem pontuação e em maiúsculas.
5. **Given** um CNPJ com DV inválido `12ABC34501DE34` (formato OK, dígito verificador errado), **When** o operador salva, **Then** a validação do front/BFF (VO de domínio) sinaliza o DV inválido e a tela exibe a mensagem de erro; o core-api permanece como árbitro final.

---

### User Story 2 - Visualizar CNPJ alfanumérico já cadastrado (Priority: P1)

Um usuário abre listagens e telas de detalhe (Contratos e Financeiro / Contas a Pagar) onde aparecem CNPJs de parceiros. Documentos que contenham letras são exibidos formatados corretamente, sem caracteres perdidos.

**Why this priority**: Dados alfanuméricos podem já existir/passar a existir; exibi-los errado (com letras sumidas) corrompe a informação visível em telas de leitura amplamente usadas.

**Independent Test**: Renderizar uma linha/detalhe com um CNPJ alfanumérico e confirmar que o valor exibido bate com o documento real (com máscara), e que CPF (11 numéricos) e CNPJ numérico continuam corretos.

**Acceptance Scenarios**:

1. **Given** um contrato cujo contratado tem CNPJ `A1B2C3D4E5F668`, **When** a listagem/detalhe de Contratos é exibida, **Then** o documento aparece como `A1.B2C.3D4/E5F6-68`.
2. **Given** a coluna Fornecedor do grid de Contas a Pagar, **When** o fornecedor tem CNPJ alfanumérico, **Then** o CNPJ é exibido sob o nome com a máscara correta.
3. **Given** um documento de 11 dígitos numéricos (CPF), **When** exibido, **Then** continua formatado como CPF (`000.000.000-00`).

---

### User Story 3 - Buscar fornecedor por CNPJ no Lançar Documento (Priority: P2)

No fluxo de Lançar Documento (Financeiro), o operador filtra o picker de fornecedor digitando parte do CNPJ. A busca passa a funcionar para CNPJs alfanuméricos.

**Why this priority**: Útil, mas secundário ao cadastro/exibição; a busca por nome continua funcionando independentemente.

**Independent Test**: Digitar trecho alfanumérico de um CNPJ no picker e confirmar que o fornecedor correspondente é filtrado.

**Acceptance Scenarios**:

1. **Given** o picker de fornecedor, **When** o operador digita `ABC345` (trecho de um CNPJ alfanumérico), **Then** o fornecedor com esse CNPJ aparece nos resultados.
2. **Given** a busca por dígitos de um CNPJ numérico, **When** digitada, **Then** continua filtrando como antes.

---

### Edge Cases

- **Minúsculas**: entrada em minúsculas é normalizada para maiúsculas tanto na máscara quanto no envio.
- **Documento degenerado** (14 caracteres idênticos, ex.: `AAAAAAAAAAAAAA`): sinalizado como formato inválido no front (espelha o anti-degenerado do backend).
- **Comprimento errado** (`123`, `112223330001810`): formato inválido.
- **Colagem de valor com máscara** (`12.ABC.345/01DE-35`): aceito; a normalização remove pontuação antes de validar/enviar.
- **DV inválido com formato válido**: o VO de domínio (front/BFF) já valida DV (módulo 11, fórmula Serpro) e sinaliza; o core-api permanece como árbitro final. A mensagem de erro é exibida.
- **Heurística CPF×CNPJ** (campos `cpf-cnpj`): a decisão não pode mais se basear em "mais de 11 dígitos numéricos", pois um CNPJ alfanumérico pode ter poucos dígitos numéricos. Deve usar o comprimento normalizado total (≤11 → CPF, 12–14 → CNPJ) ou regra equivalente que não perca letras.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: A máscara de CNPJ MUST aceitar `[0-9A-Z]` nas 12 primeiras posições e `[0-9]` nas 2 últimas, preservando o agrupamento `XX.XXX.XXX/XXXX-NN`, e MUST normalizar letras para maiúsculas.
- **FR-002**: A máscara MUST NOT descartar letras ao formatar (não pode usar "somente dígitos" para CNPJ).
- **FR-003**: A normalização de CNPJ MUST produzir um valor de 14 caracteres removendo pontuação/espaços e aplicando maiúsculas, espelhando `replace(/[.\-/\s]/g, '').toUpperCase()` do core-api.
- **FR-004**: A validação de FORMATO de CNPJ no front MUST usar `^[0-9A-Z]{12}[0-9]{2}$` (após normalizar) e MUST rejeitar 14 caracteres idênticos (`^(.)\1{13}$`).
- **FR-005**: O front/BFF MUST validar o dígito verificador (DV) espelhando a fórmula Serpro (módulo 11, `charCodeAt−48`), estendendo a validação de DV já existente no VO ao formato alfanumérico (resultado idêntico para numérico — zero regressão). O **core-api permanece como árbitro final** (fonte de verdade). O front MUST NOT criar um validador de DV paralelo/divergente fora do VO de domínio.
- **FR-006**: Ao enviar CNPJ ao backend (BFF → core-api, parceiros supplier/financier/act), o valor MUST ter exatamente 14 caracteres normalizados (sem máscara, maiúsculas).
- **FR-007**: A exibição de CNPJ em listagens e detalhes (Contratos e Financeiro) MUST formatar corretamente valores alfanuméricos, sem perder caracteres.
- **FR-008**: CNPJs puramente numéricos (formato legado) MUST continuar sendo mascarados, validados, normalizados, enviados e exibidos corretamente.
- **FR-009**: CPF (11 dígitos numéricos) MUST permanecer inalterado; apenas a parte CNPJ do comportamento `cpf-cnpj` muda.
- **FR-010**: A heurística que distingue CPF de CNPJ em campos combinados MUST usar o comprimento total normalizado (não a contagem de dígitos numéricos).
- **FR-011**: O erro de backend `invalid-cnpj` (HTTP 422) MUST ser mapeado para uma mensagem i18n exibida ao usuário.
- **FR-012**: A mudança MUST ser aditiva, sem regressão no comportamento existente (política de regressão zero), com cobertura de testes para os fixtures válidos e inválidos de formato.

### Key Entities _(include if feature involves data)_

- **CNPJ (documento)**: identificador de 14 caracteres — 12 alfanuméricos `[0-9A-Z]` + 2 dígitos verificadores numéricos `[0-9]`. Representado no front como string normalizada (maiúsculas, sem máscara) no estado/envio; mascarado apenas para exibição/edição.
- **Documento de parceiro (`cpf-cnpj`)**: campo que pode conter CPF (11 numéricos) ou CNPJ (12–14, alfanumérico). A distinção é por comprimento normalizado.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% dos fixtures de CNPJ válidos do contrato do backend (`11222333000181`, `12ABC34501DE35`, `A1B2C3D4E5F668`, com máscara e em minúsculas) são digitados, mascarados, validados como "formato válido", normalizados para 14 caracteres maiúsculos e aceitos no cadastro.
- **SC-002**: 100% dos fixtures inválidos de formato (`12ABC34501DEAB`, `00000000000000`/degenerado, `123`, `112223330001810`) são sinalizados como inválidos pelo front antes do envio.
- **SC-003**: Nenhuma regressão: CPFs e CNPJs numéricos legados continuam funcionando em cadastro, validação, envio e exibição (suítes existentes verdes).
- **SC-004**: Um CNPJ alfanumérico já cadastrado é exibido com a máscara correta em Contratos (listagem + detalhe) e no grid de Contas a Pagar, sem perda de caracteres.
- **SC-005**: Um CNPJ com DV inválido (formato OK) é sinalizado pela validação do front/BFF (VO de domínio) com mensagem de erro exibida; o core-api permanece como árbitro final/autoritativo. A validação de DV de CNPJ numérico legado tem resultado idêntico ao atual (zero regressão).

## Impacto Arquitetural (frontend / BFF) _(obrigatório)_

> Feature **somente frontend** — o core-api já entregou o suporte (PR #96/ADR-0044). Nenhuma alteração no backend.

- **Bounded Contexts afetados**: [x] Parceiros (supplier/financier/act) · [x] Contratos (exibição) · [x] Financeiro (exibição + busca de fornecedor) · [x] Design System compartilhado (máscara de input).
  - O "cross-context" aqui é legítimo: a máscara/validação de CNPJ é um utilitário transversal do DS + helpers de exibição replicados por módulo. A mudança é coordenada por se tratar do mesmo dado (CNPJ).
- **Novos Value Objects / utilitários?**: alinhar o VO de CNPJ do front (`cnpj.value-object.ts`) ao kernel do core-api; possivelmente extrair um helper único de normalização/formatação/validação de CNPJ reutilizado pelas superfícies (decisão fica no plano).
- **Borda envolvida (server fn / adapters core-api)?**: sim — normalização no envio aos parceiros (supplier/financier/act). Sem novos endpoints.
- **i18n**: nova tag para `invalid-cnpj`.
- **Possíveis violações de invariantes do projeto**: nenhuma esperada — manter errors-as-values, sem `class`/`throw` fora da borda, tokens-only no DS, testes puros para a lógica de máscara/validação (node:test).

## Assumptions

- O contrato do backend confirmado pelo consultor do core-api (regex `^[0-9A-Z]{12}[0-9]{2}$`, normalização `replace(/[.\-/\s]/g,'').toUpperCase()`, DV no backend, borda `length(14)`, erro `invalid-cnpj`) é a fonte de verdade.
- O VO de CNPJ do front **já valida DV** (módulo 11) e é load-bearing — então o DV é **estendido** ao alfanumérico (fórmula Serpro, idêntico p/ numérico), não removido (política de zero regressão). O core-api permanece como árbitro final; o front não cria validador de DV paralelo fora do VO.
- A persistência/exibição de CNPJs já existentes é compatível (varchar no backend; sem migração).
- A feature é construída sobre a branch `integration/contas-a-pagar-026` (onde o módulo Financeiro existe); o PR final aponta para `develop`.
- O formato de máscara para CNPJ alfanumérico segue `XX.XXX.XXX/XXXX-NN` (X = `[0-9A-Z]`, N = `[0-9]`), mantendo a pontuação atual do CNPJ.
