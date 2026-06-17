# Specification Quality Checklist: Território (UF + município) no Colaborador

**Created**: 2026-06-17 · **Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details além do contrato externo (shape territory)
- [x] Focused on user value (registrar território do colaborador)
- [x] Written for stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements testable/unambiguous
- [x] Success criteria measurable
- [x] Success criteria technology-agnostic
- [x] Acceptance scenarios defined
- [x] Edge cases identified (parcial, município texto livre, PUT omite)
- [x] Scope bounded (só território; demais sub-features do #015 à parte)
- [x] Dependencies/assumptions identified

## Feature Readiness

- [x] FRs com critérios claros
- [x] User scenario cobre criar + detalhe
- [x] Success Criteria alinhados
- [x] Sem vazamento de implementação

## Notes

- 2 decisões p/ o `/speckit-plan`: (1) fonte das 27 UFs (reusar `UF_NAMES`/geografia vs lista estática local, respeitando boundaries); (2) como tratar a assimetria "PUT omite território" na UI de edição (campo read-only no detalhe). Nenhuma é bloqueante (há defaults).
