# Tasks: Átomos do Design System (componentes do login)

**Input**: Design documents from `specs/005-design-system-atoms/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: INCLUÍDOS — TDD (Tech Lead): **ambos** — unitário de variantes (`node:test`) + comportamento/DOM (Vitest + @testing-library), escritos ANTES da implementação.

**Organization**: por user story. US1 (P1) = os componentes (MVP, entrega todo o valor). US2 (P2) = governança anti-regressão (lint) — já configurada na spec 004; aqui só se confirma que morde nestes componentes.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: paralelizável (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1/US2; Setup/Polish sem label

## Path Conventions

Design system em `src/shared/ui/{atoms,molecules}/<nome>/`. **Padrão de arquivos (fixo, extensível):** `<nome>.component.tsx` + `<nome>.css.ts` + `index.ts` sempre; `<nome>.variants.ts` quando há lógica pura de variante/estado (ex.: Button); `<nome>.controller.ts` quando há estado transiente. Doc: `src/shared/ui/README.md` (§Anatomia). Testes em `tests/shared/ui/{atoms,molecules}/` — `*.test.ts` (node:test) e `*.spec.tsx` (Vitest). Asset em `public/images/`. Tokens consumidos via `vars` de `#shared/ui/tokens`.

---

## Phase 1: Setup

- [X] T001 Portar o asset do logo: criar `public/images/` e copiar `logo-bem-comum.png` da v1 (`../v1/public/images/logo-bem-comum.png`). Confirmar que o Vite serve `public/` (default) — o caminho público será `/images/logo-bem-comum.png`.
- [X] T002 Criar a árvore de pastas do design system: `src/shared/ui/atoms/{button,input,checkbox,logo,card}/`, `src/shared/ui/molecules/field/`, e `tests/shared/ui/atoms/`, `tests/shared/ui/molecules/`.

---

## Phase 2: Foundational (bloqueia as user stories)

> Não há "núcleo" novo além dos tokens (spec 004, já prontos) e dos barris. Os barris vêm DEPOIS dos componentes (reexportam). Esta fase só garante o ponto de entrada do DS.

- [X] T003 Criar o barrel raiz `src/shared/ui/index.ts` reexportando `vars` de `./tokens/index.ts` (placeholder dos átomos a completar conforme cada um nascer). Garante a porta única `#shared/ui` (tipo `shared-ui`, consumível por features) — research.md R4.

---

## Phase 3: User Story 1 — Componentes consumíveis (Priority: P1) 🎯 MVP

**Goal**: 5 átomos + molécula Field disponíveis, type-safe, só-tokens, acessíveis, com fidelidade v1.

**Independent Test**: renderizar cada componente isolado → aparência por tokens, callbacks, estados (disabled/loading/invalid/erro/foco). `pnpm test` (variantes) + `pnpm test:dom` (comportamento) verdes; `pnpm lint`/`typecheck`/`build` ok.

### Button (átomo central)

- [ ] T004 [P] [US1] (TDD vermelho) Escrever `tests/shared/ui/atoms/button.test.ts` (`node:test`, imports relativos) p/ a lógica pura de variante: a função/mapa de classe do Button retorna a classe esperada por `(variant, state)` — variant `primary`; states `normal/disabled/loading`. Deve falhar (módulo não existe).
- [ ] T005 [P] [US1] (TDD vermelho) Escrever `tests/shared/ui/atoms/button.spec.tsx` (Vitest + @testing-library, padrão do login-view.spec.tsx — sem jest-dom): dispara `onClick` quando habilitado; NÃO dispara quando `disabled` ou `loading`; `disabled`/`loading` setam atributo `disabled`; renderiza `children`; `type` default `button`.
- [ ] T006 [US1] Implementar `src/shared/ui/atoms/button/button.css.ts` (base `style` + `styleVariants` p/ variante/estado; só `vars.*`) e `button.tsx` (BURRO: props de data-model; `loading||disabled` → `disabled` e sem onClick) + `button/index.ts`. Rodar testes T004/T005 → verde. **Decisão (A1)**: exportar o objeto de `styleVariants` (ex.: `buttonState: { normal, disabled, loading }`) e o teste T004 asserta esse mapa (alvo concreto, não uma função). **Decisão (I1)**: `loading` apenas desabilita + estilo de carregando — NÃO troca o texto (o conteúdo vem por `children`/i18n; Button permanece burro).

