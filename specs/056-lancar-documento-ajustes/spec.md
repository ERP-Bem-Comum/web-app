# Spec — Lançar Documento: competência automática, validação completa e dropdowns com dado legado · #056

- **Feature:** `056-lancar-documento-ajustes`
- **Escala:** L (3 frentes; toca financial + contracts + cross-módulo public-api)
- **Rastreio:** `HANDBOOK-financeiro-incluir-documento.md` · core-api#341 (subcategoria) · #374 (budget-plans driver)

## Frente 1 — Competência automática da Emissão

- **FR-001** — O campo **Competência** deixa de ser digitável: reflete AUTOMATICAMENTE o **mês/ano da Emissão**
  (`competenciaFromIssueDate`: ISO `YYYY-MM-DD` → `MM/AAAA`). Derivado no reducer ao setar `issueDate`; input
  read-only com tooltip. Emissão vazia → competência vazia (segue opcional, #197).

## Frente 2 — Aside "Validação" reflete os obrigatórios

- **FR-002** — `validationChecklist` passa a listar **1:1 os campos obrigatórios** do lançamento (mesmo conjunto
  do `canSubmit` / HANDBOOK §obrigatórios): **tipo, número, fornecedor, forma de pagamento, valor (bruto→líquido),
  vencimento** e — só p/ DANFE — **chave de acesso (44 dígitos)**. Itens informativos (dados bancários, ISS
  divergente, aguarda aprovação) seguem ao final (chrome). O usuário passa a ver claramente o que falta preencher.

## Frente 3 — Dropdowns com dado legado (Centro de Custo, Categoria, Subcategoria, Programa, Plano Orçamentário)

- **FR-003** — **Novo Contrato**: Centro de Custo e Categoria (antes hardcoded) passam a consumir as
  **referências reais do Financeiro** (dados legados migrados) cross-módulo via public-api (`listFinancialReferencesFn`).
  `value` = nome (o contrato guarda string livre — exibe o legado p/ seleção sem mudar contrato no backend).
- **FR-004** — **Plano Orçamentário** (Lançar Documento **e** Novo Contrato): dropdown consome `GET /budget-plans`
  (cross-módulo via public-api). `value` = id (UUID); `label` = "ano sigla versão". Hoje vazio (core-api#374:
  driver memory + sem dado) — acende sem retrabalho quando o backend subir. Degradação graciosa → [].
- **FR-005** — **Subcategoria**: sem endpoint de referência (bloqueado por **core-api#341**). Segue placeholder nas
  duas telas; handoff registrado no #341 (o front pluga pelo mesmo caminho quando a subcategoria for listável).
- Já reais (inalterados): Programa (ambas), Centro/Categoria no Lançar Documento.

## Fora de escopo / handoffs

- Persistência de Subcategoria/Plano como ref no contrato (backend). #341 (subcategoria) · #374 (dado de budget-plans).

## Gate / DoD

- `pnpm verify` verde (typecheck 0 · lint 0 erros/baseline · 1298 node:test) + `pnpm test:dom` (438 jsdom).
