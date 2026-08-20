# 102 — Papéis de acesso do pagamento por remessa (VAN)

**Tamanho:** M · **Status:** proposta, aguardando decisão de alçada · **Data:** 2026-08-18
**Pré-requisito de:** deploy da VAN em produção (specs/101 · core-api#728)
**Depende de:** core-api em produção com o catálogo `remittance:*` (hoje ausente na `go-live`)

## Problema

A remessa é o **primeiro fluxo do produto que move dinheiro**. Hoje, em qualquer ambiente, existem dois
papéis: `admin-sistema` (o catálogo inteiro — 47 permissões) e o papel de seed. Não há papel de negócio.

Conceder acesso à remessa dando `admin-sistema` às pessoas resolveria o acesso e destruiria o controle:
junto vão `user:*`, `role:*`, `contract:delete` e todo o resto. Quem precisa conferir uma remessa não
precisa poder criar usuários.

## Princípio: segregação de funções

Três funções do fluxo de pagamento **não podem colapsar na mesma pessoa**:

| Função                  | Permissão               | Risco de acumular                                              |
| ----------------------- | ----------------------- | -------------------------------------------------------------- |
| **Lançar** o documento  | `fiscal-document:write` | quem cria o título decide quanto se paga                       |
| **Aprovar** o título    | `payable:approve`       | quem aprova o próprio lançamento aprova o que quiser           |
| **Transmitir** ao banco | `remittance:generate`   | quem aprova e transmite paga sozinho, sem segundo par de olhos |

O core-api já separou `payable:approve` de `remittance:generate`, e separou `remittance:read` de
`remittance:generate` — _"conferir o que sai não é disparar pagamento"_. **Os papéis abaixo não podem
desfazer essa separação.**

## Papéis propostos

Papéis são **componíveis** (um usuário agrega vários), então o desenho é em camadas — sem repetir
permissão e sem criar um papel por pessoa.

### `financeiro-leitura` — base, não move nada

```
fiscal-document:read · bank-account:read · supplier:read · reference:read · reconciliation:read
```

Enxerga Contas a Pagar, contas bancárias e fornecedores. É o piso de qualquer pessoa do financeiro.

### `remessa-conferente` — confere, não dispara

```
financeiro-leitura + remittance:read
```

Abre "Conferir remessa", vê o que entra e o que está impedido, e **não consegue disparar**. Leitura pura:
não consome NSA, não prende título, não toca no bucket. **É seguro conceder amplamente** — errar aqui não
paga nada.

### `remessa-operador` — dispara o pagamento

```
remessa-conferente + remittance:generate
```

⚠️ **Enfileira pagamento real no banco.** Deve ser o menor conjunto possível de pessoas, e **nenhuma delas
deveria ter `payable:approve`** — senão a mesma pessoa aprova e paga.

### `financeiro-conta-bancaria` — cadastro da conta cedente

```
bank-account:read · bank-account:write
```

Necessário para preencher o **convênio** (specs/101 S1), sem o qual a geração recusa. É cadastro, não
pagamento — pode ficar com quem administra as contas, separado de quem transmite.

## Matriz de atribuição — **a decidir**

| Pessoa    | `financeiro-leitura` | `remessa-conferente` | `remessa-operador` | `financeiro-conta-bancaria` | Tem `payable:approve`? |
| --------- | -------------------- | -------------------- | ------------------ | --------------------------- | ---------------------- |
| Bruno     |                      |                      |                    |                             |                        |
| Ana Kécia |                      |                      |                    |                             |                        |
| Kauan     |                      |                      |                    |                             |                        |
| Walkiria  |                      |                      |                    |                             |                        |

**Recomendação:** os quatro entram como **`remessa-conferente`**. `remessa-operador` sai nomeado, depois do
primeiro lote acompanhado — conferir é reversível, disparar não é. A última coluna existe para conferir que
ninguém acumule aprovar + transmitir.

## Como a permissão chega ao ambiente

O catálogo é **fixo em código** (spec 006: "cada permissão nasce com a feature que a verifica"). O job de
deploy `src/jobs/auth/sync-permissions` reconcilia `PermissionCatalog.all` com o banco e garante o
`admin-sistema` com o catálogo completo.

⚠️ **Verificar antes:** que esse job roda no pipeline de produção. Se não rodar, `remittance:*` não existe
lá — e o `PUT /roles/:id` recusa com **422 `role-permission-not-in-catalog`**. Foi exatamente o que
aconteceu no ambiente local: as permissões não existiam porque o seed RBAC só roda na criação do usuário.

## Execução (para quem opera o ambiente)

Nesta ordem. Requer `role:create`, `role:update` e `user:assign-role`.

1. **Criar os papéis** — `POST /api/v1/roles` com `{ name, permissions[] }`, um por papel acima.
2. **Atribuir** — `POST /api/v1/users/:id/roles` com o `roleId`. Idempotente.
3. **Conferir** — `GET /api/v1/users/:id/permissions` devolve as permissões efetivas.

Papel nunca é excluído: desativa-se com `PATCH /roles/:id/deactivate`, e desativar papel ainda atribuído
exige revogar antes (spec 006 US7). Revogação: `DELETE /users/:id/roles/:roleId`.

## Sequência até produção

1. core-api em produção com catálogo `remittance:*` + rotas de remessa _(hoje a `go-live` está 611 commits atrás e não tem nenhum dos dois)_
2. Job `sync-permissions` executado no deploy
3. Papéis criados (este documento)
4. Pessoas atribuídas (matriz acima, decidida)
5. Front da VAN em produção (web-app#346, hoje em `go-live-front`)

Conceder no passo 4 antes do 2 não adianta trabalho: a chamada é recusada.

## Fora de escopo

- **Tela de gestão de papéis no front.** O web-app não tem UI para compor papéis — só o toggle de
  `etl:mass-approver` na criação de usuário. Tudo aqui é via API. Se a gestão de acesso passar a ser
  rotina, vira feature.
- **Alçada monetária por papel.** O `payable:approve` é binário, sem teto por valor.
