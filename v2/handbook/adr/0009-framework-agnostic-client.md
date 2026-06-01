[← Voltar para ADRs](./README.md)

# ADR-0009: Cliente agnóstico de framework — ViewModel puro + Command, UI como adaptador plugável, use-case opcional

- **Status:** Accepted
- **Date:** 2026-05-31
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente

---

## Contexto

O [ADR-0004](./0004-client-server-split-mvvm-ddd.md) (§III) definiu o lado client como MVVM com camadas
`data · usecase · view-model · ui`. Ao detalhar o login (spec 006), três tensões apareceram:

1. **Nomes confusos.** Havia dois `LoginView`: o componente de UI e o `type LoginView` (`deriveLoginView`)
   do view-model. A 1ª versão deste ADR tentou consertar reservando "View" para o view-state — mas a
   pesquisa nas docs oficiais mostrou que isso também está **errado**.
2. **Acoplamento a React.** O `use-login.view-model.ts` mistura **lógica agnóstica** (`deriveLoginView`)
   com **binding React** (`useMutation`, `useRouter`). O **norte do Tech Lead**: o cliente deve ser
   **portável** — *"do `data` até a ViewModel deve ser o MESMO em React ou Solid; só as views mudam."*
3. **`client/usecase` jogado.** O nosso só **emite um evento no bus** após o login — não é lógica
   complexa nem compartilhada entre VMs.

**Pesquisa (docs oficiais — função das camadas, não nomes):**

