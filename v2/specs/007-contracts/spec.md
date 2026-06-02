# Spec: Módulo Contratos (v2)

> **Status:** Especificação consolidada aprovada pelo P.O.  
> **Base:** Análise forense da v1 + decisões tela a tela  
> **Data:** 2026-06-02  
> **Dependências:** API `core-api` (gaps documentados em `api-gap-analysis.md`)

---

## 1. Visão Geral

O módulo **Contratos** gerencia o ciclo de vida completo de contratos, ordens de serviço e seus aditivos. A v2 replica a funcionalidade da v1 com melhorias de UX e arquitetura (ADR-0009).

### Status canônicos do contrato
| Status | Cor | Descrição |
|--------|-----|-----------|
| `Pendente` | Laranja | Criado, aguardando assinatura |
| `Em Andamento` | Verde | Assinado e dentro da vigência |
| `Finalizado` | Azul | Vigência encerrada naturalmente |
| `Distrato` | Vermelho | Rescindido via aditivo de distrato |

> **"Vencendo" não é status.** É um filtro de UI na listagem que exibe contratos `Em Andamento` com término em ≤ 45 dias.

### Status dos aditivos
| Status | Descrição |
|--------|-----------|
| `Pendente` | Criado, aguardando documento assinado + data |
| `Homologado` | Documento assinado anexado e data informada |

> Não há status `Rascunho` para aditivos. Apenas 2 estados.

---

## 2. Rotas

| Rota | Tela | Descrição |
|------|------|-----------|
| `/contratos` | Tela 1 — Listagem | Lista paginada com filtros e busca |
| `/contratos/criar` | Tela 2 — Criar Contrato | Formulário multi-etapas (sem auto-save) |
| `/contratos/$id` | Tela 3 — Detalhes | Hero card + timeline + tabela de documentos |
| `/contratos/$id/editar` | Tela 4 — Editar | Edição de contato e observações apenas |
| `/contratos/aditivo/$id` | Tela 5 — Criar Aditivo | Formulário de aditivo com tema por tipo |

> **Rota removida da v1:** `/contratos/historico/$id` → timeline incorporada no Detalhe + modal "Ver histórico completo".

---

## 3. Telas — Decisões Consolidadas

### Tela 1 — Listagem (`/contratos`)

- **Busca:** server-side (query param `search`)
- **Colunas:** Código, Título, Tipo, Status, Valor Original, Valor Atual, Vigência
- **Saldo:** mantido como coluna (coluna de Saldo = Valor Atual − Gasto Real; enquanto não houver integração financeira, exibir placeholder "—" ou tooltip explicativo)
- **Ações:** Ver detalhes, Editar, Criar aditivo, Criar OS (ações mock se módulo não existir)
- **Filtros:** Tipo, Status, Período, Valor, Plano Orçamentário
- **Paginação:** server-side com meta `{ page, totalPages, total, limit }`
- **Export:** CSV via `GET /contracts/export.csv`

### Tela 2 — Criar Contrato (`/contratos/criar`)

- **Auto-save:** ❌ Não (MVP). Salvamento manual no botão "Criar Contrato"
- **Modal de finalização:** ✅ Mantido. Após submit bem-sucedido, modal com resumo + botão "Ir para detalhes"
- **Programa / Plano Orçamentário:** selects com valores **hardcoded mock** (enquanto módulo Financeiro não existe). Mensagem informativa: "Dados sincronizados quando o módulo Financeiro estiver disponível"
- **Dados bancários / PIX:** somente leitura (herdados do módulo Parceiros). Exibir placeholder com data da última atualização do Parceiro
- **Regras validadas:** R1 (teto OS), R2 (valor > 0), R3 (vigência obrigatória), R4 (contratante conforme tipo)

### Tela 3 — Detalhes (`/contratos/$id`)

- **Layout:** sidebar esquerda com timeline de marcos + conteúdo principal
- **Hero card:** exibe todos os dados do contrato (incluindo categorização, centro de custo, programa, plano)
- **Botão "Editar Contato":** renomeado (era "Editar Contrato" na v1). Abre modal inline para editar email, telefone e observações
- **Tabela de documentos:** tabela única. O **contrato base** é o primeiro registro; aditivos em ordem cronológica (mais recente no topo)
- **Preview de documento:** inline na tabela (clique no nome do documento → preview em modal separado, não painel lateral)
- **Timeline:** mostra marcos derivados do contrato (criação, assinatura, aditivos homologados). Cada marco tem: ícone, título, data, descrição
- **Botão "Ver histórico completo":** abre modal que consome `GET /contracts/{id}/history` e exibe todos os eventos de auditoria (incluindo eventos não-marco como upload de documento, edição de contato, etc.)

### Tela 4 — Editar (`/contratos/$id/editar`)

- **Campos editáveis:** apenas **email**, **telefone** e **observações**
- **Campos bloqueados:** todos os demais (código, valor, vigência, contratante, tipo, etc.) — são sensíveis e alteram regras de negócio
- **Modal de confirmação:** mantido ao salvar ("Alterações salvas com sucesso")
- **Edição de aditivo:** permitida enquanto status for `Pendente`. Aditivos `Homologado` são read-only

### Tela 5 — Criar Aditivo (`/contratos/aditivo/$id`)

