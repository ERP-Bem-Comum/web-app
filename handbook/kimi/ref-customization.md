# Kimi Code CLI — Customização (referência offline)

> Capturado de `kimi.com/code/docs/en/kimi-code-cli/customization/*` em 2026-06-01. Páginas: skills, hooks,
> sub-agents (agents), mcp, plugins, official-plugins.

## Skills

Skill = diretório com um **`SKILL.md`**. No boot, o Kimi descobre as skills e injeta nome/caminho/descrição no
system prompt; a IA decide ler o `SKILL.md` conforme a tarefa.

### Descoberta (ordem de prioridade; mesmo nome → o primeiro vence)

1. **Built-in** (do pacote).
2. **User-level** (`~`), dois grupos independentes, mesclados:
   - **Brand** (mutuamente exclusivo): `~/.kimi/skills/` → `~/.claude/skills/` → `~/.codex/skills/`
   - **Generic** (mutuamente exclusivo): `~/.config/agents/skills/` (recomendado) → `~/.agents/skills/`
3. **Project-level** (só naquele projeto):
   - **Brand**: `.kimi/skills/` → **`.claude/skills/`** → `.codex/skills/`
   - **Generic**: `.agents/skills/`

> **Por isso o speckit funciona aqui:** as skills vivem em `.claude/skills/` e o brand-group de projeto cai
> para elas se não houver `.kimi/skills/`. Para mesclar TODOS os brand dirs (kimi > claude > codex), ative
> `merge_all_available_skills = true`. Também: `--skills-dir PATH` (repetível) acrescenta diretórios.

### `SKILL.md`

```markdown
---
name: code-style
description: My project's code style guidelines
---

## Code Style
- Use 4-space indentation
- ...
```

Frontmatter: `name` (1–64, `[a-z0-9-]`; default = nome do dir), `description` (1–1024), `license`,
`compatibility` (≤500), `metadata`. Boas práticas: `SKILL.md` < 500 linhas; conteúdo extra em
`scripts/`/`references/`/`assets/` (caminhos relativos).

Built-in skills: `kimi-cli-help`, `skill-creator`.

### Invocação

- `/skill:<name>` — lê o `SKILL.md` e envia como prompt. Texto extra após o comando é anexado como pedido do
  usuário: `/skill:git-commits fix user login issue`.
- Em conversa normal, a IA decide ler a skill sozinha.

### Flow Skills

`type: flow` no frontmatter + bloco Mermaid/D2 com nós `BEGIN`/`END`. Invocada por `/flow:<name>` (executa o
fluxo automaticamente em múltiplos turnos) ou `/skill:<name>` (só carrega como prompt). Nós de decisão exigem
a IA emitir `<choice>nome-do-ramo</choice>`.

---

## Hooks (Beta)

Comando shell disparado em eventos; recebe **JSON no stdin**; **exit code** controla o fluxo. Configurado em
`~/.kimi/config.toml` via `[[hooks]]`.

### 13 eventos

| Evento | Gatilho | Matcher | Contexto |
|---|---|---|---|
| `PreToolUse` | antes da tool | tool name | `tool_name`, `tool_input`, `tool_call_id` |
| `PostToolUse` | após sucesso da tool | tool name | `tool_name`, `tool_input`, `tool_output` |
| `PostToolUseFailure` | após falha | tool name | `tool_name`, `tool_input`, `error` |
| `UserPromptSubmit` | antes de processar input | — | `prompt` |
| `Stop` | fim do turno | — | `stop_hook_active` |
| `StopFailure` | fim por erro | error type | `error_type`, `error_message` |
| `SessionStart` | criar/retomar | source | `source` |
| `SessionEnd` | fechar | reason | `reason` |
| `SubagentStart` / `SubagentStop` | subagent | agent name | `agent_name`, `prompt`/`response` |
| `PreCompact` / `PostCompact` | compactação | trigger | `trigger`, `token_count` |
| `Notification` | notificação | sink | `sink`, `notification_type`, `title`, `body`, `severity` |

### Config

```toml
[[hooks]]
event = "PostToolUse"
matcher = "WriteFile|StrReplaceFile"
command = "jq -r '.tool_input.file_path' | xargs prettier --write"

[[hooks]]
event = "PreToolUse"
matcher = "WriteFile|StrReplaceFile"
command = ".kimi/hooks/protect-env.sh"
timeout = 10
```

Campos: `event` (req), `command` (req; recebe JSON no stdin), `matcher` (regex; `""` = tudo), `timeout` (s, default 30, fail-open).

### Protocolo

Stdin (exemplo): `{"session_id","cwd","hook_event_name","tool_name","tool_input":{"command":"rm -rf /"}}`.

Exit code:
| Code | Comportamento | Feedback |
|---|---|---|
| `0` | Allow | stdout (se houver) vai ao contexto |
| `2` | **Block** | stderr volta à LLM como correção |
| outro | Allow | stderr só em log |

