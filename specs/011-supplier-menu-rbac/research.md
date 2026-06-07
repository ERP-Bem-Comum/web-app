# Research: RBAC do menu de fornecedores

Sem `NEEDS CLARIFICATION` pendentes. As decisões abaixo consolidam o que já está implementado na
base e fixam as escolhas da feature.

## Decisão 1 — Slug da permissão

- **Decisão**: usar `supplier:read` como `requiredPermission` do subitem "Fornecedores".
- **Rationale**: é o slug de leitura/listagem de fornecedores já presente no catálogo
  `PARTNER_PERMISSIONS` (`src/modules/partners/client/data/helpers/can.ts`). "Ver a entrada de
  menu que leva à listagem" corresponde semanticamente a "poder ler fornecedores". Mantém
  coerência com o RBAC das ações já implementado na feature 010.
- **Alternativas consideradas**:
  - `supplier:write` — rejeitado: esconderia o menu de quem só tem leitura, contrariando o
    objetivo (listar é leitura).
  - Um slug novo dedicado a "menu" (ex.: `supplier:menu`) — rejeitado: inventa permissão fora
    do catálogo do backend, aumenta acoplamento e exige mudança no core-api (fora de escopo).
  - Permissão no nível da **seção** "Gestão de Parceiros" em vez do subitem — rejeitado por ora:
    a seção pode ganhar outros subitens (colaboradores, financiadores) com permissões distintas;
    o filtro correto é por **subitem**, e a seção some sozinha quando fica vazia (já implementado).

## Decisão 2 — Onde a regra vive

- **Decisão**: a regra de visibilidade permanece em `rootViewModel.visibleMenu` (núcleo agnóstico
  puro); a feature só altera o **dado** (`shell-menu.config.ts`).
- **Rationale**: `visibleMenu` já filtra subitens por `requiredPermission` e remove a seção
  accordion quando ela fica sem subitens — exatamente o comportamento exigido pela spec (US1).
  Não há código de derivação novo a escrever; reusar evita duplicação (Princípio XI, MVVM).
- **Alternativas consideradas**:
  - Filtrar na view/binding — rejeitado: violaria "views burras" (§XI) e tiraria a regra do
    núcleo testável em `node:test`.

## Decisão 3 — Tipo de teste

- **Decisão**: teste **puro** (`node:test`, `*.test.ts`, imports relativos), estendendo
  `tests/modules/shell/client/root/root.view-model.test.ts` com um bloco que importa o **MENU
  real** e exercita `visibleMenu` nos três casos (com `supplier:read`, sem ela, e `[]`).
- **Rationale**: a regra é uma derivação pura sem DOM. Os testes atuais usam um menu **sintético**
  (fixtures locais) — bons para a lógica genérica, mas **não travam a configuração real**. Um
  teste sobre o `MENU` exportado vira um **teste de regressão de configuração**: se alguém
  remover o `requiredPermission` do subitem no futuro, o teste falha. É o artefato que converte o
  aprendizado em governança (preferência registrada do projeto).
- **Alternativas consideradas**:
  - Teste de DOM (Vitep/jsdom) renderizando a `SideBar` — rejeitado: desnecessário; a regra não
    é de UI, e DOM seria mais lento e frágil para o que é uma derivação pura.
  - Não testar (confiar no teste sintético existente) — rejeitado: não trava a config real, que é
    justamente o que a feature entrega.

## Confirmações da base (estado atual verificado)

- `shell-menu.config.ts`: subitem `{ label: 'Fornecedores', to: '/parceiros/fornecedores' }` —
  **sem** `requiredPermission` hoje.
- `MenuSubItem.requiredPermission?: string` — campo opcional já tipado.
- `visibleMenu(menu, permissions)` — filtra subitens por permissão e descarta accordion vazio;
  não muta o menu.
- Cadeia ligada: `getCurrentUserFn()` (server fn → `/me`, `permissions[]` reais) → `beforeLoad`
  de `_authenticated/route.tsx` → `RootPage user` → `useRootBinding(user)` →
  `visibleMenu(MENU, user.permissions)`.
- `PARTNER_PERMISSIONS` inclui `supplier:read`.
