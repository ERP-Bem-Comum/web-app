# Phase 5 — Visualizar Detalhes e Timeline (US4)

## Goal
Tela de detalhes do contrato com cards de resumo institucionais e timeline cronológica.

## Escopo

### 1. Domain — Timeline ordering
- `src/features/contracts/domain/timeline.ts`
- Função `buildContractTimeline(contract: ContractRow): TimelineItem[]`
- Regra: contrato base é sempre o primeiro nó (mais antigo)
- Aditivos ordenados por `createdAt` descendente (mais recente primeiro)
- Estados: `past` (cinza), `current` (azul), `ok` (verde)

### 2. Views — ContractDetail
- `src/features/contracts/views/components/ContractDetail.tsx`
- Cards de resumo: Valor, Período, Status, Saldo, Contratado, Tipo
- Layout com sidebar de ações (Editar, Novo Aditivo, Voltar)
- Design institucional (cores Bem Comum)

### 3. Views — ContractTimeline
- `src/features/contracts/views/components/ContractTimeline.tsx`
- Linha vertical conectando os nós
- Cada nó: data, título, descrição, badge de status
- Contrato base sempre no final da lista (visualmente embaixo)

### 4. Route — detalhes.$id.tsx
- Suspense + loader com `ensureQueryData`
- Integra ContractDetail + ContractTimeline
- Botão "Voltar" para grid

## Não-escopo
- Edição de contrato (phase 7)
- Criação de aditivo (phase 6)
- Upload de arquivos na tela de detalhes

## Critérios de aceitação
- [ ] `/contratos/detalhes/123` exibe detalhes com design institucional
- [ ] Timeline mostra contrato base como primeiro nó cronológico
- [ ] Aditivos aparecem ordenados do mais recente para o mais antigo
- [ ] Status badges seguem paleta institucional
- [ ] Build e testes passam
