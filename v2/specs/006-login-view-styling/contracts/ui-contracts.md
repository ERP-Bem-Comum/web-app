# UI Contracts — Login com a identidade visual

Esta feature não expõe API HTTP nova. Os "contratos" são as **interfaces de componente** (props) que
mudam, mais o contrato de **tokens** e **i18n**. Fonte de verdade dos tipos: o código TS após a implementação.

## C1 — `LoginForm` (consumido pela `login.page.tsx`)

```ts
export type LoginFormProps = Readonly<{
  title: string
  subtitle: string                 // novo
  emailLabel: string
  passwordLabel: string
  emailPlaceholder: string         // novo
  passwordPlaceholder: string      // novo
  rememberLabel: string
  submitLabel: string
  loadingLabel: string             // novo (repassado ao Button)
  email: string
  password: string
  rememberDevice: boolean
  submitting: boolean
  errorText: string | null
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRememberChange: (value: boolean) => void
  onSubmit: () => void
}>
```

**Compatibilidade**: a `login.page.tsx` DEVE passar as 4 props novas (resolvidas da i18n). Sem default —
falha de compilação se ausentes (garante que a page foi atualizada).

## C2 — `Button` (átomo do design system — incremento retrocompatível)

```ts
export type ButtonProps = Readonly<{
  children: ReactNode
  type?: 'button' | 'submit'
  variant?: 'primary'
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string            // novo, OPCIONAL — texto acessível (sr-only) no loading
  onClick?: () => void
}>
```

**Compatibilidade**: `loadingLabel` é **opcional** → consumidores existentes do Button não quebram. Quando
`loading` é true e `loadingLabel` é fornecido, o Button renderiza o texto sr-only. Invariantes mantidos:
`loading || disabled` → `disabled` + sem `onClick` + `aria-busy`.

## C3 — Tokens (contrato visual)

- Novo token semântico de cor: `vars.color.surface.canvas` (fundo de fallback do login).
- Contrato em `contract.css.ts` espelha `tokens.values.ts`; valor em `theme.css.ts`.
- Consumo: só via `vars.*` (lint). Nenhum hex/px/rgb cru nos componentes.

## C4 — i18n (contrato de texto)

Chaves novas no catálogo `pt-BR` (resolvidas por `createTranslator`):
`auth.login.subtitle`, `auth.login.email-placeholder`, `auth.login.password-placeholder`, `common.loading`.

**Contrato**: a `LoginForm` nunca contém literais de UI — recebe tudo resolvido por props. O `Button` nunca
contém i18n — recebe `loadingLabel` por prop.
