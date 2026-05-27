# Plan 3-1: Listar Contratos (US2)

**Phase:** 3 — Listar Contratos (US2)
**Objective:** Tela de listagem paginada com filtros e busca textual funcionando em TanStack Start.

## Tasks

1. Domain: branded types (ContractId, ContractCode, Money), enums, ContractPeriod, Contractor, Contract, ContractRow, PaginatedContractRows
2. Domain: Zod schemas (ContractListFiltersSchema, ContractCreateInputSchema)
3. Domain: error types (ContractError union)
4. Application: ContractRepo port (list, getById, create)
5. Adapters HTTP: fetchContracts, fetchContractById com resultFetch + parsing
6. Adapters queries: contractKeys factory
7. Server Function: getContracts com auth middleware
8. Views: ContractsTable com status badges, ações (ver, editar, excluir)
9. Views: ContractFilters com busca textual (debounce), filtros de tipo/status
10. Views: Paginator com navegação de páginas
11. Views hook: useContracts com useSuspenseQuery
12. Route: /contratos com validateSearch, Suspense, filtros e paginação

## Success Criteria

- /contratos lista contratos com filtros, busca e paginação
- Testes de domain passam (branded types, enums)
- Nenhum erro de TypeScript nos arquivos da feature
