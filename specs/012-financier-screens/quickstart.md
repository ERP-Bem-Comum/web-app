# Quickstart: Telas de Financiadores

## O que muda (resumo de 1 minuto)

Espelho do molde supplier (010) para financier, **só no front**. Server-fns prontos. Diferenças:
PJ-only com 6 campos, **sem** categorias de serviço e **sem** pagamento/PIX; sem coluna e-mail.

- **client/domain**: `financier.types.ts`, `financier.schemas.ts` (search + form)
- **client/data**: `financier.model.ts`, `financier.repository.ts` (+`.instance.ts`)
- **4 telas**: `financier-{list,create,detail,edit}/` (view-model + binding + page + components)
- **4 rotas**: `routes/_authenticated/parceiros/financiadores/{index,criar,$id,$id.editar}.tsx`
- **menu**: subitem "Financiadores" (`financier:read`) em `shell-menu.config.ts`
- **i18n**: tags `partners.financiers.*` em `catalog.pt-BR.ts`

## Como validar localmente

```bash
# Puros (node:test) — repository, view-models, schemas:
node --experimental-strip-types --test tests/modules/partners/client/financier-list/financier-list.view-model.test.ts

# DOM (Vitest) — form/filtros/paginador/confirm-dialog:
pnpm test:dom tests/modules/partners/client/financier-create/financier-form.spec.tsx

# Gate completo:
pnpm verify          # typecheck + lint + test
pnpm test:dom        # componentes/UI
```

### Verificação manual (stack de pé)

`../ERP-INFRA/local/up.sh` → `https://app.localhost`. Logar com usuário **com** `financier:read`:
o subitem "Financiadores" aparece sob "Gestão de Parceiros". Listar → criar → detalhar → ativar/
desativar → editar. Sem `financier:write`: ações de escrita ocultas/desabilitadas. Sem
`financier:read`: subitem some.

## Checklist de conformidade (por invariante)

- [ ] **§XI views burras**: `*.page.tsx`/`*.component.tsx` sem `useQuery`/`useMutation`/`useReducer`.
- [ ] **Núcleo agnóstico**: `*.view-model.ts` sem `react`/`@tanstack/react-*`.
- [ ] **§I boundaries**: `client/data` importa fns de `server/adapters`; não importa `server/domain`
      nem `public-api`; rotas importam pages direto do módulo.
- [ ] **§V cadeia de erro**: `PartnersError` → `partners-error-tag` → tag i18n; UI não olha status HTTP.
- [ ] **§IX RBAC**: `can()` com `financier:read`/`financier:write`; menu por `financier:read`;
      `edit-sensitive` não usado. Degradação `[]` → esconde.
- [ ] **§X só-tokens**: `*.css.ts` usam `vars.*`; reusa `DataTable`/`PageHeader`.
- [ ] **i18n**: nenhuma string literal nas views; todas as tags `partners.financiers.*` existem.
- [ ] **Diferenças**: sem categorias, sem pagamento/PIX, sem coluna e-mail.
- [ ] **Gate**: `pnpm verify` + `pnpm test:dom` verdes; routeTree regenerado.

## Referência (molde a espelhar)

`src/modules/partners/client/supplier-*` + `tests/modules/partners/.../supplier-*`. Para cada arquivo
supplier, há um equivalente financier (menos categorias/pagamento/e-mail).
