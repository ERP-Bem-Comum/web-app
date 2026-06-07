# Data Model: RBAC do menu de fornecedores

> A feature **não introduz** entidades de domínio nem schema. Este documento descreve o modelo
> conceitual já existente que a feature toca, para ancorar as tasks e o teste.

## Entidades (já existentes)

### MenuSubItem

Entrada navegável dentro de uma seção do menu.

| Campo | Tipo | Regra |
|---|---|---|
| `label` | `string` | rótulo exibido |
| `to` | `string` | destino de navegação |
| `requiredPermission` | `string?` (opcional) | slug RBAC exigido; **ausente = sempre visível** |

- **Mudança da feature**: o subitem "Fornecedores" passa de `requiredPermission` **ausente** para
  `requiredPermission = 'supplier:read'`.

### MenuSection

Agrupamento (accordion) ou link direto do menu.

| Campo | Tipo | Regra |
|---|---|---|
| `label` | `string` | rótulo |
| `iconId` | `MenuIconId` | id do ícone (string → SVG na SideBar) |
| `to` | `string?` | destino direto (opcional) |
| `requiredPermission` | `string?` | permissão da seção inteira (opcional) |
| `subItems` | `readonly MenuSubItem[]?` | filhos (opcional) |

- **Regra de visibilidade da seção** (já implementada em `visibleMenu`): a seção é descartada
  quando **não tem `to` próprio** **e** **todos os seus `subItems` foram filtrados** (accordion
  vazio). A seção "Gestão de Parceiros" hoje tem só o subitem "Fornecedores" → ao filtrar o
  subitem, a seção some.

### Permissão (slug)

Capacidade nomeada concedida ao usuário, vinda de `permissions[]` na identidade da sessão.

- Relevante aqui: **`supplier:read`** — pertence ao catálogo `PARTNER_PERMISSIONS`.
- Origem (sem mudança): `GET /me` do core-api → `AuthUser.permissions` → route context → menu.

## Função de derivação (já existente, sem alteração)

`rootViewModel.visibleMenu(menu, permissions) → readonly MenuSection[]`

Pseudocomportamento (já implementado):

```
allowed(required) = required === undefined || permissions.includes(required)
1. mantém seções cujo requiredPermission é allowed
2. em cada seção com subItems, mantém só os subItems allowed
3. descarta seção que (não tem `to`) e (tem subItems) e (subItems ficou vazio)
```

## Transições de estado

Não há máquina de estado nova. A visibilidade é uma **função pura** de
`(MENU, permissions) → menu visível`, recomputada a cada render do shell.
