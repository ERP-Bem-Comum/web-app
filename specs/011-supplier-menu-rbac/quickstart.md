# Quickstart: RBAC do menu de fornecedores

## O que muda (resumo de 1 minuto)

- **1 linha de produção**: adicionar `requiredPermission: 'supplier:read'` ao subitem
  "Fornecedores" em `src/modules/shell/client/data/menu/shell-menu.config.ts`.
- **1 bloco de teste**: regressão pura sobre o `MENU` real em
  `tests/modules/shell/client/root/root.view-model.test.ts`.

Nada mais: a derivação (`visibleMenu`) e a cadeia de permissões já existem e estão ligadas.

## Como validar localmente

```bash
# Teste puro (node:test) — o alvo desta feature:
node --experimental-strip-types --test tests/modules/shell/client/root/root.view-model.test.ts

# Gate completo antes de dar como pronto:
pnpm verify          # typecheck + lint + test
```

### Verificação manual (opcional, com a stack de pé)

Com `../ERP-INFRA/local/up.sh` no ar (`https://app.localhost`), logar com um usuário **sem**
`supplier:read` e confirmar que a seção "Gestão de Parceiros" / subitem "Fornecedores" não
aparece no menu lateral; logar com um usuário **com** `supplier:read` e confirmar que aparece.

## Checklist de conformidade (por invariante do projeto)

- [ ] **§XI MVVM / views burras**: a regra permanece em `rootViewModel.visibleMenu` (puro); a
      view recebe `visibleMenu` por props. Nenhuma alteração em `*.page.tsx`/`*.component.tsx`.
- [ ] **Núcleo agnóstico**: nenhum `react`/`@tanstack/react-*` importado em `*.view-model.ts`.
- [ ] **§I boundaries**: o slug é um literal string; `shell` não passa a importar `partners`.
- [ ] **§VII imutabilidade**: config segue `as const`; `visibleMenu` não muta o `MENU`.
- [ ] **Sem literais de UI soltas**: os rótulos de menu já existiam; nenhum texto novo de UI.
- [ ] **§IX RBAC / degradação**: `permissions: []` → subitem e seção ocultos (lado seguro).
- [ ] **Teste de regressão de config**: importa o `MENU` real e cobre os 3 casos (com/sem/`[]`).
- [ ] **Gate**: `pnpm verify` verde.

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `src/modules/shell/client/data/menu/shell-menu.config.ts` | editar (1 linha) |
| `tests/modules/shell/client/root/root.view-model.test.ts` | estender (bloco de regressão) |
| `src/modules/shell/client/root/viewModel/root.view-model.ts` | **sem alteração** (referência) |
