# Codex Setup

Esta pasta contém a camada nativa do Codex para o `erp-financeiro-frontend`.

## O que existe aqui

- `config.toml`: defaults de projeto para Codex.
- `agents/`: subagents especializados para tarefas recorrentes deste frontend.
- `../.agents/skills/`: skills repo-scoped descobertas automaticamente pelo Codex.

## Princípios desta configuração

- `AGENTS.md` continua sendo a fonte principal de regras permanentes do repositório.
- `CLAUDE.md` segue como contexto arquitetural detalhado e referência operacional.
- Os subagents foram derivados dos experts existentes em `.claude/agents/`, mas convertidos para o formato nativo do Codex.
- As skills foram mantidas focadas em workflows repetíveis, não em conhecimento amplo do projeto.

## Como usar

- Peça explicitamente subagents quando quiser paralelismo ou especialização.
- Use `$frontend-feature-module` para scaffold de recurso novo no padrão do projeto.
- Use `$frontend-quality-gate` para rodar o gate final de `lint`, `format:check` e `build`.
- Use `$nextjs-docs-first` sempre que a tarefa tocar App Router, `next.config.js`, metadata, route handlers ou fronteiras server/client.
- Use `$codex-config-maintenance` quando quiser evoluir esta própria configuração do Codex.

## Prompts úteis

```text
Spawn o nextjs_app_router_specialist para revisar a abordagem desta rota antes de editar.
```

```text
$frontend-feature-module
Criar a feature Foo em (financeiro), espelhando o recurso mais próximo.
```

```text
$frontend-quality-gate
Rodar o gate final e me dizer exatamente o que bloqueia o merge.
```