### Input

- [X] T007 [P] [US1] (TDD vermelho) `tests/shared/ui/atoms/input.spec.tsx`: exibe `value`; `onChange` recebe o valor digitado; aceita `type` text/email/password; `invalid` aplica estado visual (via `aria-invalid`); tem `id` (associável a label).
- [X] T008 [US1] Implementar `src/shared/ui/atoms/input/input.css.ts` (border/radius/foco via `vars`) + `input.component.tsx` (burro; encaminha `e.target.value`; erro via `aria-invalid`) + `index.ts`. T007 → verde. **Nota:** inaugurou o token `borderWidth.thin` (1px) em `tokens.values.ts` — o lint só-tokens proíbe `px` cru, inclusive 1px. CSS desenhado pelo agente `css-expert`.

### Checkbox

- [X] T009 [P] [US1] (TDD vermelho) `tests/shared/ui/atoms/checkbox.spec.tsx`: reflete `checked`; `onChange` recebe `e.target.checked`; respeita `disabled`.
- [X] T010 [US1] Implementar `src/shared/ui/atoms/checkbox/checkbox.css.ts` + `checkbox.component.tsx` + `index.ts`. T009 → verde. **Nota:** nativo + `accent-color`; honra `disabled` no handler (artefato jsdom: `fireEvent.click` ignora o atributo). CSS pelo `css-expert`.

### Logo

- [X] T011 [P] [US1] (TDD vermelho) `tests/shared/ui/atoms/logo.spec.tsx`: renderiza `<img>` com `alt` (a11y) e `src` recebidos; aplica `size` em width/height.
- [X] T012 [US1] Implementar `src/shared/ui/atoms/logo/logo.css.ts` (mínimo) + `logo.component.tsx` (genérico: `src`/`alt`/`size`) + `index.ts`. T011 → verde. **Nota:** `size` dinâmico via atributos `width`/`height` do `<img>` (não `createVar`) — recomendação do `css-expert` (zero-runtime).

### Card

- [X] T013 [P] [US1] (TDD vermelho) `tests/shared/ui/atoms/card.spec.tsx`: renderiza `children`; usa elemento `as` (default `div`).
- [X] T014 [US1] Implementar `src/shared/ui/atoms/card/card.css.ts` (surface/radius/shadow/padding via `vars`) + `card.component.tsx` (polimórfico `as`) + `index.ts`. T013 → verde.

### Molécula Field

- [X] T015 [P] [US1] (TDD vermelho) `tests/shared/ui/molecules/field.spec.tsx`: `label` associado ao controle (`getByLabelText` via `htmlFor`); renderiza `children` (controle); com `error` → mensagem com `role="alert"`; sem `error` → sem alerta.
- [X] T016 [US1] Implementar `src/shared/ui/molecules/field/field.css.ts` (erro via `vars.color.feedback.*`) + `field.component.tsx` (label + children + erro role=alert) + `index.ts`. T015 → verde. **Nota:** stack flex+gap (sem margem órfã); não importa Input (recebe controle por children).

### Barris e validação do MVP

