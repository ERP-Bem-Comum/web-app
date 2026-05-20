---
name: frontend-quality-gate
description: Executa o gate final deste frontend. Use antes de declarar uma mudança pronta quando houver código compilável alterado.
---

# frontend-quality-gate

Use quando:
- a tarefa alterar `src/`, `lib/`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js` ou `package.json`
- for preciso confirmar se a mudança está pronta para review

Não use quando:
- a alteração for apenas em docs, `.codex/`, `.agents/skills/` ou `.claude/`
- o usuário quiser só uma análise sem executar checks

## Gate obrigatório

1. Rode `pnpm lint`.
2. Rode `pnpm format:check`.
3. Rode `pnpm build`.

## Regras

- Não invente `pnpm test`; este projeto não tem suíte de testes.
- Não substitua o gate por `tsc --noEmit`; `next.config.js` ignora erros de build de TypeScript.
- Se algo falhar, reporte o comando, o erro principal e o impacto prático.
- Se tudo passar, informe explicitamente que o gate ficou verde.

## Entrega esperada

- status de cada comando
- bloqueios reais primeiro
- veredito final claro: verde ou bloqueado
