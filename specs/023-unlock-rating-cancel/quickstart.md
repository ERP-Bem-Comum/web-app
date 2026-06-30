# Quickstart: avaliação de fornecedor (§1.6) + cancelamento (§1.7)

Pré-requisitos: stack local (`../ERP-INFRA/local/up.sh` → `https://app.localhost`), core-api `dev` (#32). Login: **admin.full@bemcomum.dev / DevPassw0rd!2024**.

## US1 — Avaliação de fornecedor (SC-001/SC-002)
1. Parceiros → Fornecedores → Novo: preencher o fornecedor, escolher **nível de avaliação** (Ruim/Regular/Bom/Ótimo) + **comentário** → salvar → conferir no **detalhe**.
2. Criar outro **sem avaliação** → salva normalmente (campo opcional).
3. Editar um fornecedor avaliado → nível/comentário pré-carregados; alterar e/ou limpar → reflete no detalhe.
4. Conferir que os campos estão **habilitados** (sem o aviso "indisponível").

## US2 — Cancelamento de contrato (SC-003/SC-004)
5. Em um contrato **Pendente** (criado e ainda não efetivado), acionar **Cancelar** → confirmar → vira **Cancelado** no **grid** e no **detalhe** (sem recarga); o registro não some.
6. Em um contrato **não-Pendente** (Em Andamento/Distrato/Finalizado) → a ação **não aparece**; se forçada, mensagem amigável ("apenas contratos pendentes podem ser cancelados").
7. Conferir que **Cancelado** tem rótulo/cor próprios no grid/detalhe/chips/filtro.

## SC-005 — sem regressão (a regra de ouro)
8. Fornecedor: criar/editar/listar/detalhe seguem OK (incl. conta/PIX).
9. Contrato: criar, aditivos (valor/prazo), distrato, detalhe e grid seguem OK — o status `Cancelado` novo não quebra os demais.

## Gates — antes de concluir
```bash
pnpm verify     # typecheck + lint + node:test (vs baseline)
pnpm test:dom   # vitest jsdom
```
Reportar números vs. baseline. **Não commitar** (a usuária commita após revisar).

> Coordenação: implementar **US2 (contracts) independente**; **US1 (supplier) só após a 022/ACT fechar** (mesmo módulo partners + arquivos de erro/i18n compartilhados).
