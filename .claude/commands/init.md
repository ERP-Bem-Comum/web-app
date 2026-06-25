---
description: Consolida a arquitetura (ADRs + constituição + ARQUITETURA.md) e o catálogo .claude/ em um AGENTS.md fonte-de-verdade e regenera o stub CLAUDE.md.
argument-hint: "[--check] (só valida, não escreve)"
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# /init — Consolidar a governança de IA do web-app

Você vai (re)gerar a **fonte de verdade única** e validar o `.claude/`. Não invente conteúdo:
**derive** do que está no repo.

> Nota: `/init` também é um comando nativo do Claude Code. Este arquivo o estende para o web-app.
> Se o nativo tiver precedência no seu ambiente, rode esta versão como `/web-app-init`.

## Passo 1 — Ler as fontes (em ordem de autoridade)
1. `handbook/adr/README.md` + cada ADR aceito (índice e títulos).
2. `.specify/memory/constitution.md` (§I–§XII, versão).
3. `handbook/ARQUITETURA.md` (mapa visual, hierarquia de fontes §10).
4. `package.json` (scripts e versões da stack), `eslint.config.js`/`tsconfig.json` (autoridade executável).

## Passo 2 — Sincronizar o catálogo
- `ls .claude/agents .claude/skills .claude/rules .claude/hooks` para montar as tabelas.
- `pnpm dlx @tanstack/intent@latest list` para o mapa atual das skills oficiais (contagem + pacotes).

## Passo 3 — Regenerar a fonte de verdade
- Reescreva `AGENTS.md` (raiz) com as seções: o que é o repo · hierarquia de fontes · idioma ·
  invariantes (§I–§XII resumidas) · pipeline spec-kit (escala S/M/L) · **tabela de roteamento**
  (agentes + skills do projeto + skills Intent) · comandos `pnpm` · hooks ativos · anti-padrões ·
  política de regressão zero · onde ler mais.
- Garanta que `CLAUDE.md` (raiz) seja apenas o stub: `@AGENTS.md` + (opcional) bloco speckit.
- Atualize a contagem/lista de agentes e skills se algo mudou.

## Passo 4 — Validar (sempre; com `--check` pare aqui sem escrever)
```bash
jq -e . .claude/settings.json >/dev/null && echo "settings.json OK"
for h in .claude/hooks/*.sh; do bash -n "$h" && test -x "$h" && echo "hook OK: $h"; done
ls .claude/agents | wc -l   # esperado: 12
ls .claude/rules            # esperado: 6 rules
```
Reporte divergências (ex.: agente sem `description`, skill sem `SKILL.md`, hook sem `+x`).

## Saída
Resumo em 3–5 linhas: o que foi consolidado, contagem de agentes/skills/rules, nº de skills Intent,
e qualquer pendência. Nunca toque em `src/`, `core-api/` ou `.specify/templates/`.
