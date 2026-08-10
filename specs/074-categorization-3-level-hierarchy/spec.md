# Feature Specification: Hierarquia 3 níveis (Centro de Custo → Categoria → Subcategoria) na Categorização

**Feature Branch**: `074-categorization-3-level-hierarchy`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Implementar a hierarquia 3 níveis Centro de Custo > Categoria > Subcategoria
na Categorização do Lançar Documento. O backend entregou o campo que faltava (core-api #341, mergeado
na `dev`): a categoria agora carrega `costCenterId`."

> **Variante `-fe` (frontend / web-app).** Descreve o **quê**; o **como** (cadeia BFF, derivações puras,
> cascata no controller) fica no `plan.md`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Cascatear a categorização no Lançar Documento (Priority: P1)

O operador financeiro lança um documento e precisa categorizá-lo. Hoje a Categorização do Lançar
Documento oferece **Centro de custo** e **Categoria** como duas listas INDEPENDENTES (a Categoria mostra
TODAS as categorias da taxonomia, inclusive as subcategorias, misturadas) e a **Subcategoria** é um
select permanentemente VAZIO (`subcategoriaOptions={[]}`). O operador quer escolher o Centro e ver só as
Categorias daquele centro, e escolher a Categoria e ver só as suas Subcategorias.

**Why this priority**: é a hierarquia canônica do domínio (Centro → Categoria → Subcategoria) e o único
motivo pelo qual a Subcategoria existe na tela. Sem ela o operador escolhe combinações inválidas e a
Subcategoria é chrome morto.

**Independent Test**: em `/financeiro/lancar-documento`, escolher um Centro de custo → a lista de
Categoria passa a mostrar só as categorias daquele centro; escolher a Categoria → a Subcategoria lista
só as filhas dela.

**Acceptance Scenarios**:

1. **Given** a Categorização aberta, **When** escolho um Centro de custo, **Then** a lista de Categoria
   mostra apenas as categorias de TOPO daquele centro (nunca subcategorias).
2. **Given** uma Categoria escolhida, **When** abro a Subcategoria, **Then** vejo apenas as
   subcategorias daquela categoria (as que têm `parentId` = a categoria).
3. **Given** Centro + Categoria + Subcategoria escolhidos, **When** troco o **Centro**, **Then**
   Categoria **e** Subcategoria são limpas (a seleção anterior não pertence mais ao novo centro).
4. **Given** Categoria + Subcategoria escolhidas, **When** troco a **Categoria**, **Then** a
   Subcategoria é limpa.
5. **Given** uma Subcategoria escolhida, **When** salvo o documento, **Then** o backend recebe a
   categoria **mais específica** (a FOLHA da cascata = a subcategoria).
6. **Given** só a Categoria escolhida (sem subcategoria), **When** salvo, **Then** o backend recebe a
   Categoria.

### User Story 2 - Não bloquear quem ainda não escolheu o Centro (Priority: P1)

O Centro de custo é **opcional** no lançamento. O operador que quer só categorizar (sem centro) precisa
continuar conseguindo escolher uma Categoria.

**Why this priority**: hoje o operador consegue categorizar sem centro. Uma cascata estrita que exija o
Centro primeiro seria uma **regressão** de fluxo, e — dado o estado do dado (ver Assumptions) — deixaria
a Categoria vazia para todo mundo.

**Acceptance Scenarios**:

1. **Given** nenhum Centro escolhido, **When** abro a Categoria, **Then** vejo todas as categorias de
   TOPO (sem filtro de centro) — nunca uma lista vazia.
2. **Given** um Centro escolhido cujas categorias ainda não foram atribuídas no backend, **When** abro a
   Categoria, **Then** ainda vejo as categorias SEM centro (globais) — a tela não fica inutilizável.

### User Story 3 - Cascata coerente na Conciliação (Priority: P2)

A Nova transação da Conciliação já tem a cascata de 3 níveis, mas o nível Centro→Categoria é um
**placeholder round-robin** (particiona as categorias por índice, uma atribuição FALSA) explicitamente
marcado `TODO core-api#341`. Com o campo real disponível, a Conciliação deve usar a mesma regra do
Lançar Documento.

