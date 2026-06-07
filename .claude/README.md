# `.claude/` — Guia do harness (COMECE AQUI)

Este diretório é o "cérebro de IA" do **Frontend v2**. Se você é novo no projeto ou
está usando o Claude/Codex aqui pela primeira vez, **leia esta página primeiro**.
Ela é o mapa; os detalhes profundos ficam no `handbook/` e no `CLAUDE.md` da raiz.

> Regra de ouro: você **não precisa decorar nada**. Quando estiver perdido, rode
> **`/speckit-status`** ("você está aqui") e, se a IA inventar algo, vá direto para o
> [Playbook: a IA alucinou](#-a-ia-alucinou--e-agora).

---

## 1. O caminho feliz (criar/evoluir uma feature)

Tudo aqui é **spec-driven**: primeiro a gente descreve, depois a IA implementa. O fluxo:

```
constitution → specify → (clarify) → plan → (checklist) → tasks → (analyze) → implement
     │            │           │         │          │          │         │          │
  princípios   o QUE e     tira      plano     checklist   lista    confere    codar
  do projeto   PORQUÊ   ambiguidade  técnico  de qualidade de tasks consistência
```

Passos entre parênteses são **opcionais**. Você quase sempre vai começar em `/speckit-specify`.

| Eu quero… | Rode |
| --- | --- |
| **Saber onde estou / o que fazer agora** | `/speckit-status` |
| Começar uma feature nova | `/speckit-specify <descrição>` |
| Tirar ambiguidade da spec (≤5 perguntas) | `/speckit-clarify` |
| Gerar o plano técnico | `/speckit-plan` |
| Gerar a lista de tasks | `/speckit-tasks` |
| Conferir consistência spec↔plan↔tasks | `/speckit-analyze` |
| Implementar as tasks | `/speckit-implement` |
| Validar antes de dizer "pronto" | `pnpm verify` |

Ao terminar cada fase, o assistente **sugere** o próximo comando automaticamente (via
`.specify/extensions.yml`) — mas só sugere, você decide. A feature ativa fica em
`.specify/feature.json`.

---

## 2. Os especialistas (subagents) — é só perguntar

Você **não precisa invocá-los manualmente**: eles disparam sozinhos pela pergunta. Todos
respondem **citando o arquivo-fonte** no `handbook/reference/` — se um deles não citar
fonte, desconfie (veja o playbook de alucinação).

| Pergunta sobre… | Agente |
| --- | --- |
| Componentes/hooks, Rules of Hooks, RSC | `react-expert` |
| Tipos, strict mode, migração TS 6→7 | `typescript-expert` |
| Estilos `.css.ts`, tokens, Atomic Design | `css-expert` |
| Server functions, BFF, auth, cookies | `tanstack-start-expert` |
| Rotas, loaders, guards | `tanstack-router-expert` |
| Cache de dados, query keys | `tanstack-query-expert` |
| Validação na borda (schemas) | `zod-expert` |
| Build, Vite, bundling | `vite-expert` |
| Runtime/segurança de Node | `nodejs-expert` |
| Dependências, supply-chain | `pnpm-expert` |
| Dockerfile/Compose/stack local | `docker-expert` |
| **Backend `core-api`** (endpoints, contratos, RBAC) | `core-api-consultant` |
| O próprio setup `.claude/` (agentes/skills/hooks) | `claude-code-expert` |

---

## 3. O que vai te impedir de errar (hooks + permissões)

Estes guardrails rodam **automaticamente**. Eles existem para te proteger — não são bugs.

| Quando | O que acontece | Por quê |
| --- | --- | --- |
| Você roda `npm`/`yarn` | **Bloqueado** | O projeto é **pnpm**. Reescreva com `pnpm`. |
| Você edita um `.ts`/`.tsx` | Roda `eslint --fix` no arquivo | Mantém o padrão automaticamente. |
| Você usa heredoc (`<<EOF`) num commit | **Bloqueado** (plugin Maestro) | Heredoc corrompe conteúdo estruturado. Use `-m "msg"` ou `git commit -F arquivo`. |
| A sessão termina após mexer em código | Lembrete para rodar `pnpm verify` | "Pronto" só vale se passa typecheck + lint + testes. |
| Comando destrutivo (`rm -rf`, `git push --force`, escrever em `core-api/`/`v1/`) | **Negado** | Pasta/operação fora do escopo deste app. |

Configuração: `settings.json` (permissões + hooks) e `hooks/*.sh`. Para o gate de
verificação **rodar de verdade** (em vez de só lembrar), exporte `CLAUDE_VERIFY_GATE=1`.

Saúde do harness: **`pnpm claude:check`** valida agentes, skills e hooks.

---

## 4. 🧭 "Estou perdido no processo"

1. Rode **`/speckit-status`**. Ele lê o estado real e te diz: a feature ativa, em que
   fase está, quantas tasks faltam e **qual o próximo comando**.
2. Se quiser o mapa inteiro, é a [seção 1](#1-o-caminho-feliz-criarevoluir-uma-feature) aqui.
3. Cada fase tem um arquivo concreto em `specs/<feature>/`: `spec.md`, `plan.md`,
   `tasks.md`. Abrir o `tasks.md` e procurar `- [ ]` mostra exatamente o que falta.

---

## 5. 🚨 "A IA alucinou" — e agora?

Sinais de alucinação: ela cita um arquivo/função/endpoint que **não existe**, inventa um
contrato do `core-api`, contradiz a constituição/ADR, ou afirma sem citar fonte. Playbook:

1. **Pare e exija fonte.** Peça: *"cite o arquivo:linha onde isso está"*. Os agentes deste
   projeto são obrigados a citar `handbook/reference/...`. **Sem citação verificável = alucinação** — não siga em frente.
2. **Reancore.** Rode `/speckit-status` para voltar ao chão firme (onde estamos, o que é real).
3. **Confronte com a verdade.** A hierarquia de fontes é (CLAUDE.md §"Fontes de verdade"):
   `.specify/memory/constitution.md` → `handbook/adr/` → `src/modules/auth/README.md` →
   `handbook/arquiteture.md`. Se a IA contradiz isso, a IA está errada.
4. **Use o especialista certo como verificador.** Ex.: dúvida de contrato do backend →
   pergunte ao `core-api-consultant` (ele só responde do código/ADR real). Ele desmente a invenção.
5. **Cheque consistência.** Se a divergência é entre spec/plan/tasks, rode `/speckit-analyze`
   (read-only) — ele aponta o que está inconsistente sem mexer em nada.
6. **Reverta o que foi inventado.** `git diff` para ver o estranho; `git checkout -- <arquivo>`
   para descartar. Nada se perde: o lint/typecheck/testes também barram código fantasma.
7. **Reduza o escopo e reinicie a task.** Alucinação cresce com contexto longo e tarefa
   vaga. Dê **uma** task isolada do `tasks.md`, aponte **o arquivo-fonte certo**, e se
   necessário rode `/clear` para começar limpo com contexto mínimo.

> Princípio: este projeto foi desenhado para que **a IA não consiga "vencer" o sistema** —
> lint barra fronteira/estilo errado, typecheck barra tipo inventado, testes barram
> comportamento falso, e os agentes citam fonte. Quando em dúvida, **confie nos
> guardrails, não na narrativa da IA.**

---

## 6. Estrutura deste diretório

```
.claude/
├── README.md            ← você está aqui
├── settings.json        permissões + hooks (versionado)
├── settings.local.json  overrides locais (MCP)
├── check.mjs            validador do harness (pnpm claude:check)
├── agents/              13 subagents especialistas
├── skills/              comandos /speckit-* (inclui /speckit-status)
└── hooks/               guardrails: block-non-pnpm, eslint-fix, verify-gate, _lib
```

Fontes de verdade mais profundas: `../CLAUDE.md`, `../handbook/` e
`../handbook/reference/_CLAUDE-WORKFLOW.md` (hooks + convenção de commit).
