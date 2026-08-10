# Spec 060 — Ações do menu "…" + Insights do Plano Orçamentário (Grupo A)

## Contexto

Fases 1 (criar) e 2 (detalhe) do Planejamento já leem/escrevem o core-api real
(`/api/v2/budget-plans`). Esta fatia (Grupo A) liga as AÇÕES do menu "…" (lista + detalhe) e o
botão **Insights** aos endpoints reais, e deixa **desativado com estado honesto** o que o backend
ainda não expõe. Regra da P.O.: "monte tudo que já está ativado no backend; o que não tiver, deixe
desativado" (botão `disabled` + tooltip i18n, nunca sumir).

## User stories

- **US1 — Aprovar Plano**: `POST /:id/approve` (sem body → plano atualizado). Confirmação simples.
- **US2 — Iniciar Calibração**: `POST /:id/start-calibration` (sem body → plano atualizado). Confirmação simples.
- **US3 — Criar cenário desse plano**: `POST /:id/scenery` body `{ name: 1..255 }` → cenário criado. Confirmação pede NOME.
- **US4 — Exportar CSV**: `GET /:id/generate-csv` → `text/csv` (`plano-{id}.csv`). BFF busca os bytes; client dispara o download.
- **US5 — Insights**: `GET /:id/insights` → `{ current, previousYears[] }`. Botão do detalhe deixa de ser `disabled`; abre modal com o comparativo real.

Após approve/calibration/scenery: **invalidar** a lista (`planejamentoListQueryKey`) e o detalhe
(`['budget-plans','plan-detail', id]`) para refletir status/versão novos.

## Desativados (sem endpoint) — `disabled` + tooltip

- **Compartilhar plano** (share) — sem endpoint.
- **Planejado × Realizado** (planned-vs-actual) — sem endpoint (realizado é do Financeiro).
- **Excluir Plano** (delete) — não existe `DELETE /budget-plans/:id` (só `/:id/budgets/:budgetId`, Grupo C).
- **Filtro por Rede** (detalhe) — depende de `GET /options` que hoje dá 500 (core-api#394). Passador de mês/semestre é client-side e permanece.

## Erros como valores (§V)

Erros de ciclo de vida (409) mapeados por STATUS (o core-api colapsa o slug num `code` público — OWASP):

- approve 409 → `budget-plan-already-approved`
- start-calibration 409 → `budget-plan-invalid-transition`
- create-scenery 409 → `budget-plan-not-approved`
- 404 → `budget-plan-not-found`; 401 → `unauthorized`.

**Gap conhecido**: os três 409 de ciclo de vida são indistinguíveis por status; o mapeamento é
por CONTEXTO do endpoint (a mensagem PT é a mais provável para cada ação). Handoff ao backend se
precisar de granularidade fina (slug/`code` estável).

## Fora de escopo

Centros de custo (Grupo B); Orçamento por rede + cálculo (Grupo C). Não mexer.
</invoke>
