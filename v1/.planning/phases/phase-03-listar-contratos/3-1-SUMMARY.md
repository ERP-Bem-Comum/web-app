# Summary 3-1: Listar Contratos (US2)

**Phase:** 3
**Plan:** 3-1
**Status:** ✅ Complete
**Date:** 2026-05-27

## What Was Done

- ✅ Domain: `types.ts` com branded types, enums, Contract, ContractRow, PaginatedContractRows
- ✅ Domain: `schemas.ts` com Zod (ContractListFiltersSchema, ContractCreateInputSchema)
- ✅ Domain: `errors.ts` com ContractError union
- ✅ Application: `ports.ts` com ContractRepo (list, getById, create)
- ✅ Adapters HTTP: `contracts.ts` com fetchContracts, fetchContractById + parsing
- ✅ Adapters queries: `queries.ts` com contractKeys factory
- ✅ Server Functions: `src/server/contracts.ts` com getContracts, getContractById, createContract, updateContract, deleteContract, createAditive, getContractHistory
- ✅ Views: `ContractsTable.tsx` com status badges, links (ver/editar), delete com mutation
- ✅ Views: `ContractFilters.tsx` — busca textual com debounce 300ms, filtros tipo/status, limpar filtros
- ✅ Views: `Paginator.tsx` — navegação de páginas com 5 páginas visíveis
- ✅ Views hook: `useContracts.ts` com useSuspenseQuery
- ✅ Route: `/contratos/index.tsx` com validateSearch, Suspense, filtros e paginação

## Verification

- `yarn typecheck` sem erros nos arquivos da feature
- Mock API retorna 35 contratos com paginação real
- Filtros de busca, tipo e status funcionam

## Issues Encountered

- Tipagem do router context precisou ser ajustada (`RouterContext` exportado de `router.tsx`)
- `useNavigate` com `from` precisou ser simplificado para evitar erros de tipo

## Next Steps

Phase 4: Criar Contrato (US3) — formulário com validações, auto-save, regras de negócio.
