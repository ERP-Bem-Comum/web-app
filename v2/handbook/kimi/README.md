# Kimi Code CLI nesta base — setup e operação

Guia para usar o **Kimi Code CLI** na v2 com **paridade ao Claude Code**: mesma metodologia (Spec Kit),
mesmas invariantes e os mesmos guard-rails (pnpm, eslint). As regras do projeto estão em **`v2/AGENTS.md`**
(que o Kimi lê sozinho). Referência offline das docs oficiais (versão **Node**) em [`./docs-offline/`](./docs-offline/).

> Fontes: docs oficiais do Kimi Code CLI, capturadas em 2026-06-02 (**[`docs-offline/`](./docs-offline/)**,
> versão **Node/TypeScript** `@moonshot-ai/kimi-code`) e em 2026-06-01 (`ref-*.md`, versão **legacy Python**).
>
> ⚠️ **Duas versões coexistem — use a Node.** A reescrita **Node** mudou caminhos e nomes: dados em
> **`~/.kimi-code/`** (não `~/.kimi/`), tools estilo Claude (`Read`/`Write`/`Edit`/`Bash`/`Grep`), skills de
> projeto em **`.kimi-code/skills/` e `.agents/skills/`** (`.claude/skills/` **não** é auto-descoberto!), e
> permissões via `[[permission.rules]]`. **Para a versão Node, use [`docs-offline/`](./docs-offline/) como
> fonte de verdade**; os `ref-*.md` valem só para o kimi-cli legacy e o Wire protocol. Confira `kimi --version`.
> O especialista `kimi-expert` (`.claude/agents/`) responde citando esses docs.

---

## 0. TL;DR — o que já vem pronto no repo (versionado) × o que é seu (pessoal)

A paridade foi desenhada para que **quase tudo já esteja no repo**. Ao clonar e rodar `kimi` dentro de `v2/`,
você já recebe: as 10 skills `speckit`, os 7 experts de domínio como skills, e o MCP. Só os **hooks** e as
**permissões** exigem um setup pessoal único (o Kimi não tem config de projeto — `docs-offline/configuration/overrides.md`).

| Paridade | Onde vive | Versionado? | Ação sua |
|---|---|---|---|
| Skills `speckit-*` (×10) | symlink `.agents/skills → .claude/skills` | ✅ repo | nenhuma |
| Experts de domínio (×7) | `.kimi-code/skills/*-expert/SKILL.md` | ✅ repo | nenhuma |
| MCP (ESLint + chrome-devtools) | `.kimi-code/mcp.json` | ✅ repo | nenhuma |
| Scripts dos guard-rails | `.claude/hooks/*.sh` (agnósticos) | ✅ repo | nenhuma |
| **Registro dos hooks** | `~/.kimi-code/config.toml` `[[hooks]]` | ❌ pessoal | **§4** (1×) |
| **Permissões** (allow/deny) | `~/.kimi-code/config.toml` `[[permission.rules]]` | ❌ pessoal | **§4b** (1×) |

---

## 1. Instalar e logar

```bash
curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash   # macOS/Linux
kimi --version            # confirme que é a versão Node (@moonshot-ai/kimi-code)
cd .../frontend/v2        # sempre rode o kimi DENTRO de v2/ (é o work-dir e o project root do .git)
kimi                      # abre o shell interativo
# no shell:  /login       → escolha a plataforma e cole a API key
```

Dados e config **pessoais** ficam em **`~/.kimi-code/`** (`config.toml`, sessões, credenciais, logs) —
controlado por `KIMI_CODE_HOME` (`docs-offline/configuration/data-locations.md`). **Nada disso vai pro repo.**
O `.gitignore` raiz já ignora o legacy `.kimi/`. **Nunca comite sua API key.**

> O `.kimi-code/` que existe **dentro de `v2/`** é diferente: é **versionado** e só contém o que o time
> compartilha (`mcp.json` + `skills/`). Os seus dados pessoais nunca vão para lá — vão para `~/.kimi-code/`.

---

## 2. Skills: Spec Kit + experts (já versionados — nada a configurar)

A v2 usa **Spec Kit**, e os comandos `/speckit-*` já estão versionados em `.claude/skills/`. Como a versão
Node **não** auto-descobre `.claude/skills/`, o repo traz um **symlink versionado** que o Kimi descobre:

```
.agents/skills  →  .claude/skills      (project-level dir do Kimi — docs-offline/customization/skills.md)
```

