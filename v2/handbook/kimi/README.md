# Kimi Code CLI nesta base — setup e operação

Guia para usar o **Kimi Code CLI** na v2 com **paridade ao Claude Code**: mesma metodologia (Spec Kit),
mesmas invariantes e os mesmos guard-rails (pnpm, eslint). As regras do projeto estão em **`v2/AGENTS.md`**
(que o Kimi lê sozinho). Referência offline das docs oficiais em [`./ref-configuration.md`](./ref-configuration.md),
[`./ref-customization.md`](./ref-customization.md) e [`./ref-cli-wire.md`](./ref-cli-wire.md).

> Fontes: docs oficiais do Kimi Code CLI (`kimi.com/code/docs`), capturadas em 2026-06-01. A doc oficial
> avisa que a versão "legacy" (Python) está sendo migrada para Node — confira a versão instalada (`kimi --version`).

---

## 1. Instalar e logar

```bash
curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash   # macOS/Linux
kimi --version
cd .../frontend/v2        # sempre rode o kimi DENTRO de v2/ (é o work-dir do projeto)
kimi                      # abre o shell interativo
# no shell:  /login       → escolha a plataforma e cole a API key
```

Dados e config pessoais ficam em `~/.kimi/` (config, sessões, credenciais, logs). **Nada disso vai pro
repo** — `.kimi/` está no `.gitignore`. **Nunca comite sua API key.**

---

## 2. Config mínima (`~/.kimi/config.toml`)

O `/login` já escreve provider/model. Garanta estas duas chaves:

```toml
# Carrega skills de TODOS os brand dirs (kimi > claude > codex). Sem isto, se você tiver um
# ~/.kimi/skills/ ele pode "esconder" as skills speckit que vivem em .claude/skills/ do projeto.
merge_all_available_skills = true

# Recomendado nesta base: começar em plan mode (a IA só lê/explora antes de propor um plano).
default_plan_mode = true
```

---

## 3. Metodologia: Spec Kit (NÃO use o GSD global)

A v2 usa **Spec Kit**. As skills já estão versionadas em **`.claude/skills/`** e o Kimi as carrega
automaticamente (skills são cross-tool). Fluxo:

```
/skill:speckit-specify   descreva a feature    →  cria a spec em specs/
/skill:speckit-plan                              →  plan.md
/skill:speckit-tasks                             →  tasks.md (ordenado por dependência)
/skill:speckit-analyze                           →  checa consistência spec/plan/tasks
/skill:speckit-implement                         →  executa as tasks
```

Elas chamam scripts **bash** em `.specify/scripts/bash/` — o Kimi roda via a tool `Shell` (aprove quando pedir).

> ⚠️ **Desligue o GSD para este projeto.** Se você tem um `~/.kimi/AGENTS.md` (ou skills) com o fluxo "GSD
> Redux", ele briga com o speckit. O `v2/AGENTS.md` já declara precedência do projeto, mas o ideal é remover
> o GSD do seu global enquanto trabalha aqui (ou ele tentará impor `/gsd-progress`).

**Confira que as skills carregaram:** no shell, as skills aparecem no system prompt; teste com
`/skill:speckit-specify` (deve reconhecer). Se não, revise `merge_all_available_skills` e se não há um
`.kimi/skills/` vazio sobrepondo.

---

## 4. Guard-rails (hooks) — portar os do Claude

No Claude Code dois hooks rodam sozinhos. No Kimi eles existem também (`[[hooks]]` em `~/.kimi/config.toml`),
mas **são config pessoal sua** — configure uma vez:

```toml
# ~/.kimi/config.toml

# (a) Bloquear npm/yarn — força pnpm. Equivale ao .claude/hooks/block-non-pnpm.sh
[[hooks]]
event = "PreToolUse"
matcher = "Shell"
command = "~/.kimi/hooks/block-non-pnpm.sh"
timeout = 5

# (b) eslint --fix após editar arquivos. Equivale ao .claude/hooks/eslint-fix.sh
[[hooks]]
event = "PostToolUse"
matcher = "WriteFile|StrReplaceFile"
command = "~/.kimi/hooks/eslint-fix.sh"
timeout = 60
```

Crie os dois scripts (o Kimi entrega o contexto como **JSON no stdin**; `exit 2` = bloqueia e devolve o
stderr para a IA corrigir):

`~/.kimi/hooks/block-non-pnpm.sh`
```bash
#!/usr/bin/env bash
CMD=$(jq -r '.tool_input.command // ""')
if printf '%s' "$CMD" | grep -qE '(^|[^a-z])(npm|npx|yarn)([^a-z]|$)'; then
  echo "Use pnpm nesta base (npm/yarn/npx são proibidos). Ex.: 'pnpm install', 'pnpm dlx'." >&2
  exit 2
fi
exit 0
```

`~/.kimi/hooks/eslint-fix.sh`
```bash
#!/usr/bin/env bash
FILE=$(jq -r '.tool_input.path // .tool_input.file_path // ""')
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx)
    ( cd "$(jq -r '.cwd')" 2>/dev/null && pnpm exec eslint --fix "$FILE" >/dev/null 2>&1 ) ;;
esac
exit 0
```

```bash
chmod +x ~/.kimi/hooks/*.sh   # precisa de jq instalado (brew install jq)
# confira no shell do kimi:
/hooks
```

> Mesmo com os hooks, **antes de concluir** rode você mesma: `pnpm typecheck` + `pnpm lint` + testes.
> Hooks têm política *fail-open* (se falham/expiram, a operação passa) — não confie neles como única rede.

---

## 5. Subagents (paridade parcial)

Os 13 subagents de domínio do `.claude/agents/` (react/zod/tanstack…) são formato Claude e **não** foram
portados. Use os embutidos do Kimi via a tool `Agent`:

- **`explore`** — leitura read-only do código (mapear `src/modules/auth/` antes de espelhar contratos).
- **`plan`** — desenho de arquitetura (sem escrever).
- **`coder`** — engenharia geral (lê/escreve/roda).

---

## 6. Fluxo de trabalho (contratos)

1. `kimi` dentro de `v2/`. Leia (a IA já recebe) `v2/AGENTS.md` + o cânone (constituição, ADRs, `auth/README.md`).
2. `/skill:speckit-specify` → `plan` → `tasks` → `analyze` → `implement`.
3. Espelhe `src/modules/auth/` em `src/modules/contracts/` (split server×client, `public-api/`).
4. **TDD**: teste antes. Não sabe se é unitário (`*.test.ts`/node:test) ou DOM (`*.spec.tsx`/vitest)? Pergunte.
5. Commits `tipo(contracts/...): ...` (sem heredoc). **PR aponta para `develop`.**

---

## 7. Referência offline (docs oficiais capturadas)

- [`ref-configuration.md`](./ref-configuration.md) — config files, env vars, providers/models, data locations, overrides/precedência.
- [`ref-customization.md`](./ref-customization.md) — skills, hooks, sub-agents, MCP, plugins, plugins oficiais.
- [`ref-cli-wire.md`](./ref-cli-wire.md) — comando `kimi` (todas as flags/subcomandos) e o Wire protocol.
