# vanilla-extract — Referência (design system da v2)

Fonte de verdade para a estilização da v2. **vanilla-extract** é CSS-em-TypeScript **zero-runtime**: estilos e tokens são escritos em arquivos `*.css.ts`, **tipados**, e o plugin do Vite os **compila em CSS estático no build** (sem JS de estilo em runtime, SSR-safe).

Site oficial: https://vanilla-extract.style · A doc oficial **não** publica `llms.txt`; o markdown canônico está espelhado em [`docs/`](./docs/).

## Por que vanilla-extract (e não Panda/Tailwind)

Decisão de 2026-05-30 (ver memória do projeto). Resumo:
- **Passa no supply-chain hardening da v2** sem exceções. O Panda foi descartado porque `@pandacss/node` fixa `chokidar@4.0.3` (versão exata, sem provenance) → dispara `ERR_PNPM_TRUST_DOWNGRADE` no `trustPolicy: no-downgrade`. O VE **não usa chokidar**.
- **Zero-runtime + SSR**: valida no pipeline TanStack Start + Nitro (CSS estático extraído no build).
- **Tipagem forte de tokens** (`createTheme`/`createThemeContract`) → guard-rail contra regressão.

## Como está integrado

- **Plugin**: `vanillaExtractPlugin()` em [`vite.config.ts`](../../../vite.config.ts), **antes** de `tanstackStart()` (transforma os `.css.ts` primeiro).
- **Deps**: `@vanilla-extract/css` (runtime de autoria, em `dependencies`) + `@vanilla-extract/vite-plugin` (build, em `devDependencies`).
- **Supply-chain**: `esbuild: false` no `allowBuilds` do `pnpm-workspace.yaml` (o binário vem via napi/optional deps; `esbuild --version` roda sem o script — mesmo padrão do `unrs-resolver`).

## Onde mora o design system

`src/shared/ui/` (tipo `shared-ui` no eslint-plugin-boundaries; qualquer `client-ui` de feature importa dele). Organização **Atomic Design**: `tokens` → `atoms` → `molecules` → `organisms`.

## APIs principais (ver docs/)

| API | Arquivo | Uso |
| :-- | :-- | :-- |
| `style` | [docs/styling.md](./docs/styling.md), [docs/api__style.md](./docs/api__style.md) | um bloco de estilo escopado |
| `styleVariants` | [docs/api__style-variants.md](./docs/api__style-variants.md) | variantes (ex.: tamanhos de botão) |
| `createTheme` | [docs/api__create-theme.md](./docs/api__create-theme.md) | tema concreto + classe + `vars` |
| `createThemeContract` | [docs/api__create-theme-contract.md](./docs/api__create-theme-contract.md) | contrato de tokens (múltiplos temas) |
| `assignVars` | [docs/api__assign-vars.md](./docs/api__assign-vars.md) | atribuir valores aos tokens |
| `fontFace` | [docs/api__font-face.md](./docs/api__font-face.md) | `@font-face` tipado (Inter/Nunito) |
| `recipe` | [docs/packages__recipes.md](./docs/packages__recipes.md) | variantes compostas (CVA-like) — átomos |
| `sprinkles` | [docs/packages__sprinkles.md](./docs/packages__sprinkles.md) | utilitárias atômicas a partir de tokens |
| Vite | [docs/integrations__vite.md](./docs/integrations__vite.md) | integração com o bundler |

## Identidade visual a reproduzir (fidelidade à v1)

Ciano `#32C6F4` (hover `#76D9F8`, texto preto), card branco centralizado, fundo `backgroundLogin.png`, logo `logo-bem-comum.png`, fontes Inter (headings) + Nunito (body), radius `0.5rem`. ⚠️ NÃO herdar a paleta "institucional" duplicada da v1.

## Anti-regressão (pendente)

O VE não tem MCP oficial. Para travar "só tokens" (não hex hardcoded), avaliar `@antebudimir/eslint-plugin-vanilla-extract` (`prefer-theme-tokens`) ou regra própria — alinhado à cultura de lint da v2 (`boundaries`, `zod`).