Assim, ao abrir o `kimi` dentro de `v2/`, as 10 skills aparecem como `/skill:speckit-*`. Fluxo:

```
/skill:speckit-specify   descreva a feature    →  cria a spec em specs/
/skill:speckit-plan                              →  plan.md
/skill:speckit-tasks                             →  tasks.md (ordenado por dependência)
/skill:speckit-analyze                           →  checa consistência spec/plan/tasks
/skill:speckit-implement                         →  executa as tasks
/skill:speckit-status                            →  "você está aqui" no fluxo
```

Elas chamam scripts **bash** em `.specify/scripts/bash/` — o Kimi roda via a tool `Bash` (aprove quando pedir).

**Experts de domínio (×7)** — os subagents do Claude não carregam no Kimi (ver §5), então os mais usados
foram replicados como skills em **`.kimi-code/skills/`** (também versionado):

```
/skill:css-expert            /skill:react-expert         /skill:zod-expert
/skill:typescript-expert     /skill:tanstack-start-expert
/skill:tanstack-router-expert /skill:tanstack-query-expert
```

São `type: prompt` (`docs-offline/customization/skills.md`): o modelo pode auto-invocá-las pelo `whenToUse`,
ou você chama explicitamente. Cada uma cita as fontes em `handbook/reference/...`.

> **Fallback de descoberta (Windows / symlink não resolveu):** se as skills `speckit` não aparecerem, adicione
> `extra_skill_dirs = [".claude/skills"]` no `~/.kimi-code/config.toml` (ou `kimi --skills-dir .claude/skills`
> num launch pontual). Ver `docs-offline/configuration/overrides.md`. As `*-expert` continuam vindo de
> `.kimi-code/skills/` independentemente.

> ⚠️ **Desligue o GSD para este projeto.** Se você tem um `~/.kimi-code/AGENTS.md` (ou skills) com o fluxo
> "GSD Redux", ele briga com o speckit. O `v2/AGENTS.md` já declara precedência do projeto (Project > User —
> `skills.md`), mas o ideal é remover o GSD do seu global enquanto trabalha aqui.

---

## 3. Verificar que carregou

No shell do Kimi, as skills aparecem no system prompt. Teste:

```
/skill:speckit-status     → deve reconhecer e mostrar o estado do fluxo
/skill:css-expert         → deve reconhecer o expert de CSS
```

Se `/speckit-*` não aparecer: confira o symlink (`ls -la v2/.agents/skills`) e use o fallback
`extra_skill_dirs` da §2.

---

## 4. Guard-rails (hooks) — setup pessoal único

Os **scripts** já estão versionados em `.claude/hooks/*.sh` e são **agnósticos de harness** (servem Claude e
Kimi: leem `command` no Bash e `file_path`/`path` no Write/Edit). Falta só **registrá-los** uma vez no seu
`~/.kimi-code/config.toml`. Eventos e matchers da versão **Node** (`docs-offline/customization/hooks.md`):

```toml
# ~/.kimi-code/config.toml   — rode o kimi sempre DENTRO de v2/ (o cwd do hook = cwd da sessão).

# (a) Bloqueia npm/yarn como comando — força pnpm.  (.claude/hooks/block-non-pnpm.sh)
[[hooks]]
event = "PreToolUse"
matcher = "Bash"
command = ".claude/hooks/block-non-pnpm.sh"
timeout = 5

# (b) eslint --fix no .ts/.tsx editado.  (.claude/hooks/eslint-fix.sh)
[[hooks]]
event = "PostToolUse"
matcher = "Write|Edit"
command = ".claude/hooks/eslint-fix.sh"
timeout = 60

# (c) "pronto = passa de verdade": lembra (ou roda) pnpm verify ao parar.  (.claude/hooks/verify-gate.sh)
[[hooks]]
event = "Stop"
command = ".claude/hooks/verify-gate.sh"
timeout = 120
```

Notas importantes (`docs-offline/customization/hooks.md`):

- **Cada `[[hooks]]` aceita SÓ** `event`, `matcher`, `command`, `timeout`. Campo extra/errado faz o config
  inteiro **falhar ao carregar** — não copie `args`/`statusMessage` do `settings.json` do Claude.
- O `command` roda via `sh -c` com **cwd = cwd da sessão**; por isso o path relativo `.claude/hooks/...`
  funciona quando você abre o kimi dentro de `v2/`. Em outro projeto o script não existe → *fail-open*.
