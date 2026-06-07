# Design System (`shared/ui`)

Design system compartilhado da v2 (tipo `shared-ui` no `eslint-plugin-boundaries`; qualquer `client-ui` de feature importa daqui). Organização **Atomic Design**.

- [`tokens/`](./tokens/README.md) — **camada de tokens** (cores, tipografia, espaço, raio, sombra). Fonte única de verdade visual; consumir via `vars` (`import { vars } from '#shared/ui/tokens'`). ✅ implementado (spec 004).
- `atoms/` · `molecules/` — **componentes** ✅ implementados (spec 005): átomos **Button · Input · Checkbox · Logo · Card** + molécula **Field**. Porta única `import { Button, Input, Checkbox, Logo, Card, Field } from '#shared/ui'`. Como usar: [`quickstart`](../../../specs/005-design-system-atoms/quickstart.md). `organisms/` virá em spec futura. A hierarquia (atoms ↛ molecules ↛ organisms) e a regra "só tokens" são enforçadas por lint — ver [`handbook/reference/design-system/lint-enforcement.md`](../../../handbook/reference/design-system/lint-enforcement.md). Anatomia de cada componente: ver abaixo.

Stack: **vanilla-extract** (zero-runtime, type-safe) — ADR-0007. Fontes self-host via @fontsource — ADR-0008.

## Anatomia de um componente (padrão de arquivos)

Pasta por componente: `{atoms,molecules,organisms}/<nome>/`. **Vocabulário fixo de arquivos — escreva só os que se aplicam** (nada de arquivo vazio por cerimônia):

| Arquivo | Quando | Papel |
| --- | --- | --- |
| `<nome>.component.tsx` | **sempre** | View burra: `(props: Readonly<…>) => JSX`. Sem fetch nem estado de negócio. Os tipos de props moram aqui (re-exportados pelo `index`). |
| `<nome>.css.ts` | **sempre** | Estilos vanilla-extract. Só `vars.*` (lint só-tokens). Para CSS moderno, ver [`handbook/reference/css/`](../../../handbook/reference/css/README.md) / agente `css-expert`. |
| `index.ts` | **sempre** | Barrel: re-exporta o componente + tipos públicos. Única porta da pasta. |
| `<nome>.variants.ts` | há **lógica pura** de variante/estado visual | `(props) → chave do styleVariants`. Função **pura** (sem estado React) → testável por `node:test`. Ex.: `button.variants.ts` (normal/disabled/loading). |
| `<nome>.controller.ts` | há **estado transiente de UI** | Hook que encapsula estado efêmero (mesmo sentido de `*.controller.ts` nos `modules`). Raro em átomo; aparece em molécula/organismo interativo. |

**Regra de ouro:** *cara* (`component`) e *cérebro* separados — mas o cérebro só existe quando há cérebro. `variants` = decisão **pura**; `controller` = **estado**. Átomo burro de verdade = só os 3 fixos.

**Extensível:** se surgir necessidade real de outra camada (ex.: `<nome>.types.ts` quando os tipos crescem, `<nome>.context.ts`…), adicione seguindo o mesmo princípio — postfix por papel, só quando precisar.

Exemplos atuais: `button/` = `component` + `css` + **`variants`** + `index` (tem lógica de estado). `input/` = `component` + `css` + `index` (burro: o `aria-invalid` deriva direto da prop, sem lógica).
