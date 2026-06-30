# Research — Contas a Pagar (Fase 0)

Decisões de design tomadas para resolver as incógnitas do Technical Context. Sem `NEEDS CLARIFICATION` bloqueante (contrato da Fatia 1 mapeado; fonte de verdade `core-api/specs/FIN-DOCUMENTO-INGESTAO`).

## 1. Dinheiro: reais ↔ centavos

- **Decisão**: a borda do core-api usa **string de centavos** (`"150050"` = R$ 1.500,50). Espelhar o tratamento do módulo de **contratos** (que já lida com `{ cents }`). Na UI, entrada/edição em **reais** (máscara), conversão para centavos na borda (input da server fn) e de volta para exibição via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- **Racional**: evita float; alinhado à invariante §VIII (nativo `Intl`) e ao padrão existente.
- **Alternativas rejeitadas**: number em reais (perda de precisão); lib de dinheiro (dep desnecessária).

## 2. Datas: `YYYY-MM-DD`, exibição em UTC

- **Decisão**: vencimento/emissão trafegam como **data simples** `YYYY-MM-DD`. Exibir com `timeZone: 'UTC'` para **não recuar um dia em BRT** (lição já registrada no handoff de contratos).
- **Racional**: bug conhecido (`YYYY-MM-DD` → meia-noite UTC recua em BRT).

## 3. Alíquota de retenção: percentual ↔ basis points

- **Decisão**: UI coleta **percentual** (ex.: `5` ou `5%`); converter para **basis points** na borda (`5% → 500`; `11% → 1100`). O backend usa `rateBps` inteiro.
- **Racional**: bps é a unidade do contrato; a conversão fica na borda (model/io), não na view.

## 4. Seleção de fornecedor (e vínculos)

- **Decisão**: o form de Lançar Documento usa um **select de fornecedor** alimentado pela lista de **Fornecedores** já existente, via `#modules/partners/public-api` (cross-módulo só pelo public-api, §I). Vínculos opcionais (contrato/programa) reutilizam os módulos existentes quando houver tempo; **plano orçamentário/categoria** podem ficar como seleção simples/adiada até haver catálogo (sem fonte de dados pronta).
- **Racional**: o backend recebe `supplierRef` (uuid); a UI precisa resolver nome→id. Reuso evita duplicar dados.
- **Nota de lista**: o **grid** mostraria nome+CNPJ do fornecedor, mas o DTO de lista só traz `supplierRef` — fica para `FIN-LIST-DTO`/Fatia 2 (grid é vazio no v1, então não bloqueia).

## 5. Lista vazia (stub) → estado vazio, não erro

- **Decisão**: `GET /documents` retorna sempre `{ items: [], page, pageSize, total: 0 }`. A view-model deriva **`empty`** (não `error`) e a página renderiza um estado vazio orientativo. Chips de status e colunas são renderizados como **chrome** (sem filtrar/contar — sem backend).
- **Racional**: §V — a UI nunca trata ausência de dados como falha.

## 6. Mapeamento de status (tolerante)

- **Decisão**: `DocumentStatus` do model = união tolerante com os 7 rótulos-alvo (`Rascunho|Aberto|Aprovado|Transmitido|Recusado|Pago|Conciliado`), mapeada dos valores do backend (`Draft|Open|Approved` vivos). Status desconhecido degrada para um rótulo neutro (defesa de drift), como em contratos (`Cancelled`).
- **Racional**: doc = visão-alvo (7 status); código = 3 vivos. Modelar o alvo evita reescrita.

## 7. Controle de concorrência (`version`)

- **Decisão**: `adjust/approve/undo` exigem `version` no body, mas o backend **não verifica conflito** (Fatia 1). O front **envia** o `version` lido do detalhe, sem prometer detecção de conflito ao usuário. Como a UI dessas ações é **onda 2**, o impacto no v1 é só na camada server/client.
- **Racional**: cumprir o contrato (Zod exige) sem criar UX de conflito que o backend não sustenta.

## 8. Split de testes (TDD)

- **Decisão**: **puro (`node:test`, `*.test.ts`)** para `money`, mappers API→model, `contas-a-pagar.view-model`, `document-form.view` (preview/gating), `financial-error-tag`. **DOM (Vitest, `*.spec.tsx`)** para `contas-a-pagar.page` (empty state + navegação) e `document-form` (validações, gating de retenção, onSubmit). Escrever os testes **antes** (RED).
- **Racional**: §XI + fluxo TDD da constituição; globs disjuntos.
