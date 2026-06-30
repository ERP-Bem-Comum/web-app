# Research — Design Tokens Fundacionais

Phase 0 do plano. Resolve as decisões técnicas (todas sem NEEDS CLARIFICATION pendente).

## R1 — Self-host de fontes: `@fontsource` (npm) vs `.woff2` manual vs CDN

**Decision**: usar **`@fontsource-variable/inter`**, **`@fontsource-variable/nunito`** (variable fonts — 1 arquivo, todos os pesos) e **`@fontsource/jetbrains-mono`** (pesos 400/500), importados como side-effect.

**Rationale**:
- Self-host foi a decisão do Tech Lead (privacidade/LGPD, sem FOUC, offline, alinhado a "browser só fala com o BFF").
- `@fontsource` entrega self-host **versionado via npm** com os `.woff2` + CSS `@font-face` prontos. As 3 famílias têm **provenance/attestation** e foram publicadas em set/2025 → passam `trustPolicy: no-downgrade` e `minimumReleaseAge: 1440` do `pnpm-workspace.yaml` (verificado com `pnpm view <pkg> dist.attestations.url version time.modified`).
- Variable fonts reduzem o nº de arquivos e cobrem toda a faixa de peso usada na v1 (Inter 400–700; Nunito 400–800).

**Alternatives considered**:
- **Baixar `.woff2` à mão p/ `public/`**: sem versão/provenance, atualização manual, fácil divergir. Rejeitado.
- **CDN Google Fonts (como v1)**: envia IP do usuário ao Google (LGPD), depende de domínio externo, complica a CSP do hardening de auth, risco de FOUC/offline. Rejeitado.
- **Fontes de sistema**: zero custo, mas quebra a fidelidade visual (objetivo é "usuário quase não perceber"). Rejeitado.

## R2 — Modelagem dos tokens no vanilla-extract: contract + global theme

**Decision**: `createThemeContract(estrutura)` define os **nomes** (contrato); `createGlobalTheme(':root', contract, valoresClaros)` aplica os valores no `:root` globalmente. Consumidores importam `vars` (do contrato) — nunca os valores.

**Rationale**:
- Atende FR-010 (contrato ≠ valores) e a User Story 3 (dark futuro): um segundo `createGlobalTheme('[data-theme="dark"]', contract, valoresDark)` pluga sem tocar consumidores.
- `createGlobalTheme(':root', …)` aplica no documento inteiro (sem precisar pôr uma `themeClass` na raiz manualmente) — simples para um app de tema único agora.
- `vars` é totalmente tipado: referenciar token inexistente = erro de compilação (FR-006, SC-003).

**Alternatives considered**:
- **`createTheme` (gera classe local)**: exigiria aplicar a classe na raiz; mais cerimônia para tema único. Mantemos `createGlobalTheme` no `:root` agora; migração para classe é trivial se preciso.
- **`createGlobalThemeContract` (mapeia nomes de CSS vars custom)**: útil se quiséssemos nomes de var fixos legíveis; não necessário agora (os nomes gerados pelo VE bastam).

## R3 — Valores crus separados (`tokens.values.ts`) para testabilidade

**Decision**: um objeto `as const` puro com todos os valores (hex, medidas, famílias) em `tokens.values.ts`. O `theme.css.ts` importa esse objeto ao chamar `createGlobalTheme`.

**Rationale**:
- `*.css.ts` do vanilla-extract têm side-effects e exigem o compilador do plugin — **não** são importáveis em `node:test` puro.
- Extrair os valores torna a **fidelidade à v1 testável** por `node:test` (constituição: runner puro para `shared`), sem montar DOM nem o pipeline do VE. Atende SC-001/SC-006 de forma automatizável.

**Alternatives considered**:
- **Valores inline no `.css.ts`**: não testável puro; só verificável via build/snapshot (mais lento). Rejeitado como fonte única.
- **Snapshot do CSS de build**: complementar (opção 2 da estratégia de teste), não substituto.

## R4 — Onde aplicar o CSS de tokens + fontes (side-effect 1×)

**Decision**: importar `theme.css.ts` e `fonts.css.ts` **uma vez** no composition root (`src/app/router.tsx`), que é framework glue (fora da matriz de camadas).

**Rationale**: `createGlobalTheme(':root', …)` e os `@font-face` precisam ser registrados uma vez no boot. O router é o ponto natural e já existente; mantém `shared/ui` livre de acoplamento com o framework.

**Alternatives considered**:
- **Importar no `__root.tsx`**: também válido; `router.tsx` foi escolhido por já ser o bootstrap. (Decisão final pode ajustar no tasks/implement.)

## R5 — Paleta: fidelidade sem herdar a duplicação da v1

**Decision**: **uma** paleta de marca (ciano `#32C6F4` / hover `#76D9F8` / texto-sobre-marca preto), superfície branca, escala de neutros para texto/borda, e feedback de erro. **Não** incluir a paleta "institucional" da v1 (`#396496` azul / `#1f7d55` verde).

**Rationale**: a tela de login real da v1 usa a paleta legada (ciano) — confirmado em `v1/src/routes/login.tsx`. A "institucional" existe no `globals.css` da v1 mas é dívida (duas paletas concorrentes); FR-009 proíbe herdá-la. Nomes semânticos (papel, não valor).

**Valores de referência capturados da v1** (`v1/tailwind.config.ts`, `v1/src/app/globals.css`):
- marca `#32C6F4`; hover `#76D9F8`; texto-sobre-marca `#000000`; disabled bg `#E0E0E0` / texto `#6F6F6F`
- superfície (paper) `#ffffff`; radius base `0.5rem` (md = −2px, sm = −4px)
- erro (sugestão a fixar no data-model): vermelho de feedback (v1 usa `bg-red-50`/`text-red-600` no login)
- fontes: Inter (títulos/labels), Nunito (corpo), JetBrains Mono (mono) — Google Fonts na v1 → self-host na v2
