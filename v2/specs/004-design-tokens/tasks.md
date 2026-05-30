# Tasks: Design Tokens Fundacionais (Design System v2)

**Input**: Design documents from `specs/004-design-tokens/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: INCLUÍDOS — TDD foi explicitamente escolhido pelo Tech Lead (teste unitário dos valores via `node:test`, escrito ANTES da implementação).

**Organization**: tarefas agrupadas por user story (spec.md). Como a feature é uma camada de tokens coesa, US1 (P1) é o MVP que entrega praticamente todo o valor; US2/US3 são reforços de governança/preparo já habilitados pela estrutura do US1.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1/US2/US3 (fases de user story); Setup/Foundational/Polish não têm label

## Path Conventions

Web app (front+BFF unificado). Design system em `src/shared/ui/tokens/`; testes em `tests/shared/ui/tokens/` (espelham `src/`, rodam por `node:test`).

---

## Phase 1: Setup

- [X] T001 Instalar as 3 fontes self-host (provenance já validada — ADR-0008): `pnpm add @fontsource-variable/inter @fontsource-variable/nunito @fontsource/jetbrains-mono`. Confirmar que `pnpm install` passa sem `TRUST_DOWNGRADE` e que `package.json`/`pnpm-lock.yaml` registram as 3 versões.
- [X] T002 Criar a estrutura de pastas do design system: diretório `src/shared/ui/tokens/` e `tests/shared/ui/tokens/` (vazios, prontos para os arquivos das próximas fases).

---

## Phase 2: Foundational (bloqueia as user stories)

> Os **valores crus** são a base de tudo: contrato, tema e testes dependem deles. Por isso vêm primeiro (mas o TESTE vem antes da implementação — TDD).

- [X] T003 [P] (TDD — teste primeiro) Escrever `tests/shared/ui/tokens/tokens.values.test.ts` (`node:test`, imports RELATIVOS) que valida o objeto de valores ANTES dele existir (deve falhar/red): asserts conforme data-model.md — `color.brand.normal === '#32C6F4'`, `color.brand.hover === '#76D9F8'`, `color.brand.onBrand === '#000000'`, `radius.lg === '0.5rem'`; nenhum valor de cor ∈ paleta institucional proibida (`#396496`, `#2d4f75`, `#1f7d55`, `#176642`); `font.family.heading` começa por Inter e `font.family.body` por Nunito, ambos terminando em fallback de sistema; cobertura — toda folha do contrato (data-model.md) tem valor não-vazio.
- [X] T004 Implementar `src/shared/ui/tokens/tokens.values.ts` — objeto `as const` PURO (sem import de framework/VE) com TODOS os valores do tema claro fiéis à v1 (tabela do data-model.md: color/radius/space/font/shadow). Rodar `pnpm test` e fazer T003 passar (green).

---

## Phase 3: User Story 1 — Dev consome tokens type-safe (Priority: P1) 🎯 MVP

**Goal**: um desenvolvedor referencia `vars.color.brand.normal`, `vars.font.family.body`, `vars.radius.lg` etc. com autocomplete e type-check, gerando CSS estático; token inexistente = erro de compilação.

**Independent Test**: criar um `.css.ts` de teste usando `vars.*` → `pnpm typecheck` passa; usar `vars.cor.inexistente` → `pnpm typecheck` falha; `pnpm build` emite CSS estático com os valores (ex.: `#32C6F4` presente).

- [X] T005 [US1] Criar `src/shared/ui/tokens/contract.css.ts` — `createThemeContract(...)` com a ESTRUTURA do data-model.md (color.brand/surface/text/border/feedback, radius, space, font.family/size/weight, shadow). Sem valores (só nomes/forma). Exporta `vars`.
- [X] T006 [US1] Criar `src/shared/ui/tokens/theme.css.ts` — `createGlobalTheme(':root', vars, <valores>)` consumindo `tokens.values.ts` (T004) e o contrato (T005). Aplica os valores do tema claro no `:root` (side-effect de registro).
- [X] T007 [P] [US1] Criar `src/shared/ui/tokens/fonts.ts` (renomeado de `.css.ts` → `.ts`: imports de @fontsource são CSS de terceiros, processados pelo Vite, não pelo vanillaExtractPlugin) — importar os 3 `@fontsource*` (side-effect que registra os `@font-face` self-host); garantir que `vars.font.family.*` (definidos no contrato/valores) referenciam as famílias com fallback de sistema. (Não depende de T005/T006 — só dos pacotes de T001.)
- [X] T008 [US1] Criar `src/shared/ui/tokens/index.ts` — API pública do `shared-ui`: re-exporta `vars` (de `contract.css.ts`) para consumo tipado pelas features. NÃO re-exporta os valores crus.
- [X] T009 [US1] Registrar os side-effects no boot: importar `theme.css.ts` e `fonts.css.ts` UMA vez em `src/app/router.tsx` (composition root). Confirmar ordem (estes imports antes do render) e que `vanillaExtractPlugin()` os processa.
- [X] T010 [US1] Validar o MVP: rodar `pnpm typecheck` (vars type-safe), `pnpm build` (CSS estático emitido) e inspecionar o `.output` confirmando que o CSS gerado contém `#32C6F4` (SC-004/SC-006). Criar um `.css.ts` descartável usando `vars` para smoke do autocomplete/erro e removê-lo após confirmar.

