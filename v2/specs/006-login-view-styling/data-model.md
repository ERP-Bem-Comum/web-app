# Data Model — Login com a identidade visual (Phase 1)

Feature de apresentação: sem entidades de domínio/dados novas. O "modelo" aqui são os **contratos de
componente** (props), os **tokens** e as **chaves i18n** adicionados. Tipos em EN; strings via i18n.

## Contrato: `LoginForm` (`modules/auth/client/ui/login/components/forms/login-form.component.tsx`)

Continua **burra** (§XI): só props → JSX. Props novas marcadas com **(novo)**.

```
LoginFormProps (Readonly):
  # textos (resolvidos da i18n pela page)
  title: string
  subtitle: string                 # (novo) FR-003
  emailLabel: string
  passwordLabel: string
  emailPlaceholder: string         # (novo) FR-004
  passwordPlaceholder: string      # (novo) FR-004
  rememberLabel: string
  submitLabel: string
  loadingLabel: string             # (novo) texto acessível do spinner — repassado ao Button

  # estado (da ViewModel/Controller)
  email: string
  password: string
  rememberDevice: boolean
  submitting: boolean
  errorText: string | null

  # callbacks
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRememberChange: (value: boolean) => void
  onSubmit: () => void
```

Composição (estrutura, não estilo): `Card` › `Logo(size=48)` + `título` + `subtítulo` + `<form>` [
`Field(emailLabel)›Input(email, placeholder, type=email)` · `Field(passwordLabel)›Input(password,
placeholder, type=password)` · `Checkbox(rememberDevice) + rememberLabel` · (se `errorText`) bloco
`role=alert` · `Button(submit, loading=submitting, loadingLabel)` ]. **Regra**: a view não importa
`data`/`usecase`/server — recebe tudo por props (o lint cobra em `*.component.tsx`).

## Contrato: `Button` — incremento (`shared/ui/atoms/button`)

Aprimora o átomo (spec 005) **sem quebrar** o contrato atual. Prop nova **opcional**:

```
ButtonProps (Readonly):
  children: ReactNode
  type?: 'button' | 'submit'       # default 'button'
  variant?: 'primary'
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string            # (novo) texto acessível (sr-only) exibido quando loading
  onClick?: () => void
```

Comportamento no `loading` (já desabilita; ver `resolveButtonState`):
- `disabled` (atributo) + `aria-busy` — **já existentes**, mantidos.
- `children` visualmente oculto (`visibility: hidden`) — mantém a largura.
- spinner (anel CSS) centralizado absoluto.
- se `loadingLabel` presente → `<span class={srOnly}>{loadingLabel}</span>` (anuncia "carregando").

## Tokens novos (`shared/ui/tokens/`)

Adicionar em `tokens.values.ts` → `contract.css.ts` → `theme.css.ts` (+ sincronizar
`tokens.values.test.ts` e `contract-extensibility.test.ts`, como no `borderWidth.thin`).

| Token | Tipo | Papel | Valor (provisório — confirmar visual) |
| --- | --- | --- | --- |
| `color.surface.canvas` | string (cor) | Fundo de fallback do login quando a imagem não carrega (FR-011) | tom de marca claro, ex.: `#eaf7fc` (a definir) |

*(Opcional, decisão na implementação: `size.loginCardMax` = `28rem` para a largura máxima do card — `rem`
literal já é permitido pelo lint, então o token é só clareza, não obrigatório.)*

Spinner: **sem token novo** — dimensionado em `em`/`%`/`calc` (R2).

## Chaves i18n novas (`shared/i18n/catalog.pt-BR.ts`)

Mesmo estilo das existentes (`auth.login.*`). Textos provisórios (conteúdo do P.O.):

| Chave | Texto provisório |
| --- | --- |
| `auth.login.subtitle` | "Entre com suas credenciais" |
| `auth.login.email-placeholder` | "seu@email.com" |
| `auth.login.password-placeholder` | "••••••••" |
| `common.loading` | "Carregando…" |

A `login.page.tsx` resolve essas tags e passa ao `LoginForm` (que repassa `common.loading` como
`loadingLabel` ao `Button`).

## Estados visuais (derivados, sem máquina de estado nova)

- **Idle**: card + campos + botão "Entrar" habilitado.
- **Submitting** (`submitting=true`): inputs/checkbox podem permanecer editáveis? → **Não** alteramos o
  comportamento atual (FR-009); apenas o **Button** entra em loading (disabled + spinner).
- **Error** (`errorText≠null`): bloco `role=alert` visível; conteúdo digitado preservado (FR-007).

## Validação (para os testes — SC)

- **Estrutura/comportamento (DOM, Vitest)**: LoginForm renderiza Card/Logo/título/subtítulo/2×Field+Input
  (com placeholder)/Checkbox/Button; submit dispara `onSubmit`; erro aparece com `role=alert`; o fluxo
  (onChange, remember, submit) inalterado.
- **Button loading (DOM, Vitest)**: `loading` → `disabled` + `aria-busy` + nome acessível (`loadingLabel`)
  presente + spinner (classe) presente; `onClick` não dispara.
- **Tokens (node:test)**: `color.surface.canvas` definido e não-vazio; formas de contrato/tema sincronizadas.
- **Só-tokens / hierarquia (lint)**: nenhum hex/px/rgb cru em `login-view.css.ts`/`button.css.ts`; `client-ui`
  importa `shared-ui` (permitido).
