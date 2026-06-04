# AGENTS.md — Frontend v2 (ERP Bem Comum)

> Porta de entrada para **agentes de IA agnósticos de ferramenta** (Kimi Code, Codex, etc.).
> Lido automaticamente pelo Kimi (`${KIMI_AGENTS_MD}` = merge de `AGENTS.md` da raiz até o cwd).
> As **regras de engenharia** NÃO vivem aqui — vivem no cânone neutro (constituição + ADRs). Este arquivo te
> aponta para ele e fixa a **metodologia** e a **paridade de ferramentas** com o Claude Code.
> **Setup completo do Kimi nesta base:** leia **`handbook/kimi/README.md`** antes de começar.

## ⚠️ Precedência (leia primeiro)

1. **As regras deste projeto sobrepõem qualquer fluxo/skill global seu.** Em especial: **NÃO use o "GSD"
   global** (`~/.kimi-code/...`). A metodologia desta base é **Spec Kit (speckit)** — ver abaixo. Se houver
   conflito, **o projeto vence** (Project > User na descoberta de skills do Kimi).
2. Existe um `CLAUDE.md` nesta mesma pasta (porta do Claude Code). O conteúdo de engenharia dele é válido e
   espelha este arquivo, mas a **fonte de verdade canônica** são os arquivos da próxima seção.

## Metodologia: Spec Kit (igual ao Claude Code)

Os dois assistentes usam o **mesmo fluxo speckit**. As skills vivem em `.claude/skills/`; o Kimi Code (Node)
as descobre via o **symlink versionado `.agents/skills → .claude/skills`** (já no repo — não auto-descobre
`.claude/skills/` diretamente). Invoque com `/skill:<nome>`:

```
/skill:speckit-specify   → cria/atualiza a spec (specs/) a partir da descrição da feature
/skill:speckit-plan      → gera o plano técnico (plan.md)
/skill:speckit-tasks     → gera tasks.md (dependency-ordered)
/skill:speckit-analyze   → consistência cruzada spec/plan/tasks
/skill:speckit-implement → executa as tasks
```

As skills speckit chamam scripts **bash** em `.specify/scripts/bash/` (agnósticos) — rode-os via `Bash`.
Se as skills `/speckit-*` não aparecerem, confira o symlink `.agents/skills` ou adicione
`extra_skill_dirs = [".claude/skills"]` no seu `~/.kimi-code/config.toml` (ver `handbook/kimi/README.md`).

## Cânone — leitura obrigatória ANTES de codar (neutro, não cita nenhuma IA)

- **`.specify/memory/constitution.md`** — a constituição (princípios I–XII). Governa `src/`.
- **`src/modules/auth/README.md`** — a **feature-modelo**. É o que você vai **espelhar** para criar contratos.
- **`handbook/adr/`** — decisões. Mínimo: `0001` (modular vertical), `0002` (errors-as-values),
  `0004` (client×server MVVM/DDD), `0009` (cliente agnóstico). Demais conforme o que tocar.

## Invariantes inegociáveis (resumo — o lint cobra)

- **Erros são valores:** `Result<T,E>` (`src/shared/primitives/result.ts`). `throw` só na borda de infra
  (`external/`, `*.server-fn.ts`), convertido para `Result` na hora. `QueryError` é a ÚNICA `Error` permitida.
- **Sem `class`** (exceto `QueryError`), **sem `this`, sem `throw`** fora da borda, **sem `any`** (`unknown` + narrowing).
- **Imutabilidade** (`Readonly<>`, `readonly T[]`, `as const`); **make illegal states unrepresentable**
  (branded types + smart constructors → `Result`; discriminated unions + `switch` exaustivo com `const _: never`).
- **Server-state ≠ UI-state:** dados remotos no TanStack Query; estado de UI em `useReducer`/máquina tagged.
- **Validação na fronteira:** Zod no input da server fn **e** no response do core-api (`*.schema.ts`).
- **Token NUNCA no browser:** o bundle do client não pode conter `accessToken`/`refreshToken`/`Bearer`/segredo.
- **Design system "só tokens":** proibido hex/rgb/hsl/px crus em `ui/` — use `vars.*` de `#shared/ui/tokens`.
- **Strings de UI = tags i18n** (`src/shared/i18n`), nunca literais. Erros internos = literais kebab-case EN.
- **TS 6→7 (`erasableSyntaxOnly`):** sem `enum`, `namespace` com runtime, parameter properties, `import =`.
- **O browser nunca fala com o `core-api` direto** — só via server functions (BFF), a única fronteira.

## Paridade de ferramentas Claude ↔ Kimi (o que muda no seu mundo)

| No Claude Code | No Kimi (você) |
|---|---|
| Skills speckit em `.claude/skills/` | **Idênticas** — via symlink versionado `.agents/skills`; use `/skill:speckit-*` |
| Subagents de domínio em `.claude/agents/` (react/zod/...) | Replicados como **skills** em `.kimi-code/skills/` (versionado): `/skill:css-expert`, `react-expert`, `zod-expert`, `typescript-expert`, `tanstack-{start,router,query}-expert`. Para explorar/planejar, use os built-in `explore`/`plan`/`coder`. |
| MCP (ESLint + chrome-devtools) | **Idêntico** — em `.kimi-code/mcp.json` (versionado). Cheque com `/mcp`. |
| Hook `block-non-pnpm` (PreToolUse) bloqueia npm/yarn | **Só se você configurar** o `[[hooks]]` no `~/.kimi-code/config.toml` (ver `handbook/kimi/README.md` §4). Senão: **só `pnpm`, na mão.** |
| Hook `eslint-fix` (PostToolUse) roda `eslint --fix` no save | **Só se você configurar.** Senão: rode `pnpm lint:fix` você mesma após editar. |

**Mesmo configurando os hooks, antes de concluir rode você mesma:** `pnpm typecheck` + `pnpm lint` + testes.

## Comandos

```bash
pnpm dev          # vite dev (porta 3000)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint (boundaries + strict + segurança)   ·   pnpm lint:fix
pnpm test         # node:test — unidades PURAS (*.test.ts, imports RELATIVOS — aliases #… só no bundler)
pnpm test:dom     # vitest + jsdom — DOM/UI (*.spec.ts(x), pode usar aliases)
pnpm test:all
```

**TDD: escreva o teste antes.** Quando não estiver claro se é teste unitário (node:test) ou de
comportamento/DOM (Vitest), **pergunte** (`AskUserQuestion`).

## Sua tarefa: o módulo de contratos

1. Comece pela spec: `/skill:speckit-specify` descrevendo a feature de contratos; depois `plan` → `tasks` →
   `analyze` → `implement`. Não pule o planejamento.
2. Crie `src/modules/contracts/` **espelhando** `src/modules/auth/` (a feature-modelo): split `server/`
   (domain → application → adapters, a server fn é a fronteira) × `client/` (data → view-model → ui), e
   `public-api/index.ts` como único ponto de import externo. As fronteiras são **enforçadas por lint**.
3. Trabalhe **só em `v2/`**. A pasta `../v1/` está **congelada** — referência de como o fluxo de contratos
   funcionava no legado, nunca alvo de desenvolvimento.
4. Commits: `tipo(<bc>/<scope>): descrição` (ex.: `feat(contracts): agregado Contract`). **Nunca use heredoc.**
5. Ao abrir o Pull Request, aponte para **`develop`** (não para `main`).