- **Android/Jetpack** ([UI layer](https://developer.android.com/topic/architecture/ui-layer) ·
  [state production](https://developer.android.com/topic/architecture/ui-layer/state-production)): o dado
  pronto pra tela é **"UI state"** (data class imutável); *"state holders are responsible for **producing
  UI state**"*; *"UI state is application data **transformed by the ViewModel**"*. Fluxo unidirecional
  (state desce, eventos sobem).
- **Flutter** ([guide](https://docs.flutter.dev/app-architecture/guide) ·
  [ui-layer](https://docs.flutter.dev/app-architecture/case-study/ui-layer) ·
  [concepts](https://docs.flutter.dev/app-architecture/concepts)): a VM *"exposes the data necessary to
  render a view"* + **Commands** (ação + `running/error/completed/result`); o **domain/use-case é OPCIONAL**
  (só p/ lógica compartilhada/complexa).
- **Apple/SwiftUI** ([Managing model data](https://developer.apple.com/documentation/SwiftUI/Managing-model-data-in-your-app)):
  VM `@Observable` **publica o state**; View observa; fluxo unidirecional.

**Fio comum:** a transformação dado→estado-de-tela é da **ViewModel**; a saída chama-se **"UI state"**
(nunca "view"); ações do usuário são **Commands**; o domain/use-case é opcional.

## Decisão

O **cliente é agnóstico de framework**; a biblioteca de UI (React hoje, Solid amanhã) é um **adaptador
plugável** na ponta. Organização **por comportamento** (feature-first) + o padrão **Command**.

### 1. Organização: por COMPORTAMENTO (feature-first); a camada é o SUFIXO

O `client/` se organiza por **comportamento** (a tela/ação), não por camada. Cada comportamento (`login/`,
`current-user/`…) é uma pasta **flat** sob `client/`, ao lado de **dois nomes reservados compartilhados**:

- **`data/`** *(compartilhado)* — `repository` (porta → server fn), `model` (Zod), `events`, `gateways`,
  `helpers`: a infra usada por VÁRIOS comportamentos (login + logout + current-user usam o mesmo auth).
- **`domain/`** *(compartilhado, OPCIONAL)* — `use-cases` só quando a lógica é compartilhada entre VMs ou
  complexa. **Não criar por padrão.**

Dentro da pasta do comportamento, **a camada é o SUFIXO do arquivo** (não uma subpasta):

| Sufixo | Camada | Agnóstico? (React↔Solid) |
| --- | --- | --- |
| `*.mutation.ts` / `*.query.ts` | data **específica** do comportamento (`*Options`: queryKey/queryFn/mutationFn) | ✅ |
| `*.view-model.ts` | **ViewModel** — objeto puro: commands + derivações (`toErrorTag`) + efeitos (`onSuccess`) | ✅ |
| `*.binding.ts` | **binding/adapter** React (`useXxxBinding` → Command) | ❌ React |
| `*.page.tsx` / `*.component.tsx` | **View** burra | ❌ React |
| `*.controller.ts` | **Controller** (form local — "Hook") | ❌ React |

A **linha agnóstica** (portável) = `data/` + `domain/` + os `*.mutation.ts`/`*.view-model.ts` de cada
comportamento. Zero React, testável em `node:test`.

### 2. O binding (adapter) — onde o framework entra

O `*.binding.ts` (`useXxxBinding()`) é o **único** ponto que liga o `xxxViewModel` agnóstico às primitivas
reativas do framework (`useMutation`/`useQuery` → **Command**). É **fino e burro**: não decide nada, só
assina a reatividade e expõe `{ commands }`. A Page e os Components consomem o binding; o Controller
(`useXxxController`) cuida de estado de form local. **Trocar React→Solid = reescrever os `*.binding.ts`**
(e a sintaxe de Page/Component); o núcleo agnóstico fica intacto.

### 3. Command — abstração de 1ª classe

```ts
export type Command<Input, Result> = Readonly<{
  running: boolean
  errorTag: string | null     // erro já mapeado p/ tag i18n (derivação da VM)
  result: Result | null
  execute: (input: Input) => void
}>
```

O **binding** mapeia o primitivo do framework para `Command`:
`useMutation` → `{ isPending→running, error→errorTag (via VM), data→result, mutate→execute }`.
Em Solid, `createMutation` → o **mesmo** `Command`. A View liga **declarativamente**:
`command.running` → spinner do Button; `command.errorTag` → bloco de alerta. **Não é lib nova** (§VIII):
o TanStack Query já É a implementação do Command; o tipo só padroniza a forma (no Flutter o equivalente é
o pacote `flutter_command`).

### 4. Vocabulário fixo (fecha a confusão de nomes)

| Conceito (função) | O que é | Nome |
| --- | --- | --- |
| **View** | UI burra (props → JSX) | `LoginForm` (component) · `LoginPage` (raiz) |
| **ViewModel** | definição **pura**: commands + derivações + efeitos | `loginViewModel` (objeto **agnóstico**) |
| **Binding / Adapter** | hook React que liga a VM ↔ framework, expõe os commands | `useLoginBinding()` (padrão `useXxxBinding()`) |
| **Command** | ação + `{ running, errorTag, result, execute }` | `loginCommand` |
| **UI state** | dado pronto p/ render (saída da VM) | `LoginUiState` (quando precisar de um tipo) |
| **Controller** | estado de **form local** (categoria "Hook") | `useLoginFormController` |

- **"View" = só a UI.** A saída da VM é **UI state**, nunca "view" (corrige a v1 deste ADR).
- **Agnóstico vs binding distinguem-se pela forma:** `xxxViewModel` (objeto puro) vs `useXxx()` (hook React).
- **Nome do binding (decidido):** `useLoginBinding()` — padrão `useXxxBinding()`. Distingue-se do objeto
  agnóstico `xxxViewModel` pela **forma** (hook vs objeto). **NÃO** `useXxxViewModel` (a VM é o objeto
  agnóstico, não o hook).

### 5. Enforcement (lint)

Como tudo vive junto na pasta do comportamento, a regra agnóstica passa a casar por **SUFIXO** (não por
pasta): **`data/`, `domain/` e qualquer `*.view-model.ts`/`*.mutation.ts`/`*.query.ts` NÃO podem importar
`react` nem `@tanstack/react-*`** (só `@tanstack/query-core`/tipos). Vazar framework no núcleo = **erro de
lint** (mesma filosofia do ADR-0004 e do supply-chain do ADR-0003). As regras direcionais de camada
(View → VM → data) também migram de **pasta** para **sufixo** no `eslint-plugin-boundaries`.

## Árvore de pastas (login de referência)

```
modules/auth/client/
├── data/                         # COMPARTILHADO entre comportamentos
│   └── model/ · repository/ · gateways/ · events/ · helpers/     (porta + Zod + infra)
├── domain/                       # COMPARTILHADO, OPCIONAL (use-cases; vazio por ora)
├── login/                        # COMPORTAMENTO — tudo que a tela de login FAZ
│   ├── login.mutation.ts         # loginMutationOptions                                 — AGNÓSTICO (data do login)
│   ├── login.view-model.ts       # loginViewModel { mutation, onSuccess, toErrorTag }    — AGNÓSTICO (node:test)
│   ├── login.binding.ts          # useLoginBinding() — useMutation → loginCommand        — ADAPTER (React)
│   ├── login.page.tsx            # LoginPage — compõe (resolve i18n, chama o binding)     — ADAPTER
│   └── components/forms/
│       ├── login-form.component.tsx   # LoginForm — View burra (props → JSX)
│       └── login-form.controller.ts   # useLoginFormController — Hook local de form
└── current-user/                 # COMPORTAMENTO (usado pelo guard; pode não ter page)
    ├── current-user.view-model.ts
    └── current-user.binding.ts
```

> **Reservados:** só `data/` e `domain/` são pastas "de camada compartilhada" sob `client/`. Qualquer outra
> pasta sob `client/` é um **comportamento**. A `data` compartilhada guarda a porta/model/infra; a `data`
> **específica** do comportamento (a mutation/query options) mora na pasta do comportamento.

### Login de referência (pseudocódigo)

```ts
// login/login.mutation.ts — AGNÓSTICO (data específica do comportamento)
export const loginMutationOptions = {
  mutationKey: ['auth', 'login'],
  mutationFn: (input: LoginInput) => authRepository.login(input),   // porta → server fn
}

// login/login.view-model.ts — AGNÓSTICO (zero React; testável em node:test)
export const loginViewModel = {
  mutation: loginMutationOptions,
  onSuccess: (user: CurrentUser, deps: { bus: AuthBus }) => deps.bus.emit(usuarioAutenticado(user)), // era o "usecase"
  toErrorTag: (e: AuthError): string => authErrorTag(e),            // derivação pura → tag i18n
}

// login/login.binding.ts — BINDING React (trocar p/ Solid = reescrever SÓ este arquivo)
export function useLoginBinding(): { loginCommand: Command<LoginInput, CurrentUser> } {
  const bus = useAuthBus()
  const m = useMutation({
    ...loginViewModel.mutation,
    onSuccess: (user) => loginViewModel.onSuccess(user, { bus }),
  })
  return {
    loginCommand: {
      running: m.isPending,
      errorTag: m.error ? loginViewModel.toErrorTag(m.error) : null,
      result: m.data ?? null,
      execute: m.mutate,
    },
  }
}

// login/components/forms/login-form.component.tsx — VIEW BURRA (liga ao command)
// <Button loading={loginCommand.running}>Entrar</Button>
// {loginCommand.errorTag && <Alert>{t(loginCommand.errorTag)}</Alert>}
```

O `deriveLoginView`/`{status, errorTag}` **encolhe**: `status` vira `command.running`; sobra só
`toErrorTag` (derivação pura legítima). O `client/usecase` **some** (vira `onSuccess` do command).

## Consequências

**Positivas**
- **Cliente portável**: trocar React→Solid muda só `ui/` (Page, Components, binding). `data`/`domain`/`view-model` intactos.
- Núcleo **testável puro** (node:test); o `Command` padroniza loading/erro — entrega o **spinner da spec 006** de graça (`command.running`).
- Nomes sem colisão; "View" = só UI; a saída da VM é UI state.

**Negativas / custos**
- Uma indireção a mais (VM agnóstica + binding). Refactor do login + **remover** `client/usecase`.
- **Mexe na constituição §III/§XI/§XII e no ADR-0004** → sync pendente (este ADR está acima na hierarquia; a constituição é atualizada na sequência).

**Neutras**
- O `domain/` nasce **vazio** (sem use-cases) — só ganha conteúdo quando surgir lógica compartilhada/complexa.
- O `Command` é fino sobre o TanStack (não é dependência nova).

## Alternativas consideradas

- **VM como hook único** (atual) — rejeitado: acopla React no núcleo; não portável.
- **Store agnóstico** (Zustand/XState) para a VM — **adiado**: o TanStack Query já entrega o Command (e é global pelo cache); store extra é dep a mais (§VIII). Revisitar se precisar de VM stateful fora de server-state.
- **Manter `usecase` sempre** — rejeitado: Flutter trata domain como opcional; o nosso só emitia evento (efeito do command).
- **"View" para o view-state** (v1 deste ADR) — rejeitado: as docs chamam de **UI state**.

## Referências

- Refina/emenda [ADR-0004](./0004-client-server-split-mvvm-ddd.md) e a constituição §III/§XI/§XII (sync pendente).
- Android: [UI layer](https://developer.android.com/topic/architecture/ui-layer) · [state production](https://developer.android.com/topic/architecture/ui-layer/state-production).
- Flutter: [guide](https://docs.flutter.dev/app-architecture/guide) · [ui-layer/Command](https://docs.flutter.dev/app-architecture/case-study/ui-layer) · [concepts](https://docs.flutter.dev/app-architecture/concepts).
- Apple: [Managing model data](https://developer.apple.com/documentation/SwiftUI/Managing-model-data-in-your-app).
- `specs/006-login-view-styling/` (origem). [ADR-0002](./0002-errors-as-values.md) (Result/QueryError), [ADR-0003](./0003-pnpm-v11-supply-chain.md) (enforcement por lint).
