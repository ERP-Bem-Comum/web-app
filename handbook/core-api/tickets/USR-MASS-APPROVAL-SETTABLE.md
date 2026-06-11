# Request — USR-MASS-APPROVAL-SETTABLE

> Handoff do **front (web-app v2)** para o **core-api**. Padrão `000-request.md`.
> Origem: Gestão de Usuários → **inclusão de usuário** → checkbox **"Aprovador em Massa"** (hoje gated).
> Verificado contra `core-api@dev` em 2026-06-11.

## Título
Permitir **definir manualmente** `massApprovalPermission` no cadastro/edição de usuário (`POST`/`PUT /users`)

## Size
M

## Contexto
No form de **inclusão de usuário**, o checkbox **"Aprovador em Massa"** aparece (paridade com o legado) mas
está **desabilitado**. A área quer que **quem cadastra** o usuário possa **classificar manualmente** se ele
será aprovador em massa ou não — direto no formulário, no momento da criação (e idealmente também na edição).

## Estado atual (verificado)
- `POST /api/v1/users` (`createUserBodySchema`) aceita **apenas** `name`, `cpf`, `email`, `telephone`.
  Não aceita `massApprovalPermission`.
- `PUT /api/v1/users/:id` (`updateUserBodySchema`) aceita só `name`/`email`/`cpf`/`telephone` (parcial).
  Também não aceita `massApprovalPermission`.
- `massApprovalPermission` é **derivado (read-only)** no `GET`: em
  `application/use-cases/get-user.ts` (FR-015) → *"tem a permission `contract:mass-approve` em alguma role?"*.
  Ou seja, hoje a aprovação em massa **só** muda atribuindo ao usuário uma **role/perfil de acesso** que
  contenha `contract:mass-approve`.
- O form de criação do front **não** tem seleção de perfil/role — logo, **não há lever** de aprovação em
  massa na criação hoje.

## Pedido ao backend
1. **Aceitar `massApprovalPermission: boolean`** no `POST /api/v1/users` (criação) e, idealmente, no
   `PUT /api/v1/users/:id` (edição) — persistindo a escolha do operador.
2. **Definir a semântica** em relação à derivação por role (decisão do backend; o front se adapta):
   - **Opção A (override):** o valor manual sobrepõe/define `massApprovalPermission` independente das roles;
   - **Opção B (efetivo = manual OU role):** mantém a derivação por `contract:mass-approve` **e** soma um
     flag manual; o `GET` devolve o efetivo.
   - Avisar qual foi adotada para o front exibir corretamente (e, na edição, mostrar a origem).
3. O `GET /me`/`GET /users/:id` continuam devolvendo `massApprovalPermission` (já devolvem) refletindo a regra.

### Critérios de aceite
1. Criar um usuário marcando "Aprovador em Massa" → `GET /users/:id` retorna `massApprovalPermission: true`.
2. Criar sem marcar → retorna `false` (respeitando a semântica escolhida).
3. (Se edição) alternar o flag no `PUT` reflete no `GET`.

## Impacto no front (hoje)
- Checkbox **"Aprovador em Massa"** segue **gated** (desabilitado, com dica) no form de inclusão.
- Ao liberar: o front **habilita** o checkbox e passa a **enviar** `massApprovalPermission` no `POST`
  (e no `PUT`, se aplicável) — mudança mínima (ligar o campo no controller/mapper). A exibição read-only no
  detalhe permanece, refletindo o valor efetivo.
