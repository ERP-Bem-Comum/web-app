# Claude Code — Hooks Ativos & Convenção de Commit

Guia do ambiente Claude Code neste repositório: quais hooks interceptam ferramentas e como
escrever commits sem esbarrar neles. Doc interno (prefixo `_`) — não é espelho da doc oficial.

## Hooks ativos

| Evento | Matcher | Hook | O que faz |
| --- | --- | --- | --- |
| `PreToolUse` | `Bash` | `.claude/hooks/block-non-pnpm.sh` | Bloqueia `npm`/`yarn` **como comando** (força **pnpm**). Permite `pnpm`, `npx`, e `npm`/`yarn` dentro de strings/args (não dá mais falso-positivo em commit/grep). |
| `PostToolUse` | `Edit\|Write` | `.claude/hooks/eslint-fix.sh` | Roda `eslint --fix` no `.ts`/`.tsx` editado e marca a sessão como "suja". |
| `Stop` | — | `.claude/hooks/verify-gate.sh` | Se houve mudança de código, lembra de rodar `pnpm verify`. Com `CLAUDE_VERIFY_GATE=1`, roda typecheck+lint de verdade e devolve erros ao Claude. |
| `PreToolUse` | `Bash` | **plugin Maestro** → `policy-enforcer.js` | **Bloqueia heredoc** (`<<EOF` / `<<'EOF'`) em qualquer comando Bash. |

> Os dois hooks de projeto compartilham `.claude/hooks/_lib.sh` (parse de JSON via `jq`, fallback `node`).

> Os três primeiros são do projeto (`.claude/settings.json` + `.claude/hooks/`). O último vem do
> **plugin Maestro** instalado globalmente (`~/.claude/plugins/.../maestro/.../scripts/policy-enforcer.js`)
> — vale para todos os projetos, não está no `settings.json` deste repo.

## Regra: nunca usar heredoc em Bash

O `policy-enforcer.js` do Maestro recusa heredocs com a mensagem:

> `Heredoc corrupts structured content (YAML, Markdown, JSON) — use Write instead`

A motivação é que heredoc pode corromper conteúdo estruturado. Resultado prático: qualquer
`git commit -m "$(cat <<'EOF' ... EOF)"` **falha**. Use uma das duas alternativas abaixo.

### Alternativa 1 — string com aspas + `\n` direto no `-m`

Cada `-m` vira um parágrafo da mensagem; quebras de linha dentro das aspas são preservadas:

```bash
git commit -m "feat: título" -m "- detalhe 1
- detalhe 2"
```

### Alternativa 2 — `Write` num arquivo temp + `git commit -F`

Mais robusta para mensagens longas/estruturadas (foi o que funcionou de primeira no commit do
átomo Button):

```bash
# 1. Write o texto da mensagem em /tmp/commit-msg.txt
# 2.
git commit -F /tmp/commit-msg.txt
# 3. rm /tmp/commit-msg.txt
```

## Operações git seguras (evitar terminal embaralhado)

Causa de um incidente real: disparar **tool calls dependentes em paralelo** (no mesmo bloco)
— ex.: `Write` da mensagem + `git add` + `git commit -F` juntos. Como `commit` depende do
arquivo e do `add`, eles correm em paralelo e os outputs voltam fora de ordem/embaralhados,
o que pode induzir diagnóstico errado e loop.

Regras:
- **Nunca paralelize chamadas com dependência.** `git add` → `git commit` → `git log` são
  sequenciais: aguarde cada uma, OU encadeie num **único** `Bash` com `&&`.
- Paralelize só o que é genuinamente independente (ex.: editar 3 arquivos distintos).
- Para inspecionar git com saída **multi-linha** (`git log`, `git diff`), redirecione para um
  arquivo e leia com a tool `Read` — evita ruído de tty. Ex.: `git log -6 > /tmp/log.txt`.
- Mensagem de commit: `Write` em arquivo temp + `git commit -F` (ver "nunca usar heredoc").

## Convenção de mensagem de commit (projeto)

Padrão observado no histórico: `tipo(escopo): descrição` em português, corpo em bullets, e
trailer `Co-Authored-By` quando gerado com o Claude. Exemplo real:

```
feat(ui): átomo Button — primário, burro, só-tokens (005 T004-T006)

- button-state.ts: lógica pura de estado (loading > disabled > normal)
- button.tsx: BURRO — loading||disabled → disabled + sem onClick

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```
