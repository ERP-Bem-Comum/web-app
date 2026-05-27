# STATE — Migração ERP Frontend

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-27)

**Core value:** O módulo de Contratos deve funcionar 100% na nova arquitetura TanStack Start
**Current focus:** Phase 1 — Bootstrap Infraestrutura TanStack Start

---

## Current Phase

**Phase:** 1
**Name:** Bootstrap Infraestrutura TanStack Start
**Status:** in_progress
**Started:** 2026-05-27

## Progress

- Phase 1: ~60% — entry points criados, Tailwind adaptado, path aliases corrigidos; falta verificar scripts e limpar resíduos Next.js
- Phase 2–11: Not started

## Phase State

**Plans in current phase:**
- `1-1`: Bootstrap entry points e configuração Vite — partial (T001–T007)

**Summaries:** None yet

**Decisions made:**
- Auth bypass só em development (resolvido 2026-05-27)
- Path aliases corrigidos para caminhos relativos (resolvido 2026-05-27)
- ignoreBuildErrors não existe mais (já resolvido no bootstrap)

## Blockers

(None)

## Recent Activity

- 2026-05-27: Resolvidas 3 dívidas técnicas (AUTH_BYPASS, path aliases, ignoreBuildErrors)
- 2026-05-27: Criada estrutura GSD (.planning/)
