# Kimi Code CLI — Configuração (referência offline)

> Capturado de `kimi.com/code/docs/en/kimi-code-cli/configuration/*` em 2026-06-01. Páginas: configuration-files,
> environment-variables, providers-and-models, data-locations, overrides-and-precedence.
> ⚠️ Doc oficial = versão "legacy" (Python→Node em migração). Confira `kimi --version`.

## Config Files

Config em **TOML ou JSON**. Local padrão: **`~/.kimi/config.toml`** (criado no 1º run). Alternativas:
`kimi --config-file /path/to/config.toml` ou `kimi --config '{"default_model": ...}'` (não podem ser usados juntos).

### Itens de topo

| Item | Tipo | Descrição |
|---|---|---|
| `default_model` | string | Modelo padrão (deve existir em `models`) |
| `default_thinking` | boolean | Thinking mode por padrão (default `false`) |
| `default_yolo` | boolean | YOLO/auto-approve por padrão (default `false`) |
| `default_plan_mode` | boolean | Inicia novas sessões em plan mode (default `false`) |
| `default_editor` | string | Editor externo (ex.: `"code --wait"`) |
| `theme` | string | `"dark"` ou `"light"` |
| `merge_all_available_skills` | boolean | Mescla skills de todos os brand dirs (default `false`) |
| `providers` / `models` / `loop_control` / `background` / `services` / `mcp` / `hooks` | table | ver abaixo |

### Exemplo completo

```toml
default_model = "kimi-for-coding"
default_thinking = false
default_yolo = false
default_plan_mode = false
default_editor = ""
theme = "dark"
merge_all_available_skills = false

[providers.kimi-for-coding]
type = "kimi"
base_url = "https://api.kimi.com/coding/v1"
api_key = "sk-xxx"

[models.kimi-for-coding]
provider = "kimi-for-coding"
model = "kimi-for-coding"
max_context_size = 262144

[loop_control]
max_steps_per_turn = 100
max_retries_per_step = 3
max_ralph_iterations = 0
reserved_context_size = 50000
compaction_trigger_ratio = 0.85

[background]
max_running_tasks = 4
keep_alive_on_exit = false
agent_task_timeout_s = 900

[services.moonshot_search]
base_url = "https://api.kimi.com/coding/v1/search"
api_key = "sk-xxx"

[services.moonshot_fetch]
base_url = "https://api.kimi.com/coding/v1/fetch"
api_key = "sk-xxx"

[mcp.client]
tool_call_timeout_ms = 60000
```

- **`providers.<n>`**: `type` (req), `base_url` (req), `api_key` (req), `env` (table), `custom_headers` (table).
- **`models.<n>`**: `provider` (req), `model` (req), `max_context_size` (req), `capabilities` (array: `thinking`, `always_thinking`, `image_in`, `video_in`).
- **`loop_control`**: `max_steps_per_turn` (100), `max_retries_per_step` (3), `max_ralph_iterations` (0; `-1`=ilimitado), `reserved_context_size` (50000), `compaction_trigger_ratio` (0.85; 0.5–0.99).
- **`background`**: `max_running_tasks` (4), `keep_alive_on_exit` (false), `agent_task_timeout_s` (900).
- **`services.moonshot_search`** → tool `SearchWeb`; **`services.moonshot_fetch`** → tool `FetchURL` (fallback local se ausente). `/login` na plataforma Kimi Code configura ambos.
- **`mcp.client.tool_call_timeout_ms`** (60000).

### `[[hooks]]` (Beta) — ver `ref-customization.md`

```toml
[[hooks]]
event = "PreToolUse"
matcher = "Shell"
command = ".kimi/hooks/safety-check.sh"
timeout = 10
```
Campos: `event` (req), `command` (req), `matcher` (regex, opcional), `timeout` (s, default 30).

### Migração JSON→TOML
Se `~/.kimi/config.toml` não existe mas `~/.kimi/config.json` sim, é migrado automaticamente (backup `config.json.bak`).

---

## Environment Variables

Override de config sem editar arquivo. Para providers `kimi` use `KIMI_*`; para `openai_legacy`/`openai_responses` use `OPENAI_*`.

