# Kimi Code CLI — docs oficiais offline (versão Node/TypeScript)

Captura fiel das 19 páginas de `https://moonshotai.github.io/kimi-code/en/` em **2026-06-02**.
Estas páginas descrevem o **kimi-code** (reescrita em **Node.js/TypeScript**, pacote
`@moonshot-ai/kimi-code`, dados em **`~/.kimi-code/`**).

> ⚠️ **Não confundir com os `../ref-*.md`** (irmãos deste diretório): aqueles descrevem a versão
> **legacy `kimi-cli`** (Python, dados em `~/.kimi/`, tools `Shell`/`ReadFile`…). Onde divergirem,
> **esta pasta (`docs-offline/`) é a fonte de verdade da versão Node**. Confirme a versão instalada
> com `kimi --version`. Migração legacy→Node: `kimi migrate` (ver `guides/migration.md`).

## Índice

### guides/
- [`getting-started.md`](./guides/getting-started.md) — instalar (`install.sh`/npm), `/login`, 1ª conversa, `~/.kimi-code/`.
- [`migration.md`](./guides/migration.md) — `kimi migrate` (kimi-cli → kimi-code); o que migra e o que não.
- [`use-cases.md`](./guides/use-cases.md) — cenários e prompts de exemplo (explorar, feature, bug, refactor, cron).
- [`interaction.md`](./guides/interaction.md) — TUI, input, `@`-mentions, Plan/YOLO, approval flow, streaming.
- [`sessions.md`](./guides/sessions.md) — **sessões e contexto**: storage, `--continue`/`--session`, `/compact`, `/fork`, export. ★
### customization/
- [`mcp.md`](./customization/mcp.md) — MCP client, `mcp.json` (user + projeto), `mcp__<server>__<tool>`, permissões.
- [`skills.md`](./customization/skills.md) — `SKILL.md`, frontmatter, **dirs de descoberta** (`.kimi-code/`, `.agents/`), `extra_skill_dirs`.
- [`plugins.md`](./customization/plugins.md) — `kimi.plugin.json`, `/plugins`, marketplace, MCP em plugins.
- [`agents.md`](./customization/agents.md) — main agent + subagents (`coder`/`explore`/`plan`), isolamento de contexto.
- [`hooks.md`](./customization/hooks.md) — `[[hooks]]`, 13 eventos, exit `0`/`2`, exemplo block `rm -rf`.
### configuration/
- [`config-files.md`](./configuration/config-files.md) — `config.toml`: campos top-level, providers/models, `[[permission.rules]]`.
- [`providers.md`](./configuration/providers.md) — `kimi`/`anthropic`/`openai`/`openai_responses`/`google-genai`/`vertexai`, `/provider`.
- [`overrides.md`](./configuration/overrides.md) — precedência (flags > config), credenciais NÃO vêm do shell, `KIMI_CODE_HOME`.
- [`env-vars.md`](./configuration/env-vars.md) — `KIMI_*` completo, `KIMI_MODEL_*` (modelo via env), logs, switches.
- [`data-locations.md`](./configuration/data-locations.md) — layout de `~/.kimi-code/`, sessions, credentials, cleanup.
### reference/
- [`kimi-command.md`](./reference/kimi-command.md) — flags do `kimi` + subcomandos (`export`/`migrate`/`upgrade`/`provider`).
- [`tools.md`](./reference/tools.md) — **tools built-in** (`Read`/`Write`/`Edit`/`Bash`/`Grep`/`Glob`/`Agent`/`Cron*`…) e aprovação.
- [`slash-commands.md`](./reference/slash-commands.md) — todos os `/comandos` da TUI + namespace `/skill:`.
- [`keyboard.md`](./reference/keyboard.md) — atalhos (Shift-Tab Plan, Ctrl-S steer, Ctrl-O, Ctrl-G…).
