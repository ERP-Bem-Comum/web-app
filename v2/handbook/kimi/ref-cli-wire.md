# Kimi Code CLI — Comando `kimi` + Wire Protocol (referência offline)

> Capturado de `kimi.com/code/docs/en/kimi-code-cli/reference/kimi-command.html` e `.../customization/wire-protocol.html`
> em 2026-06-01.

## Comando `kimi`

```sh
kimi [OPTIONS] COMMAND [ARGS]
```

### Básico
| Opção | Curto | Descrição |
|---|---|---|
| `--version` | `-V` | versão |
| `--help` | `-h` | ajuda |
| `--verbose` | | runtime detalhado |
| `--debug` | | log em `~/.kimi/logs/kimi.log` |

### Agent / Config / Modelo
| Opção | Descrição |
|---|---|
| `--agent NAME` | agent built-in (`default`, `okabe`) |
| `--agent-file PATH` | agent custom (YAML) — exclusivo com `--agent` |
| `--config STRING` / `--config-file PATH` | config TOML/JSON (exclusivos entre si) |
| `--model, -m NAME` | modelo (override do default) |

### Working dir / Sessão
| Opção | Curto | Descrição |
|---|---|---|
| `--work-dir PATH` | `-w` | diretório de trabalho (default: atual) |
| `--add-dir PATH` | | adiciona dir ao escopo (repetível) |
| `--continue` | `-C` | continua a sessão anterior do dir |
| `--session [ID]` / `--resume [ID]` | `-S`/`-r` | retoma sessão (exclusivo com `--continue`) |

### Input / Loop / UI
| Opção | Curto | Descrição |
|---|---|---|
| `--prompt TEXT` | `-p` | prompt sem modo interativo (sai ao terminar) |
| `--command TEXT` | `-c` | alias de `--prompt` |
| `--max-steps-per-turn N` / `--max-retries-per-step N` / `--max-ralph-iterations N` | | override do loop (Ralph: `0` off, `-1` ilimitado) |
| `--print` | | não-interativo (implica `--yolo`) |
| `--quiet` | | `--print --output-format text --final-message-only` |
| `--acp` / `--wire` | | modo ACP (deprecated; use `kimi acp`) / Wire (experimental) |
| `--input-format` / `--output-format` | | `text` (default) ou `stream-json` |

### Aprovação / Plan / Thinking / Skills / MCP
| Opção | Descrição |
|---|---|
| `--yolo`/`--yes`/`--auto-approve`, `-y` | auto-aprova tudo (cuidado) |
| `--plan` | inicia em plan mode (read-only até propor plano) |
| `--thinking` / `--no-thinking` | thinking mode |
| `--skills-dir PATH` | dirs extras de skills (repetível) |
| `--mcp-config-file PATH` / `--mcp-config JSON` | MCP (repetível; default `~/.kimi/mcp.json`) |

### Subcomandos
`kimi login` · `kimi logout` · `kimi info` · `kimi acp` (ACP multi-sessão) · `kimi mcp` · `kimi term` (Toad TUI) ·
`kimi export [id] [-o out.zip] [--yes]` · `kimi vis` (tracing visualizer, `-p 5495`) · `kimi web` (Web UI, `-p 5494`, `--host`).

---

## Wire Protocol

Camada de mensagens interna; `kimi --wire` expõe para UIs/integrações externas. **JSON-RPC 2.0** via stdin/stdout,
1 JSON por linha. Versão atual `1.7`.

### Métodos Client → Agent
- **`initialize`** (handshake opcional): negocia `protocol_version`, registra `external_tools`, declara
  `capabilities` (`supports_question`, `supports_plan_mode`) e `hooks` (subscriptions). Resposta traz
  `slash_commands`, `hooks.supported_events`, etc. Se não suportado → `-32601`, cai para no-handshake.
- **`prompt`** (`user_input: string | ContentPart[]`): roda um turno; emite `event`/`request`; retorna
  `status: "finished" | "cancelled" | "max_steps_reached"`.
- **`steer`**: injeta msg no turno em andamento (não inicia novo). Retorna `"steered"`.
- **`replay`**: re-emite `wire.jsonl` (read-only). Retorna contagem de events/requests.
- **`set_plan_mode`** (`enabled`): exige `supports_plan_mode` no initialize.
- **`cancel`**: cancela o turno/replay corrente.

### Métodos Agent → Client
- **`event`** (notification, sem id): `{type, payload}`. Tipos: `TurnBegin/End`, `StepBegin`, `StatusUpdate`
  (com `context_usage`, `token_usage`...), `ContentPart` (`text`/`think`/`image_url`/...), `ToolCall`,
  `ToolResult`, `SubagentEvent`, `PlanDisplay`, `HookTriggered`, `HookResolved`, etc.
- **`request`** (requer resposta): `ApprovalRequest` (resp `approve`/`approve_for_session`/`reject` + `feedback`),
  `ToolCallRequest` (external tool → devolve `ToolResult`), `QuestionRequest` (AskUserQuestion → `answers`),
  `HookRequest` (decisão `allow`/`block`).

### Códigos de erro
`-32700` JSON inválido · `-32600` request inválido · `-32601` método não encontrado · `-32602` params inválidos ·
`-32603` erro interno · `-32000` turno já em progresso/inexistente · `-32001` LLM não configurado.

### Kimi Agent (Rust)
Implementação Rust só-Wire (`MoonshotAI/kimi-agent-rs`): binário único, sem Python, só provider `kimi`, sem
login (API key manual), mesmo `~/.kimi/config.toml`. `kimi-agent` (default Wire), `--work-dir`, `--continue`,
`--session`, `--model`, `--yolo`; subcomandos `info`, `mcp`.
