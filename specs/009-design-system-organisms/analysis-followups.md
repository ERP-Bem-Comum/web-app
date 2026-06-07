# Follow-ups da Análise (`/speckit-analyze`) — 009-design-system-organisms

> Lista de controle dos achados do analyze (2026-06-07). Nenhum é CRITICAL/HIGH — não bloqueiam o
> `/speckit-implement`. Resolver um por um e marcar `[x]`.

| ID | Sev. | Status | Item | Ação |
|----|------|--------|------|------|
| E1 | MEDIUM | ✅ feito | FR-010 (modal acessível) é a única FR sem task — pertence à US4, cortada do escopo | ~~Mover FR-010 para "Fora de Escopo" da `spec.md`~~ — feito: FR-010 marcada fora de escopo + referência cruzada |
| F1 | MEDIUM | ✅ resolvido | `.specify/memory/constitution.md` era a constituição do **core-api** (cópia por engano) | **Resolvido**: materializada a constituição do web-app (§I–§XII, v1.2.1) consolidando ADRs 0001–0012, com consultoria de especialistas (typescript/react/tanstack-start/css) e citações canônicas via MCP acdg (Evans pp.211/230, Newman p.683, OWASP p.144) |
| C1 | LOW | ✅ feito | 2 edge cases na spec referem US3/US4 (fora de escopo) | ~~Anotar "(US3/US4 — futuro)"~~ — feito nos 2 edge cases |
| U1 | LOW | ✅ resolvido | Mecanismo do harness de showcase visual "a decidir" (T017/R8) | **Resolvido**: rota pública `/showcase/organisms` + e2e (T017/T018) + **6 baselines `-linux` geradas, revisadas e aprovadas** (T019). Receita correta documentada no guia visual-testing (rede `erp-net` + `E2E_HOST_RESOLVER_RULES` + `E2E_SKIP_GLOBAL_SETUP`) |
| D1 | LOW | ✅ feito | `DataTableState` usado no quickstart sem reimport explícito | ~~Ajustar import no `quickstart.md`~~ — feito: `type DataTableState` adicionado |

## Notas

- **E1, C1, D1**: edições pequenas na própria feature — fazer agora, um por um.
- **F1**: extrapola esta feature (governança do repo). Fica registrado como dívida; não tocar aqui.
- **U1**: resolvido naturalmente durante o `/speckit-implement` (T017).
