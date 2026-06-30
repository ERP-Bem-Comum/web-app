# Data Model — Átomos & Molécula (contratos de componente)

Contratos de props (a "API" de cada componente). Burros: só dados + callbacks. Sem estado de negócio. Strings (labels) vêm de fora (i18n). Tipos em EN.

## Átomo: Button (`atoms/button`)

```
ButtonProps (Readonly):
  children: ReactNode            # conteúdo (texto já resolvido por quem consome)
  type?: 'button' | 'submit'     # default 'button'
  variant?: 'primary'            # única variante neste escopo (default 'primary')
  disabled?: boolean
  loading?: boolean              # quando true: não dispara onClick, mostra estado de carregando
  onClick?: () => void
```
Regras: `loading || disabled` → atributo `disabled` no `<button>` e sem `onClick`. Variante via `styleVariants`. Aparência: `vars.color.brand.*`, `vars.radius.lg`, `vars.space.md`, `vars.font.family.body`/`.weight.medium`. Foco visível (`vars.color.border.focus`).

## Átomo: Input (`atoms/input`)

```
InputProps (Readonly):
  id: string                     # p/ associação com <label> (Field)
  type?: 'text' | 'email' | 'password'   # default 'text'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean              # estado visual de erro (borda)
  autoComplete?: string
```
Aparência: `vars.color.surface.default`, `vars.color.border.default`/`.focus`, `vars.radius.md`, `vars.space.sm`/`.md`. Foco com ring por token. Sem `<label>` interno (é a Field que rotula).

## Átomo: Checkbox (`atoms/checkbox`)

```
CheckboxProps (Readonly):
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
```
Aparência por token; foco visível. Encaminha `e.target.checked`.

## Átomo: Logo (`atoms/logo`)

```
LogoProps (Readonly):
  src: string                    # caminho público (ex.: /images/logo-bem-comum.png)
  alt: string                    # texto alternativo OBRIGATÓRIO (a11y)
  size?: number                  # px lado (default coerente com o login, ex.: 48)
```
Genérico: o átomo não embute o caminho da marca. `width=height=size`.

## Átomo: Card (`atoms/card`)

```
CardProps (Readonly):
  children: ReactNode
  as?: 'div' | 'section'         # default 'div'
```
Superfície: `vars.color.surface.default`, `vars.radius.lg`, `vars.shadow.card`, `vars.space.xl` (padding). Largura é responsabilidade do consumidor (a Card não fixa max-width — isso é layout do login, próxima spec).

## Molécula: Field (`molecules/field`)

```
FieldProps (Readonly):
  htmlFor: string                # id do controle (associação label↔controle)
  label: string                  # texto já resolvido (i18n)
  error?: string                 # mensagem de erro (opcional)
  children: ReactNode            # o controle (ex.: <Input/>) — composição
```
Estrutura: `<label htmlFor>` + `children` (controle) + (se `error`) mensagem com **`role="alert"`** e cor `vars.color.feedback.errorText`. Sem `error` → não renderiza a mensagem (não reserva espaço poluído). Importa **átomos** apenas se necessário (no escopo, Field é estrutural e recebe o controle por `children` — não precisa importar Input, mantendo acoplamento baixo).

## Asset

```
public/images/logo-bem-comum.png   # portado da v1 (3859 bytes)
```

## Regras de validação (para os testes — SC-002/003/004/006)

- **Comportamento (DOM)**: Button dispara `onClick` quando habilitado; NÃO dispara quando `disabled`/`loading`; Input encaminha valor digitado; Checkbox encaminha estado; Field associa label ao controle (`getByLabelText`) e expõe erro via `getByRole('alert')` só quando `error` presente.
- **Variantes (unit)**: a função de classe do Button retorna a classe da variante/estado esperada por combinação de props.
- **Só-tokens (lint)**: nenhum hex/px/rgb cru em nenhum `*.css.ts`/`*.tsx` dos componentes (SC-002/SC-004a).
- **Hierarquia (lint)**: nenhum átomo importa molécula/organismo (SC-004b).
- **A11y (DOM)**: controles rotulados; foco visível (classe de foco presente); erro com `role=alert`.

## State transitions

N/A — componentes sem estado de negócio. Estados visuais (hover/focus/disabled/loading/invalid) são derivados de props/CSS, não máquina de estado.
