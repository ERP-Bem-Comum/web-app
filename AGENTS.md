# AGENTS.md — ERP Bem Comum (raiz do monorepo)

> Porta de entrada para **agentes de IA agnósticos** (Kimi Code, etc.). Esta pasta **não tem código próprio**:
> agrega projetos independentes. O Kimi mescla este `AGENTS.md` com o da subpasta onde você trabalha.

## Para onde ir

| Pasta | O que é | Estado | Guia |
|---|---|---|---|
| **`v2/`** | Frontend + BFF unificado (TanStack Start, React 19, pnpm 11, vanilla-extract, Zod 4, TS strict) | **Ativo — é aqui** | **`v2/AGENTS.md`** |
| `v1/` | Frontend antigo do ERP financeiro (Next/MUI) | **Legado congelado** | só consulta |

**Regra de ouro:** quase todo pedido é sobre a **v2**. Só toque em `v1/` se o usuário **confirmar**
explicitamente. A v1 serve de referência de *como um fluxo funcionava* — para portar à v2, nunca para copiar
padrões (a v2 tem invariantes próprias, cobradas por lint).

## Antes de codar na v2

1. Leia **`v2/AGENTS.md`** (precedência, metodologia speckit, invariantes, sua tarefa).
2. Faça o **setup do Kimi** desta base: **`v2/handbook/kimi/README.md`**.
3. Metodologia = **Spec Kit** (`/skill:speckit-*`). **Não** use fluxos globais (ex.: "GSD") aqui.

## Convenções do monorepo

- **Gerenciador de pacotes:** `v2` usa **pnpm 11** (nunca `npm`/`yarn`). `v1` usa Yarn 4. Nunca misture.
- **Commits:** nunca use heredoc (`<<EOF`). Convenção `tipo(<bc>/<scope>): descrição`.
- **`core-api`** (backend) não é mais o submódulo `v2/core-api/`: agora é a pasta-irmã `../ERP-CONTRACTS/`
  no mono_repo (ver `../CLAUDE.md`). Não é alvo de dev a partir do front. O browser nunca fala com ele
  direto — só via server functions (BFF) da v2. Infra Docker única em `../infraestrutura/`.
