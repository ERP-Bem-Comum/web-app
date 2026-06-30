# Quickstart — Conciliação Bancária (dev + verificação do fluxo)

## Subir a stack (back + front + Caddy)

```bash
../ERP-INFRA/local/up.sh        # → https://app.localhost (shell autenticado)
# core-api precisa do PR #152 (Conciliação) na imagem/branch usada pelo override local
```

## Rodar só o front (sem a stack)

```bash
pnpm dev                        # vite dev :3000 (server fns chamam o core-api configurado)
```

## Navegação

- Sidebar → **Financeiro → Conciliação** → `/financeiro/conciliacao` (**TELA 1**, grid de contas).
- Clicar numa conta ativa → `/financeiro/conciliacao/$accountId` (**TELA 2**, workspace).
- MVP (até #168): TELA 1 é chrome honesto; entrar no workspace usa o **seletor temporário de conta do
  seed** (D2) — o `$accountId` da rota vem dessa conta de seed.

## Fluxo de verificação manual (caminho feliz + exceções)

1. **Importar** (US2): no workspace, Importar → OFX/CSV → escolher arquivo → ver
   "{N} importadas · {M} duplicadas · período". Reimportar o mesmo arquivo → "0 importadas / N
   duplicadas" (SC-003). PDF aparece **desabilitado** (#145).
2. **Conciliar por sugestão** (US1): selecionar uma transação com palpite **alta** → revisar match card
   → **Conciliar** (≤3 cliques, SC-001) → transação sai dos pendentes, progresso X/N sobe. **Rejeitar**
   → some e não reaparece.
3. **N:1 / parcial** (US3): aba **Buscar/Criar vários** → marcar ≥2 títulos Pago → ver soma vs valor →
   se diferir, classificar (Juros/Multa/Desconto/Tarifa/Parcial); **Conciliar fica bloqueado** enquanto
   não balancear (SC-004).
4. **Manual** (US4): aba **Nova transação** → escolher tipo; Transferência/Aplicação/Resgate exigem
   **conta de destino + confirmação consciente** antes de habilitar.
5. **Desfazer** (US5): abrir detalhes de uma conciliada → Desfazer (motivo opcional) → volta a pendente.
6. **Fechar período** (US7): com tudo tratado → Fechar período → status "fechado"; com pendências →
   bloqueado. **Exportar** fica **desabilitado** (#173).
7. **Extrato** (US8): aba Extrato → filtros (entradas/saídas/conciliados/pendentes) + período
   (client-side).

## Gates (antes de dar como pronto)

```bash
pnpm verify                     # typecheck + lint + testes puros
pnpm test:dom                   # Vitest/jsdom (UI/hooks)
pnpm test:visual                # Playwright (precisa da stack de pé) — após mexer em UI/CSS
```

- **TDD**: escrever o teste antes (puro `*.test.ts` p/ mappers/balanceamento/view-model; DOM `*.spec.tsx`
  p/ interação). Ver `plan.md` › Plano de testes W0.
- **Sem regressão** em Contas a Pagar (rodar a suíte existente).
- **PR → `develop`** (branch `034-bank-reconciliation`).

## Conferência de fidelidade (UI)

- Fonte: mocks em `Desktop/CONSULTORIA/Financeiro/conciliacao/` (grid_conciliacao + conciliacao_bancaria).
- Figma MCP p/ valores exatos: fileKey `ypWvBc8kzHJuZzejsGQDUQ`, nodes **8:6** (tela 1) e **8:7** (tela 2)
  via `get_design_context`/`get_screenshot`.
- Traduzir literais do mock (teal/Inter/Mono) para `vars.*` (tokens-only) — o lint reprova hex/px crus.
