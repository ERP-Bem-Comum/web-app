[← Voltar para ADRs](./README.md)

# ADR-0012: O shell autenticado é uma TELA MVVM (`root`) em `modules/shell/client`, client-only

- **Status:** Accepted
- **Date:** 2026-06-07
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente (+ pareceres: react/css/tanstack-start/tanstack-router experts)

---

## Contexto

A auditoria da camada UI (pré-épico de telas de parceiros) encontrou o **shell autenticado** (sidebar +
topbar + container do conteúdo) implementado como um **layout monolítico** em `src/routes/_authenticated/`
(`-sidebar.component.tsx`, `-topbar.component.tsx`) e depois movido para `src/app/layouts/authenticated/`
(`authenticated-layout.tsx`). Esse monólito:

- misturava **estado** (`useState(collapsed)`), **router glue** (`useRouterState`/`useNavigate`),
  **efeitos de DOM** e **render** num único componente — **não** seguia o padrão de TELA do projeto
  ([ADR-0009](./0009-framework-agnostic-client.md): `view-model` puro + `binding` + `controller` + view burra);
- tinha `style={{}}` inline com hex crus (fora do alcance do lint só-tokens — [ADR-0007](./0007-design-system-vanilla-extract.md));
- carregava `Sidebar`/`TopBar` como organismos "presos" fora do design system.

Três tensões precisavam de decisão:

1. **O shell é um "organism" do Atomic Design — devia morar em `shared/ui/organisms`?**
2. **Onde mora então?** (`app/`, `shared/ui`, ou um módulo?)
3. **Precisa de camada `server/`?** (ele consome `user`/`permissions`/`logout`).

A pesquisa (Feature-Sliced Design, docs TanStack, ADR-0009) e os pareceres dos especialistas convergiram.

## Decisão

### 1. O shell é uma **TELA MVVM de 1ª classe** chamada `root` — não um layout solto

Ele tem estado de página (`collapsed`), derivações (título por rota, item ativo, **menu filtrado por
permissão**) e ações (logout) — exatamente o que caracteriza uma tela. Logo segue o **mesmo padrão da tela
de login** (ADR-0009): `view-model` puro/agnóstico + `binding` (adapter React) + `controller` por
componente + `page` burra. O monólito `authenticated-layout.tsx` é **decomposto**.

### 2. Mora em `src/modules/shell/client/` — não em `app/layouts` nem `shared/ui/organisms`

O Atomic Design classifica a **anatomia** do componente (organism), não o **acoplamento**. A linha que
decide a pasta é: **genérico/agnóstico (design system) × específico da app (shell)**.

| | `shared/ui/organisms` (design system) | `modules/shell/client` (esta tela) |
|---|---|---|
| Conhece domínio/dados? | ❌ (`DataTable` não sabe o que é "contrato") | ✅ (menu, `auth`, RBAC) |
| Depende de | só `tokens`/DS | `auth` (public-api) + router |
| Reutilizável noutro app? | ✅ | ❌ — é o shell **deste** ERP |

Colocar o shell em `shared/ui` **violaria a Regra de Dependência** (a camada estável não pode depender da
volátil: `shared/ui` é proibido de importar `modules/auth`/router pelos boundaries do ESLint). O
**Feature-Sliced Design** confirma: *"layout sem lógica de negócio → `shared/ui`; layout que importa de
camadas superiores → App/feature layer"*. O shell importa `auth`+router ⇒ **não** é `shared`. E não é um
`app/layout` solto porque **é uma tela** (segue MVVM). Logo: **um módulo `shell`**, tela `root`. Organismos
**genéricos** (DataTable, FormCard, DualPanel) continuam indo para `shared/ui/organisms` — o DS fica puro.

### 3. **Client-only**: sem `server/`. Consome o BFF do `auth` via `public-api`

O shell **não tem domínio/agregado**, não toca segredos nem `core-api`. Tudo que precisa
(`user`, `permissions`, `logout`) já é produzido pelo BFF do `auth` (`getCurrentUserFn` já retorna
`{ userId, permissions }`; `logoutUseCase`). Criar `shell/server` seria over-engineering e duplicaria uma
fronteira que já existe. `modules/shell/` = **só `client/` + `public-api`** (reexporta `RootPage`).
A fronteira (Princ. I) é respeitada: quem fala com o `core-api` é a server fn do `auth`.

### 4. Data-loading: `user`/`permissions` vêm do **route context** por **prop** — sem `useCurrentUser`

O guard (`beforeLoad` de `_authenticated`) já busca o `user` (com `permissions`) no SSR e o põe no context.
A rota passa por prop: `component: () => <RootPage user={user}><Outlet/></RootPage>`. O binding recebe o
`user` por prop e a VM filtra o menu por `user.permissions`. **Proibido** montar `useCurrentUser()` no shell
(seria `useQuery(['auth','me'])` = **double-fetch** do mesmo dado já resolvido no guard). O tipo da prop
`user` é ampliado para incluir `permissions: readonly string[]`.