- **Rota dedicada:** sim, `/contratos/aditivo/$id` (igual v1)
- **Tema de cores por tipo:** mantido as 5 cores distintas
  | Tipo | Cor | Uso |
  |------|-----|-----|
  | `prazo` | Azul (#298CAB) | Prorrogação de vigência |
  | `valor` | Verde (#33B266) | Acréscimo ou supressão |
  | `escopo` | Laranja (#D97706) | Sem impacto financeiro |
  | `distrato` | Vermelho (#E54D40) | Rescisão contratual |
  | `outro` | Cinza (#736961) | Reajuste, reequilíbrio… |
- **Campos do formulário:**
  | Campo | Tipo | Condição |
  |-------|------|----------|
  | Tipo | Cards selecionáveis | Obrigatório |
  | Nova Data Fim | Date | Só tipo `prazo` |
  | Impacto (acréscimo/supressão) + Valor | Toggle + Currency | Só tipo `valor` |
  | Data da Assinatura | Date | Obrigatória se documento anexado |
  | Início do Efeito | Date | Sempre (novo campo `startDate`) |
  | Resumo | Textarea | Recomendado (warning se vazio, não bloqueia) |
  | Documento Principal | Upload PDF | Até 20MB |
  | Status Preview | Badge automático | Deriva do preenchimento |
- **Homologação automática:** se arquivo + data assinatura preenchidos → status `Homologado`; senão → `Pendente`
- **Preview de PDF:** em modal separado (não painel lateral expansível). Clicar no olho abre modal de preview

---

## 4. Regras de Negócio (R1–R7)

| # | Regra | Implementação |
|---|-------|---------------|
| R1 | OS teto R$ 9.999,99 | Validação no formulário (Zod) + API |
| R2 | Valor original > 0 | Validação no formulário (Zod) + API |
| R3 | Período vigência obrigatório | Validação no formulário (Zod) + API |
| R4 | Contratante obrigatório conforme tipo | Validação no formulário (Zod) + API |
| R5 | Dados bancários/PIX read-only (herdados de Parceiros) | Exibição apenas; placeholder com data de atualização |
| R6 | Status canônicos + "Vencendo" como filtro UI | Status: Pendente, Em Andamento, Finalizado, Distrato. Vencendo = filtro (≤ 45 dias) |
| R7 | Valor Atual = original + Σ(aditivos valor homologados) | Calculado pela API (campo `currentValue`) |

---

## 5. API — Gaps Conhecidos (Resumo)

Ver documento completo: `api-gap-analysis.md`

| # | Item | Prioridade |
|---|------|------------|
| 1 | Campos de domínio no schema (`classification`, `contractModel`, `contractType`, `supplierId`, etc.) | 🔴 P1 |
| 2 | `children[]` + `files[]` no GET detalhe | 🔴 P1 |
| 3 | `PUT`/`PATCH` /contracts/{id} | 🔴 P1 |
| 4 | Filtros + paginação na listagem | 🔴 P1 |
| 5 | Meta de paginação | 🔴 P1 |
| 6 | Validar regras R1–R4 | 🔴 P1 |
| 7 | `DELETE` documento | 🔴 P1 |
| 8 | Tipos de aditivo completos | 🔴 P1 |
| 8a | `startDate` nos aditivos | 🔴 P1 |
| 9 | `contractor` aninhado | 🟡 P2 |
| 10 | `program` + `budgetPlan` aninhados | 🟡 P2 |
| 11 | `bancaryInfo` + `pixInfo` read-only | 🟡 P2 |
| 12 | Histórico completo de eventos | 🟡 P2 |
| 13 | Preview/download de documento | 🟡 P2 |
| 14 | `derivedStatus` calculado | 🟢 P3 |

---

## 6. Arquitetura Frontend v2 (ADR-0009)

- **Flat feature-first:** `src/modules/contracts/` (não replicar subpastas bind/page/viewModel da v1)
- **Camada = sufixo do arquivo:**
  - `*.controller.ts` — estado transiente (Reducer, form state)
  - `*.binding.ts` — adapter React (hook que liga VM ↔ framework)
  - `*.view-model.ts` — núcleo agnóstico (commands, derivações puras)
  - `*.page.tsx` — view burra (zero useState/useQuery/useReducer)
  - `*.mutation.ts` / `*.query.ts` — server-state agnóstico
- **Design system:** apenas tokens (`vars.*` de `#shared/ui/tokens`). Proibido hex/px/rgb crus
- **i18n:** todas as strings via `t('contracts.*')`

---

## 7. Decisões do P.O. (Changelog)

| Data | Tela | Decisão |
|------|------|---------|
| 2026-06-02 | Todas | Aditivos com apenas 2 estados (Pendente, Homologado); remover Rascunho |
| 2026-06-02 | Todas | "Vencendo" é filtro UI, não status |
| 2026-06-02 | Todas | Dados bancários/PIX read-only, herdados de Parceiros |
| 2026-06-02 | Tela 1 | Manter coluna Saldo como placeholder |
| 2026-06-02 | Tela 2 | Sem auto-save (MVP); manter modal de finalização; programa/plano hardcoded mock |
| 2026-06-02 | Tela 3 | Botão renomeado para "Editar contato"; preview PDF inline; tabela única; modal "Ver histórico completo" |
| 2026-06-02 | Tela 4 | Só contato e observações editáveis; manter modal; permitir editar aditivo Pendente |
| 2026-06-02 | Tela 5 | Rota dedicada; manter 5 cores; adicionar `startDate`; homologação automática; preview em modal separado |
