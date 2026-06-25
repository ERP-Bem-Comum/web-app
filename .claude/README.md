# .claude/ — Governança de IA do web-app

Camada que faz qualquer agente programar **seguindo a arquitetura** (ADRs + constituição +
`ARQUITETURA.md`) e **delegando às skills oficiais do TanStack** como fonte de verdade técnica.
A fonte de verdade textual é o `AGENTS.md` da raiz (o `CLAUDE.md` é só um stub `@AGENTS.md`).

## Estrutura
```
.claude/
├── agents/        # 12: 3 orquestradores + 9 experts por tecnologia
├── skills/        # 6 skills do projeto (pipeline, intent-loader, scaffolder, review, gate, adr)
├── rules/         # 6 regras path-scoped (client, server, server-fn, design-system, external, testing)
├── hooks/         # block-non-pnpm · eslint-fix · verify-gate · session-start · inject-spec (+ _lib)
├── commands/      # /init — consolida AGENTS.md e valida o catálogo
├── settings.json  # permissions + registro dos hooks
└── settings.local.json  # overrides locais (gitignore-friendly)
```

## Como usar
- **Comece pelo `web-app-orchestrator`** — ele classifica a tarefa (tamanho S/M/L), garante o
  documento `.specify` e roteia para o orquestrador de camada ou o expert certo.
- **Camada client** → `client-orchestrator` (MVVM). **Camada server** → `server-orchestrator` (BFF/DDD).
- **Skills oficiais do TanStack** (23): `pnpm dlx @tanstack/intent@latest list` / `load` — ver skill `intent-skill-loader`.
- **Antes de fechar:** `pnpm verify` (skill `ts-quality-checker`). Política de **regressão zero**.

## Manutenção
Rode `/init` após mudar ADRs/agentes/skills para reconsolidar o `AGENTS.md` e validar o catálogo.
Hierarquia de fontes (vence a de cima): `handbook/adr/` → constituição → `ARQUITETURA.md` →
`eslint.config.js`/`tsconfig.json` → `rules/` → `agents/` → skills.