- [X] T017 [US1] Completar `src/shared/ui/atoms/index.ts` (reexporta Button/Input/Checkbox/Logo/Card), `src/shared/ui/molecules/index.ts` (Field) e atualizar o barrel raiz `src/shared/ui/index.ts` (vars + atoms + molecules). Conferir import único `import { Button, ... } from '#shared/ui'`.
- [X] T018 [US1] Validar o MVP: `pnpm test` (node:test, variantes) + `pnpm test:dom` (Vitest) verdes; `pnpm typecheck`; `pnpm build` (CSS estático dos componentes emitido). ✅ test:dom 32/32 · node:test 210 · lint 0 · typecheck 0 · build OK. Conferir que o CSS gerado referencia as CSS vars dos tokens (sem hex cru). **Nota (C1)**: este é o proxy de fidelidade desta spec (CSS usa `vars`); a **comparação visual pixel-a-pixel com a v1 (SC-005) é da PRÓXIMA spec** (vestir a LoginView), quando os componentes estiverem montados na tela.

**Checkpoint**: 5 átomos + Field prontos, testados, type-safe, só-tokens.

---

## Phase 4: User Story 2 — Governança anti-regressão (Priority: P2)

**Goal**: confirmar que os linters (spec 004) mordem nestes componentes reais.

**Independent Test**: caso negativo (hex cru / import cruzado) reprova; removido, lint verde.

- [X] T019 [US2] Provar o enforcement nos componentes reais: criar temporariamente (a) um hex cru num `*.css.ts` de átomo e (b) um import de `molecules/` dentro de um átomo → `pnpm lint` deve reprovar AMBOS (no-restricted-syntax + boundaries). Remover as iscas e confirmar `pnpm lint` verde. (Registrar o resultado; não deixar isca commitada.) ✅ Isca única `atoms/_probe.css.ts` reprovou os DOIS: `boundaries/dependencies` (ds-atom ↛ ds-molecule) + `no-restricted-syntax` ("Cor crua proibida"). Removida → `pnpm lint` verde. Isca NÃO commitada.

---

## Phase 5: Polish & Cross-Cutting

- [X] T020 [P] Atualizar `src/shared/ui/README.md`: marcar `atoms/` e `molecules/` como implementados (eram "próxima spec"), com link ao quickstart. Confirmar guia `handbook/reference/design-system/lint-enforcement.md` ainda coerente.
- [X] T021 [P] Quality gate completo final: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:dom` · `pnpm build` — todos verdes. ✅ lint 0 · typecheck 0 · node:test 210 · test:dom 32 · build OK.

---

## Dependencies

```
Setup (T001 logo, T002 pastas)
   └─> T003 (barrel raiz placeholder)
        └─> US1 (P1): cada átomo = teste(vermelho) → impl(verde), independentes entre si:
              Button   T004,T005 → T006
              Input    T007 → T008
              Checkbox T009 → T010
              Logo     T011 → T012
              Card     T013 → T014
              Field    T015 → T016   (estrutural; recebe controle por children)
            T017 (barris) depende de T006,T008,T010,T012,T014,T016
            T018 (validação MVP) depende de T017
   └─> US2 (P2): T019 (governança) — após existir ao menos 1 átomo (depende de T006)
   Polish: T020, T021 (após US1)
```

- **Teste antes da impl** em cada átomo (TDD).
- Os 6 componentes são **independentes** entre si → seus pares teste→impl podem ser feitos em qualquer ordem (ou em paralelo por pessoas diferentes).
- **T017** (barris) só depois de todos os componentes existirem.

## Parallel Opportunities

- Todos os testes-vermelho `[P]` (T004/T005, T007, T009, T011, T013, T015) podem ser escritos juntos (arquivos distintos).
- As implementações de átomos diferentes não conflitam (pastas separadas) — paralelizáveis se houver mais de um dev.
- **T020/T021** `[P]` entre si.

## Implementation Strategy

- **MVP = Phase 1 + 2 + 3 (US1)**: os 6 componentes prontos e testados — destrava a próxima spec (vestir a LoginView).
- **US2**: barato; só confirma o muro de lint nos componentes reais.
- **Polish**: docs + gate final.
- Sugestão de commits por grupo (cada átomo testado = 1 commit; barris+validação = 1; governança = 1; polish = 1).