### 5. Anatomia (espelha o login; estrutura em subpastas — camada = sufixo, ADR-0009 §1)

```
src/modules/shell/
├── public-api/index.ts                      # ★ exporta RootPage (+ useSidebarContext)
└── client/
    ├── data/menu/shell-menu.config.tsx       # MENU + tipos (+ requiredPermission? p/ RBAC)
    └── root/
        ├── viewModel/root.view-model.ts      # PURO: reducer(collapsed) + resolvePageTitle + isItemActive
        │                                      #       + sidebarWidth + visibleMenu(menu, perms)   [node:test]
        ├── bind/root.binding.ts              # adapter React: useReducer(VM) + router + user(prop)
        ├── page/root.page.tsx + root.css.ts  # view burra: TopBar + SideBar + DynamicContainer
        └── components/
            ├── top-bar/      {*.component.tsx, *.controller.ts (dropdown), *.css.ts, icons.tsx}
            ├── side-bar/     {*.component.tsx, *.controller.ts (accordion), *.css.ts, icons.tsx}
            └── dynamic-container/ {*.component.tsx (recebe Outlet por children), *.css.ts}
```

- **ViewModel** = estado/lógica da PAGE (reducer + derivações), **PURO** (lint barra `react`/`@tanstack/react-*`
  em `*.view-model.ts`). **Controller** = estado de UM componente (dropdown do top-bar, accordion do
  side-bar). **Binding** = onde o framework entra (router + aplica a VM).
- **3 componentes do `root`:** `top-bar`, `side-bar`, `dynamic-container`.
- **`<Outlet/>` é montado na ROTA** (composition root) e entra no `DynamicContainer` por **`children`** — a
  tela/VM não conhece a composição de rota.

### 6. SSR-safe

Efeitos de DOM (`document.title`, `setProperty('--sidebar-width')`) só em `useEffect`; `collapsed` inicial
determinístico (`false`); nada de `window`/`localStorage` no corpo/VM/SSR.

## Consequências

**Positivas**
- O shell vira **tela de 1ª classe**, achável pelo mesmo padrão de qualquer tela (espelha login).
- **VM pura/testável** (node:test): título, item ativo, `sidebarWidth`, **menu por permissão (RBAC)**.
- O **design system fica puro** (só peças agnósticas); o shell específico não o polui.
- Zero double-fetch (dado do guard reusado); zero `style` inline com cor (tokens `nav.*`).

**Negativas / custos**
- Mais arquivos que um layout solto (a indireção MVVM). Ampliar o tipo da prop `user` p/ `permissions`.
- O mapeamento "permissão → item de menu" (RBAC) é decisão de produto pendente — a **mecânica** de
  `visibleMenu` entra agora; os `requiredPermission` por item ficam `TODO` até o produto definir.

**Neutras**
- `shell/server` nasce **inexistente** (sem domínio); só ganharia sentido se o bootstrap agregasse N fontes.
- Reaproveita ~70% do trabalho do layout anterior (componentes burros + CSS em tokens).

## Alternativas consideradas

- **`app/layouts/` (layout solto)** — rejeitado: não segue o padrão de TELA (ADR-0009); vira monólito.
- **`shared/ui/organisms`** — rejeitado: viola a Regra de Dependência (DS importando `auth`/router) e
  poluiria o design system com lógica de app. (FSD: markup puro poderia ir ao `shared`; este não é puro.)
- **`shell/server` próprio** — rejeitado: sem domínio; duplicaria a fronteira do `auth`.
- **`useCurrentUser()` no binding** — rejeitado: double-fetch do dado já resolvido no `beforeLoad`.
- **Layout flat (ADR-0009 texto)** — preterido em favor de subpastas (espelha o login real; o lint casa por
  **sufixo**, não por pasta, então ambos passam). Divergência ADR-texto×login é pré-existente.

## Referências

- [ADR-0009](./0009-framework-agnostic-client.md) — cliente agnóstico (ViewModel puro + binding + Command); **base** deste ADR.
- [ADR-0004](./0004-client-server-split-mvvm-ddd.md) — split client×server / MVVM. [ADR-0007](./0007-design-system-vanilla-extract.md) — design system tokens-only. [ADR-0001](./0001-vertical-modular-architecture.md) — módulos verticais + boundaries.
- **Feature-Sliced Design** — [Layers](https://feature-sliced.design/docs/reference/layers) · [Page layouts](https://feature-sliced.design/docs/guides/examples/page-layout) (layout com lógica de camada superior vai à App layer, não ao `shared`).
- Pareceres (read-only): `react-expert` (anatomia MVVM), `css-expert` (co-localização + token `size.topbar`), `tanstack-start-expert` (sem `server/`; SSR), `tanstack-router-expert` (route context por prop, sem refetch).
- `src/modules/auth/client/login/` — a tela-modelo espelhada.
