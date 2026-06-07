# Research: Telas de Financiadores

Sem `NEEDS CLARIFICATION` pendentes — a feature espelha um molde validado (010) sobre um contrato
server já fixado (`financier.io.ts`). As decisões abaixo registram o que foi observado na base e as
escolhas derivadas por consistência.

## Decisão 1 — Espelhar o molde supplier (não reinventar)

- **Decisão**: replicar a árvore `partners/client/supplier-*` para `financier-*`, camada a camada
  (domain → data → list/create/detail/edit → rotas), reusando os helpers compartilhados.
- **Rationale**: o molde 010 já passou no gate, materializa todas as invariantes (§XI views burras,
  §V cadeia de erro, §IX RBAC, §X só-tokens) e tem testes por camada. Reusar reduz risco a ~zero e
  acelera. `can`/`partners-error-tag` (em `client/data/helpers`) e os organismos `DataTable`/`PageHeader`
  são compartilhados — não duplicar.
- **Alternativas**: generalizar supplier+financier num CRUD genérico — rejeitado agora (abstração
  prematura; os domínios divergem o suficiente — categorias/pagamento no supplier — para o custo não
  compensar). Pode ser revisitado quando 3+ entidades existirem.

## Decisão 2 — Fronteiras de import (confirmado na base)

- **Decisão**: `client/data/repository/*.instance.ts` importa as server-fns **direto de
  `server/adapters`** (fronteira §I/§III). `client/data` define seus tipos em `data/model` e
  `PartnersError` local — **não** importa `server/domain` nem `public-api`. As rotas (composition root)
  importam as `*.page.tsx` direto do caminho do módulo e o schema de search params de `client/domain`.
- **Rationale**: é exatamente o que o supplier faz (`supplier.repository.instance.ts`,
  `routes/.../fornecedores/index.tsx`). Mantém boundaries enforçadas por lint.
- **Alternativas**: importar via `public-api` no client — rejeitado: o `public-api` existe para
  consumo **externo** ao módulo; dentro do módulo usa-se o caminho direto/`#modules/<m>/…`.

## Decisão 3 — Diferenças de domínio financier × supplier

- **Decisão**: omitir o que não existe em financier — **sem** `listServiceCategoriesFn` (não há
  categorias de serviço), **sem** dados de pagamento/PIX, **sem** coluna e-mail na lista. Form = 6
  campos (name, corporateName, legalRepresentative, cnpj, telephone, address); CNPJ aceita máscara e o
  client normaliza para 14 dígitos; create/update = PUT total (update inclui os 6 campos + id).
- **Rationale**: o contrato `financier.io.ts` é a fonte de verdade (PJ-only, `FinancierListItem` =
  id/name/corporateName/cnpj/telephone/activation; `FinancierDetail` += legalRepresentative/address).
- **Alternativas**: nenhuma — derivado do contrato existente.

## Decisão 4 — Navegação pós-save e RBAC (do Clarify)

- **Decisão**: **criar → listagem** (`/parceiros/financiadores`); **editar → detalhe**
  (`/parceiros/financiadores/$id`). RBAC: `financier:read` (ver/menu) e `financier:write`
  (criar/editar/ativar/desativar). `financier:edit-sensitive` **não** condiciona nada (sem campos sensíveis).
- **Rationale**: idêntico ao supplier (`supplier-create.binding` navega para a lista; `supplier-edit.binding`
  navega para `$id`). Registrado na seção Clarifications da spec.

## Decisão 5 — Tipo de teste por camada (TDD)

- **Decisão**: puros (`node:test`, imports relativos) para repository, view-models e schemas; DOM
  (Vitest/jsdom, `*.spec.tsx`) para form, filtros, paginador e confirm-dialog.
- **Rationale**: glob disjunto do projeto (`*.test.ts` puro × `*.spec.tsx` DOM). Espelha a divisão das
  suites do supplier. Núcleo de derivação é puro e testável sem React.

## Confirmações da base (estado atual verificado)

- 6 server-fns financier prontos e **exportados no `public-api`**; `.instance.ts` do supplier
  importa as fns de `server/adapters` (padrão a seguir).
- Catálogo i18n único em `src/shared/i18n/catalog.pt-BR.ts` (tags `partners.suppliers.*` a espelhar
  como `partners.financiers.*`).
- Rota supplier valida search params com `SupplierListFiltersSchema` (`client/domain`) — espelhar.
- RBAC de menu por subitem (feature 011) já ligado — basta adicionar o subitem com `financier:read`.