**Checkpoint**: ao fim do US1, a camada de tokens está completa, type-safe, gerando CSS estático com as fontes self-host — MVP entregue.

---

## Phase 4: User Story 2 — Auditoria de paleta única (Priority: P2)

**Goal**: Tech Lead confirma, num lugar legível, paleta única (ciano), nomes semânticos e ausência da paleta institucional.

**Independent Test**: ler `tokens.values.ts` + `contract.css.ts` e confirmar 1 paleta de marca, nomes por papel, zero valores institucionais (o teste T003 já trava isso automaticamente).

- [ ] T011 [US2] Reforçar/confirmar no `tests/shared/ui/tokens/tokens.values.test.ts` (já criado em T003) o assert de governança: NENHUM valor de cor pertence à paleta institucional proibida e existe exatamente UMA família de marca (ciano). Se já coberto em T003, marcar como verificado; senão, complementar.
- [ ] T012 [P] [US2] Criar `src/shared/ui/tokens/README.md` descrevendo a paleta/escala de tokens disponível, apontando para `specs/004-design-tokens/data-model.md` e reforçando "nunca hex/px cru — sempre `vars`". (Atualizar também 1 linha em `src/shared/ui/README.md` apontando para `tokens/`.)

---

## Phase 5: User Story 3 — Contrato pronto para tema futuro (Priority: P3)

**Goal**: a separação contrato↔valores permite plugar um segundo tema (ex.: dark) sem reescrever consumidores.

**Independent Test**: criar (em teste/rascunho) um segundo conjunto de valores que satisfaça o mesmo `vars` (contrato) — deve type-checar sem alterar quem consome `vars`.

- [ ] T013 [US3] Adicionar `tests/shared/ui/tokens/contract-extensibility.test.ts` (`node:test`) — typecheck/asserção de que um objeto de valores alternativo (dark fictício) satisfaz a MESMA forma do contrato (mesmas chaves), provando extensibilidade sem tocar consumidores. (Não cria tema dark real — só prova o contrato.)

---

## Phase 6: Polish & Cross-Cutting

- [ ] T014 [P] Quality gate completo: `pnpm lint` (boundaries — confirmar que `tokens/` é `shared-ui` e não importa de feature/server/external), `pnpm typecheck`, `pnpm test` (node:test verdes), `pnpm build`. Todos verdes.
- [ ] T015 [P] (Docker) Validar no stack local que o app sobe com as fontes self-host servidas pelo próprio app (sem requisição a `fonts.gstatic.com`/`googleapis`): subir `web` e checar que não há chamada externa de fonte (cumpre ADR-0008/LGPD). Atenção ao `--renew-anon-volumes` se deps mudaram.

---

## Dependencies

```
Setup (T001, T002)
   └─> Foundational TDD: T003 (teste, red) ──> T004 (values, green)
          └─> US1 (P1, MVP): T005 (contract) ─┬─> T006 (theme) ─> T009 (boot) ─> T010 (validate)
                                              └─> T007 (fonts) ──┘
                              T008 (index) depende de T005
          └─> US2 (P2): T011 (já coberto por T003) , T012 (doc)  [independente do US1 p/ leitura]
          └─> US3 (P3): T013 (extensibilidade do contrato — depende de T005)
   Polish: T014, T015 (após US1 no mínimo)
```

- **T003 antes de T004** (TDD: teste vermelho antes da implementação).
- **T004 bloqueia** T006 (theme usa os valores).
- **T005 bloqueia** T006, T008, T013.
- **T001 bloqueia** T007.
- **US2/US3** só agregam após o MVP (US1); não bloqueiam a entrega do MVP.

## Parallel Opportunities

- **T003** é `[P]` (arquivo de teste isolado) — pode ser escrito enquanto T002 cria pastas.
- **T007 (fonts)** roda em paralelo a **T005/T006** (depende só de T001, não do contrato).
- **T012 (doc)** e **T014/T015 (gates)** são `[P]` entre si.

## Implementation Strategy

- **MVP = Phase 1 + 2 + 3 (US1)**: entrega a camada de tokens completa, type-safe, com CSS estático e fontes self-host. É o que destrava os componentes futuros (átomos do login).
- **Incremento 1 (US2)**: governança/doc da paleta (T011/T012) — barato, reforça o muro anti-regressão.
- **Incremento 2 (US3)**: prova de extensibilidade do contrato (T013) — prepara dark futuro sem custo de componente.
- **Polish**: gates + validação Docker (T014/T015).
