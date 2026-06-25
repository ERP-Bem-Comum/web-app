---
name: ts-quality-checker
description: >
  Roda o gate de qualidade do web-app (typecheck + lint + testes) e devolve os erros de
  forma acionável. Use antes de considerar QUALQUER tarefa de código pronta (política de
  regressão zero). Não "conserta de qualquer jeito" — reporta e corrige a causa.
---

# TS Quality Checker (gate)

## Comando único
```bash
pnpm verify     # typecheck + lint + testes (o gate canônico)
```
Se precisar isolar:
```bash
pnpm typecheck
pnpm lint           # (pnpm lint:fix para autofix)
pnpm test           # node:test (puro)   ·   pnpm test:dom (Vitest/jsdom)   ·   pnpm test:e2e (visual)
```

## Política de regressão zero
Não existe "o erro não é meu". Saídas aceitáveis:
1. **Consertar** a causa raiz.
2. **Corrigir o gate** se a regra estiver errada (com justificativa).
3. **Escalar ao humano** com diagnóstico claro — nunca fechar com vermelho.

## Disciplina
- `eslint.config.js` é a autoridade; se o texto de um doc divergir do lint, o **lint vence**.
- Não dê `--update-snapshots` no visual sem revisão humana (baseline `-linux`).
- O hook `verify-gate.sh` (Stop) já lembra do gate quando a sessão tocou código; com
  `CLAUDE_VERIFY_GATE=1` ele roda typecheck+lint automaticamente.