**Why this priority**: o placeholder mostra ao operador uma relação centro→categoria que não existe. É
dívida já endereçada pelo #341; manter duas regras diferentes para a mesma hierarquia é incoerente.

**Acceptance Scenarios**:

1. **Given** a Nova transação, **When** escolho um Centro, **Then** a Categoria filtra pelo
   `costCenterId` REAL (não por partição de índice).
2. **Given** a cascata da Conciliação, **When** comparo com a do Lançar Documento, **Then** ambas usam
   as MESMAS derivações puras.

### Edge Cases

- **Centro sem categorias atribuídas**: a lista cai nas categorias sem centro (globais) — nunca vazia.
- **Categoria sem subcategorias**: a Subcategoria fica vazia (é o caso de HOJE em 100% da taxonomia).
- **Modo edição/consulta**: os `locks` por status continuam valendo — a cascata não destrava campo travado.
- **Seleção órfã**: trocar o Centro/Categoria limpa os níveis abaixo (nunca deixa uma folha que não
  pertence mais ao pai).

## Requirements _(mandatory)_

- **FR-001**: O BFF DEVE propagar `costCenterId` (`uuid | null`) da categoria do core-api até o model do
  client, tolerante a drift (ausente/inválido → `null`).
- **FR-002**: A Categoria DEVE listar apenas categorias de TOPO (`parentId === null`).
- **FR-003**: Com um Centro escolhido, a Categoria DEVE listar as de topo daquele centro **mais** as sem
  centro (globais).
- **FR-004**: Sem Centro escolhido, a Categoria DEVE listar todas as de topo.
- **FR-005**: A Subcategoria DEVE listar as categorias cujo `parentId` é a Categoria escolhida; sem
  Categoria escolhida, DEVE ser vazia.
- **FR-006**: Trocar o Centro DEVE limpar Categoria e Subcategoria; trocar a Categoria DEVE limpar a
  Subcategoria.
- **FR-007**: O lançamento DEVE enviar a FOLHA da cascata como `categoryRef` (subcategoria se escolhida,
  senão a categoria), no create e no ajuste.
- **FR-008**: As derivações da cascata DEVEM ser puras e compartilhadas entre Lançar Documento e
  Conciliação.

## Assumptions

- **O #341 entregou CAPACIDADE, não DADO.** O seed de referência do core-api
  (`reference-categories.ts`) tem 11 categorias, **todas** com `costCenterId` ausente e `parentId`
  ausente. O próprio handbook do core-api registra: _"Seed real do legado (portar a taxonomia via ACL)
  = follow-up de **dado**"_. Portanto, hoje, em ambiente real: nenhuma categoria tem centro e nenhuma
  tem pai. É isso que motiva FR-003/FR-004 (regra tolerante) — uma cascata estrita entregaria a
  Categoria SEMPRE vazia e quebraria o lançamento.
- `costCenterId === null` significa **"categoria global"** (vale para qualquer centro), não "inválida".
  As categorias de `group: 'ajuste'` (Ajuste de conciliação, Estorno) tendem a permanecer sem centro.
- O campo texto `subcategoria` do formulário é chrome órfão (não entra em nenhum input do backend) →
  vira o ref real `subcategoryRef`.

## Success Criteria _(mandatory)_

- **SC-001**: Escolher um Centro filtra a Categoria; escolher a Categoria filtra a Subcategoria — na
  tela, sem recarregar (um único fetch de referências cacheado serve os 3 selects).
- **SC-002**: Trocar o Centro limpa Categoria e Subcategoria (verificado em teste de DOM).
- **SC-003**: O documento salvo carrega a categoria mais específica escolhida.
- **SC-004**: Com o seed atual (tudo sem centro/sem pai), a Categoria continua listando as 11 categorias
  — **zero regressão** no fluxo de categorização de hoje.
- **SC-005**: O placeholder round-robin (`TODO core-api#341`) deixa de existir no código.

## Out of Scope

- Portar a taxonomia real do legado (dado) — follow-up do core-api (ACL, ADR-0048).
- Unificar a taxonomia do `financial` com a do `budget-plans` (per-plano) — follow-up/ADR do core-api.
- Enviar Centro e Categoria como refs separadas por nível (o backend recebe a folha em `categoryRef`).
- Plano Orçamentário (segue chrome, core-api#113).