- `exit 2` = **bloqueia** e devolve o stderr para a IA corrigir. `PostToolUse` é observer (retorno ignorado).
- `Stop` pode **anexar uma continuação**; o `verify-gate.sh` no modo gate real (`CLAUDE_VERIFY_GATE=1`)
  devolve os erros de typecheck/lint. Precisa de **jq** (`brew install jq`) para o caminho robusto.

```bash
# no shell do kimi, confira o registro:
/hooks
```

> Hooks são **fail-open** (erro/timeout libera a operação — `hooks.md`). **Antes de concluir**, rode você
> mesma `pnpm verify` (typecheck + lint + testes). Não confie nos hooks como única rede.

### 4b. Permissões (espelhando `.claude/settings.json`)

O Kimi não tem config de projeto, então as permissões também vão no `~/.kimi-code/config.toml` via
`[[permission.rules]]` (`docs-offline/configuration/config-files.md`):

```toml
default_permission_mode = "manual"

# Allow — leitura e os scripts do projeto
[[permission.rules]]
decision = "allow"
pattern = "Bash(pnpm *)"          # dev/build/lint/typecheck/verify/test*
[[permission.rules]]
decision = "allow"
pattern = "Bash(git status*)"
[[permission.rules]]
decision = "allow"
pattern = "Bash(git diff*)"
[[permission.rules]]
decision = "allow"
pattern = "Bash(git log*)"

# Deny — destrutivo e fora de escopo
[[permission.rules]]
decision = "deny"
pattern = "Bash(rm -rf*)"
[[permission.rules]]
decision = "deny"
pattern = "Bash(git push --force*)"
[[permission.rules]]
decision = "deny"
pattern = "Bash(git reset --hard*)"
```

> Evite `--yolo` fora de tarefas sabidamente seguras (`docs-offline/configuration/overrides.md`).

---

## 5. Subagents (paridade via skills)

O Kimi Code (Node) **não carrega** os subagents de arquivo do `.claude/agents/` — ele só tem 3 built-in
(`docs-offline/customization/agents.md`), despachados automaticamente pelo main agent:

- **`explore`** — leitura read-only do código (mapear `src/modules/auth/` antes de espelhar contratos).
- **`plan`** — desenho de arquitetura (sem escrever).
- **`coder`** — engenharia geral (lê/escreve/roda). É o default da tool `Agent`.

Você pode pedir explicitamente: *"use `explore` primeiro para mapear os arquivos relevantes"*. Para o
**conhecimento de domínio** dos experts (react/css/zod/tanstack/ts), use as **skills** da §2
(`/skill:css-expert` etc.) — é a paridade real dos antigos subagents. Os demais experts do Claude
(`docker`, `vite`, `pnpm`, `nodejs`, `core-api-consultant`) não foram replicados; consulte `handbook/` direto.

---

## 6. MCP (já versionado)

O MCP de projeto vive em **`.kimi-code/mcp.json`** (versionado), espelhando o `.mcp.json` do Claude
(`docs-offline/customization/mcp.md`): **ESLint** + **chrome-devtools**, ambos stdio via `pnpm dlx`. O Kimi
infere stdio de `command` (sem campo `type`). Para checar conexão no shell: `/mcp`. Para
adicionar/editar: `/mcp-config`.

> Stdio de projeto executa um comando local ao iniciar a sessão — só habilite em repo confiável (é o caso).

---

## 7. Fluxo de trabalho (contratos)

1. `kimi` dentro de `v2/`. Leia (a IA já recebe) `v2/AGENTS.md` + o cânone (constituição, ADRs, `auth/README.md`).
2. `/skill:speckit-specify` → `plan` → `tasks` → `analyze` → `implement`.
3. Espelhe `src/modules/auth/` em `src/modules/contracts/` (split server×client, `public-api/`).
4. **TDD**: teste antes. Não sabe se é unitário (`*.test.ts`/node:test) ou DOM (`*.spec.tsx`/vitest)? Pergunte.
5. Commits `tipo(contracts/...): ...` (sem heredoc). **PR aponta para `develop`.**

---

## 8. Referência offline (docs oficiais capturadas)

- **[`docs-offline/`](./docs-offline/)** — versão **Node** (fonte de verdade). Índice em `docs-offline/README.md`:
  `guides/`, `customization/` (mcp, skills, plugins, agents, hooks), `configuration/`, `reference/`.
- [`ref-configuration.md`](./ref-configuration.md) · [`ref-customization.md`](./ref-customization.md) ·
  [`ref-cli-wire.md`](./ref-cli-wire.md) — versão **legacy Python** + Wire protocol (consulta histórica).
