# Research — Átomos do Design System

Phase 0 do plano. Decisões técnicas (todas resolvidas; sem NEEDS CLARIFICATION).

## R1 — Variantes do Button: `styleVariants` vs `@vanilla-extract/recipes`

**Decision**: usar **`styleVariants`** do `@vanilla-extract/css` (já instalado). NÃO adicionar `@vanilla-extract/recipes`.

**Rationale**:
- `styleVariants` cobre o que o Button precisa agora (uma variante primária + estados via composição de `style` base + classe de estado). Verificado: a função existe no `@vanilla-extract/css` instalado.
- `@vanilla-extract/recipes` **não** está instalado; adicioná-lo seria +1 dep contra o Princípio VIII para um ganho que `styleVariants` + composição já entregam neste escopo (5 átomos simples).
- Se no futuro houver muitas variantes compostas (size × tone × state), reavaliar `recipes` num ADR próprio.

**Alternatives considered**: `recipes` (mais ergonômico p/ matriz de variantes — adiado, +dep); CVA (é do ecossistema Tailwind/className, não casa com VE).

## R2 — Asset do logo: `public/` vs import de módulo

**Decision**: criar `public/images/` e portar `logo-bem-comum.png` da v1; o átomo `Logo` recebe **`src` e `alt` por prop**; o consumidor passa `/images/logo-bem-comum.png`.

**Rationale**:
- A v2 não tem `public/`; o Vite serve `public/` na raiz por padrão (sem config). Caminho público estável, sem precisar de tipos de import de asset (`*.png`) nem de `?url`.
- Manter o `Logo` **genérico/burro** (recebe src/alt) respeita Atomic Design — o átomo não embute o caminho da marca.
- O **fundo** (`backgroundLogin.png`) **NÃO** é portado nesta spec (é da tela de login = próxima spec).

**Alternatives considered**: `import logo from '...png?url'` (acopla o átomo ao asset específico + exige tipos de asset); embutir o caminho no átomo (quebra a generalidade).

## R3 — Testes: ferramentas e ausência de jest-dom

**Decision**: **node:test** para variantes puras + **Vitest + @testing-library/react** para DOM. **Sem** `@testing-library/jest-dom`.

**Rationale**:
- Ambos os runners já existem e a convenção é clara (globs disjuntos: `*.spec.tsx` = Vitest, `*.test.ts` = node:test).
- O padrão atual (`login-view.spec.tsx`) usa **queries do testing-library + `expect` do Vitest** (ex.: `getByRole`, `getByLabelText`), sem matchers do jest-dom. Seguir isso = zero dep nova e consistência. (Asserções como "desabilitado" via `(el as HTMLButtonElement).disabled`, "alerta" via `getByRole('alert')`.)

**Alternatives considered**: adicionar jest-dom (matchers mais expressivos como `toBeDisabled`) — +dep, e quebra a consistência com os specs existentes. Adiável.

## R4 — Consumo dos átomos por features (gap de boundaries)

**Decision**: features consumirão o design system via **barrel `#shared/ui`** (tipo `shared-ui`), que já pode importar `ds-*`. Esta spec **não** dispara o gap (não veste a LoginView).

**Rationale**:
- O lint atual: `client-ui → shared-ui` (permitido) e `shared-ui → ds-*` (permitido). Import direto `#shared/ui/atoms/button` seria `ds-atom`, e **não** há regra `client-ui → ds-atom`.
- Solução natural: o barrel `src/shared/ui/index.ts` reexporta átomos/molécula; a feature importa `import { Button } from '#shared/ui'` → resolve como `shared-ui`. Mantém uma só porta de entrada do DS.
- Como esta spec entrega só os componentes (sem uso por feature), fica **registrado** para a próxima spec; se preferirmos import direto, adiciona-se regra `client-ui → ds-atom/molecule/organism` no eslint.

**Alternatives considered**: regra explícita `client-ui → ds-*` (mais granular, mas espalha imports); decidir na próxima spec ao vestir o login.

## R5 — Fidelidade visual à v1 (mapeamento → tokens)

**Decision**: reproduzir os elementos da v1 usando exclusivamente `vars` (spec 004). Mapeamento de referência (v1 → token):

| Elemento v1 | v1 (cru) | Token v2 |
| :-- | :-- | :-- |
| Botão fundo / hover | `#32C6F4` / `#76D9F8` | `vars.color.brand.normal` / `.hover` |
| Botão texto | preto | `vars.color.brand.onBrand` |
| Botão disabled | `opacity-50` | `vars.color.brand.disabled` / `.onDisabled` |
| Card | `bg-white p-8 rounded-lg shadow-md max-w-md` | `vars.color.surface.default`, `vars.space.xl`, `vars.radius.lg`, `vars.shadow.card` |
| Input | `border rounded-md px-3 py-2 focus:ring-2` | `vars.color.border.default`/`.focus`, `vars.radius.md`, `vars.space.sm`/`.md` |
| Erro | `bg-red-50 text-red-600 rounded-md p-3` | `vars.color.feedback.errorBg`/`.errorText`, `vars.radius.md`, `vars.space.md` |
| Título / subtítulo | `text-2xl font-bold` / `text-gray-500` | `vars.font.size.xl`/`.weight.bold` / `vars.color.text.muted` |
| Fontes | Inter/Nunito | `vars.font.family.heading`/`.body` |

**Rationale**: o objetivo é "usuário quase não percebe diferença"; os tokens já carregam os valores fiéis da v1 (validado na spec 004). Nuances finas (raio do input md vs lg) ajustadas na implementação por comparação visual (SC-005).

**Alternatives considered**: copiar classes Tailwind da v1 — impossível (v2 não tem Tailwind) e violaria "só tokens".
