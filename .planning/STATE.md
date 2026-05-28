# STATE — Migração ERP Frontend

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-27)

**Core value:** O módulo de Contratos deve funcionar 100% na nova arquitetura TanStack Start
**Current focus:** Phase 7 — CANCELADA por regra de domínio. Avançando para Phase 8.

---

## Current Phase

**Phase:** 12
**Name:** Integração com Backend core-api
**Status:** spec-ready
**Started:** 2026-05-28
**Spec:** `.planning/phases/12-integra-o-com-backend-core-api/12-SPEC.md`
**Requirements:** 8 locked
**Ambiguity:** 0.14 (gate passa)

## Progress

- Phase 1: ✅ Complete — Bootstrap Infraestrutura TanStack Start
- Phase 2: ✅ Complete — Auth e Layout Principal
- Phase 3: ✅ Complete — Listar Contratos (US2)
- Phase 4: ✅ Complete — Criar Contrato (US3)
- Phase 5: ✅ Complete — Visualizar Detalhes e Timeline (US4)
- Phase 6: ✅ Complete — Adicionar Aditivo (US5)
- Phase 7: ❌ Cancelled — Atualizar Dados Bancários (US6) — removida por regra de domínio
- Phase 8: ⏸️ On Hold — Auth Integração será absorvido pela Phase 12 (auth real com backend)
- Phase 9–11: ⏸️ On Hold — serão revisitados após integração com backend real
- Phase 12: 📝 Spec Ready — Integração com Backend core-api (8 requisitos, ambiguidade 0.14)

## Phase State

**Phase 7 — Cancelled:**
- `7-1`: ~~Modal de edição de dados bancários/PIX~~ — REMOVIDO
- `7-2`: ~~Integrar updateContract no ContractDetail~~ — REMOVIDO
- `7-3`: ~~Validação PIX ou bancário obrigatório~~ — REMOVIDO

**Rationale:** Dados bancários/PIX são editados exclusivamente no módulo de Cadastros. Em Contratos, apenas exibição somente leitura é permitida. Todos os artefatos de edição bancária foram removidos do módulo de Contratos.

## Decisions made

- Auth bypass só em development (resolvido 2026-05-27)
- Mock API customizado (H3) na porta 4010 para desenvolvimento offline
- OpenAPI completo mesclado em `handbook/doc.yaml`
- Contrato sem arquivo → Pendente; com arquivo + data → Em Andamento
- Draft não carrega automaticamente no modo create (sempre começa em branco)
- Timeline: contrato base é sempre o primeiro nó cronológico (último na lista visual)
- Aditivos ordenados por createdAt descendente (mais recente primeiro)
- **Phase 12 — Integração Backend (2026-05-28):**
  - Backend core-api é a fonte de verdade; mock API será descontinuada para contratos
  - IDs de contrato passam de `number` para `string` (UUID v4)
  - Valores monetários no BFF: reais → centavos (backend) e centavos → reais (frontend)
  - Parceiros (supplier/financier/collaborator) e dados bancários/PIX permanecem na UI como stub para futura integração com "Gestão de Parceiros"
  - Distrato mapeado como aditivo `kind: 'Misc'` + descrição + término de contrato
  - Auth real: JWT ES256 + refresh tokens rotacionados do backend core-api
  - Upload de PDF via `application/octet-stream` para S3/MinIO (não mais base64 em JSON)
  - **Stack definida (2026-05-28):**
    - `neverthrow` → Domain + Application (Result<T,E> puro)
    - `fp-ts` → Adapters / Borda (TaskEither, composição IO)
    - `newtype-ts` → Branded types (iso, prism)
    - `zod` → Validação na fronteira (input + response)
    - `xstate` → UI state machines
    - `ofetch` → HTTP client (retry, auto-parse)
    - `iron-session` + `jose` → Cookie criptografado + JWT ES256
    - `unstorage` → SessionStore port (memory → Redis)
    - `@t3-oss/env-core` → Env validation
    - `eslint-plugin-boundaries` → Import restrictions entre camadas
    - `vitest` → Test runner

## Blockers

(None)

## Recent Activity

- 2026-05-28: Phase 7 **cancelada** — edição bancária em Contratos removida por regra de domínio
- 2026-05-28: Limpeza técnica — removido ContractBankInfoModal, editContractPaymentInfo, e gatilhos de edição bancária em Contratos
- 2026-05-28: Correção de autenticação — todas as server functions agora usam `authorization: Bearer ${context.session.token}`
- 2026-05-27: Phase 6 completa — Aditivo funcional com modal unificado, RHF + Zod, route /contratos/aditivo/$id
- 2026-05-27: Phase 6 completa — Aditivo funcional com modal unificado, RHF + Zod, route /contratos/aditivo/$id
- 2026-05-27: Phase 5 completa — Detalhes e Timeline com design institucional
- 2026-05-27: Phase 4 completa — Criar Contrato com modal de finalização
- 2026-05-27: Phase 3 completa — Listar Contratos com filtros, busca e paginação
- 2026-05-27: Phase 2 completa — Auth e Layout Principal
- 2026-05-27: Phase 1 completa — Bootstrap Infraestrutura TanStack Start