JSON estruturado (exit 0) para decisão fina:
```json
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Use rg instead of grep"}}
```

Princípios: **fail-open** (falha/timeout = allow); hooks do mesmo evento rodam em **paralelo** (dedup de
comandos idênticos); **Stop** só re-dispara 1× (anti-loop; `stop_hook_active=true`). Ver hooks: `/hooks`.

---

## Agents and Subagents

Agent = system prompt + tools + subagents. Built-in: `default` (geral) e `okabe` (experimental). Selecione com `--agent NAME`; custom com `--agent-file PATH` (YAML).

```yaml
version: 1
agent:
  extend: default              # herda do default (ou caminho relativo p/ outro agent file)
  system_prompt_path: ./my-prompt.md
  exclude_tools:
    - "kimi_cli.tools.web:SearchWeb"
  subagents:
    coder:
      path: ./coder-sub.yaml
      description: "Handle coding tasks"
```

Campos: `extend`, `name`, `system_prompt_path`, `system_prompt_args`, `tools` (`module:ClassName`), `exclude_tools`, `subagents`.

System prompt = template Markdown com `${VAR}` e Jinja2 `{% include %}`. Vars built-in: `${KIMI_NOW}`,
`${KIMI_WORK_DIR}`, `${KIMI_WORK_DIR_LS}`, **`${KIMI_AGENTS_MD}`** (merge dos `AGENTS.md` root→cwd), `${KIMI_SKILLS}`, `${KIMI_ADDITIONAL_DIRS_INFO}`.

### Subagents embutidos (via tool `Agent`)

| Tipo | Uso | Tools |
|---|---|---|
| `coder` | engenharia geral | Shell, ReadFile, Glob, Grep, WriteFile, StrReplaceFile, SearchWeb, FetchURL |
| `explore` | exploração read-only | idem sem write |
| `plan` | planejamento/arquitetura | ReadFile, Glob, Grep, SearchWeb, FetchURL (sem Shell/write) |

Subagents **não** aninham (a tool `Agent` só existe no root). Rodam em contexto isolado, persistidos em
`subagents/<agent_id>/`, retomáveis via `resume`.

Tools built-in: `Agent`, `AskUserQuestion`, `SetTodoList`, `Shell`, `ReadFile`, `ReadMediaFile`, `Glob`,
`Grep`, `WriteFile`, `StrReplaceFile`, `SearchWeb`, `FetchURL`, `Think`, `EnterPlanMode`, `ExitPlanMode`,
`TaskList`, `TaskOutput`, `TaskStop` (+ `SendDMail` no okabe). Aprovação exigida em: Shell, write/edit, MCP, TaskStop.

---

## MCP

Servidores MCP adicionam tools. Gerência via `kimi mcp`:

```sh
kimi mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: key"
kimi mcp add --transport stdio chrome-devtools -- npx chrome-devtools-mcp@latest
kimi mcp add --transport http --auth oauth linear https://mcp.linear.app/mcp
kimi mcp list | remove <name> | auth <name> | test <name>
```

Config em `~/.kimi/mcp.json` (compatível com outros clients):

```json
{
  "mcpServers": {
    "context7": { "url": "https://mcp.context7.com/mcp", "headers": {"CONTEXT7_API_KEY": "your-key"} },
    "chrome-devtools": { "command": "npx", "args": ["chrome-devtools-mcp@latest"], "env": {"SOME_VAR": "value"} }
  }
}
```

Runtime: `/mcp` lista servidores/tools; `--mcp-config-file PATH` / `--mcp-config JSON` carregam temporário.
Todas as tools MCP pedem aprovação (exceto em YOLO). Cuidado com prompt injection — só use servidores confiáveis.

---

## Plugins (Beta)

Plugin = diretório com **`plugin.json`** declarando tools executáveis (script recebe JSON no stdin, devolve no
stdout). Diferente de Skills (conhecimento) e MCP (serviço contínuo). Instala em `~/.kimi/plugins/`.

```sh
kimi plugin install /path/to/my-plugin        # ou .zip, ou URL de git (.../tree/branch/plugins/x)
kimi plugin list | info <n> | remove <n>
```

```json
{
  "name": "my-plugin", "version": "1.0.0", "description": "...",
  "tools": [{
    "name": "greet", "description": "Generate a greeting",
    "command": ["python3", "scripts/greet.py"],
    "parameters": {"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}
  }]
}
```

`inject` injeta credenciais do Kimi (`api_key`, `base_url`) num `config_file`. Um plugin pode embarcar um
`SKILL.md` (descoberto com escopo `extra`, prioridade menor que skills de projeto/user).

### Plugin oficial: `kimi-datasource` (Beta)

Dados financeiros/macro/acadêmicos. `kimi plugin install https://cdn.kimi.com/kimi-code-plugins/kimi-datasource.zip` →
`/skill:kimi-datasource <pergunta>`. Read-only, billing por chamada. (Irrelevante para esta base.)