| Var | Descrição |
|---|---|
| `KIMI_BASE_URL` | base URL do provider |
| `KIMI_API_KEY` | API key (útil em CI/CD) |
| `KIMI_MODEL_NAME` | identificador do modelo |
| `KIMI_MODEL_MAX_CONTEXT_SIZE` | contexto máx (tokens) |
| `KIMI_MODEL_CAPABILITIES` | `thinking,image_in` (csv) |
| `KIMI_MODEL_TEMPERATURE` / `KIMI_MODEL_TOP_P` / `KIMI_MODEL_MAX_TOKENS` | params de geração |
| `OPENAI_BASE_URL` / `OPENAI_API_KEY` | para providers OpenAI-compat |

Outras:
| Var | Descrição |
|---|---|
| `KIMI_SHARE_DIR` | diretório de dados (default `~/.kimi`); **não** afeta busca de Skills (use `--skills-dir`) |
| `KIMI_CLI_NO_AUTO_UPDATE` | `1` desliga auto-update |
| `KIMI_CLI_PASTE_CHAR_THRESHOLD` (1000) / `KIMI_CLI_PASTE_LINE_THRESHOLD` (15) | folding de paste |

---

## Providers and Models

`/login` (alias `/setup`) configura plataforma + modelo e salva em `~/.kimi/config.toml`. Plataformas: Kimi Code (com search/fetch), platform.kimi.com (CN), platform.kimi.ai (global).

Tipos de provider (`type`): `kimi`, `openai_legacy`, `openai_responses`, `anthropic`, `gemini`, `vertexai`.

```toml
[providers.anthropic]
type = "anthropic"
base_url = "https://api.anthropic.com"
api_key = "sk-ant-xxx"

[providers.openai]
type = "openai_legacy"
base_url = "https://api.openai.com/v1"
api_key = "sk-xxx"

[providers.vertexai]
type = "vertexai"
base_url = "https://xxx-aiplatform.googleapis.com"
api_key = ""
env = { GOOGLE_CLOUD_PROJECT = "your-project-id" }
```

Capabilities: `thinking` (toggle), `always_thinking` (fixo), `image_in` (paste `Ctrl-V`), `video_in`.

---

## Data Locations

Tudo em **`~/.kimi/`** (customizável por `KIMI_SHARE_DIR`; não afeta Skills).

```
~/.kimi/
├── config.toml           # config principal
├── kimi.json             # metadata (work_dirs, thinking)
├── mcp.json              # MCP servers
├── credentials/          # OAuth (perm 600)
│   └── <provider>.json
├── sessions/<work-dir-hash>/<session-id>/
│   ├── context.jsonl     # histórico (restaurado por --continue/--session)
│   ├── wire.jsonl        # eventos Wire (replay)
│   └── state.json        # título, approval, plan_mode, subagents, additional_dirs
│       └── subagents/<agent_id>/{context.jsonl,wire.jsonl,meta.json,prompt.txt,output}
├── imported_sessions/    # via kimi vis
├── plans/<slug>.md       # arquivos de plan mode (/plan clear apaga)
├── user-history/<hash>.jsonl
└── logs/kimi.log         # INFO; --debug = TRACE
```

Limpeza: apagar `~/.kimi/` zera tudo. Parcial: deletar `config.toml` (reset), `sessions/`, `plans/` (ou `/plan clear`), `user-history/`, `logs/`, `mcp.json` (ou `kimi mcp remove`), `credentials/` (ou `/logout`).

---

## Overrides and Precedence

Prioridade (maior → menor):

1. **Variáveis de ambiente** (mais alta; CI/CD)
2. **Parâmetros CLI** (no startup)
3. **Arquivo de config** (`~/.kimi/config.toml` ou `--config-file`)

CLI: `--config`/`--config-file` (exclusivos entre si); `--model`/`-m`; `--thinking`/`--no-thinking`; `--yolo`/`--yes`/`-y`; `--plan`.

```sh
KIMI_API_KEY="sk-xxx" KIMI_MODEL_NAME="kimi-for-coding" kimi
```

| Cenário | base_url | api_key | model |
|---|---|---|---|
| `kimi` | config | config | config |
| `KIMI_API_KEY=sk-env kimi` | config | **env** | config |
| `kimi --model other` | config | config | **CLI** |
| `KIMI_MODEL_NAME=... kimi` | config | config | **env** |
