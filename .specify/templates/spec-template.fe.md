# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`

**Created**: [DATE]

**Status**: Draft

**Input**: User description: "$ARGUMENTS"

> **Variante `-fe` (frontend / web-app).** Espelha o `spec-template.md` (core-api) mas troca a
> semântica de backend pela do **front + BFF unificado** (TanStack Start). A spec descreve o **quê**
> (jornadas, requisitos, critérios) — o **como** (server functions, módulos, MVVM) fica no `plan.md`.
> Governa `src/`; conformidade verificada no "Constitution Check" do `plan-template.fe.md` (princípios I–XII).

## User Scenarios & Testing *(mandatory)*

<!--
  User stories PRIORIZADAS como jornadas (P1, P2, P3…). Cada uma INDEPENDENTEMENTE TESTÁVEL:
  implementar só UMA já entrega um MVP que dá valor. P1 = mais crítica.
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Jornada do usuário em linguagem clara.]

**Why this priority**: [valor + por que P1]

**Independent Test**: [como testar isolado — ex.: "fluxo X via /rota entrega valor Y"]

**Acceptance Scenarios**:

1. **Given** [estado inicial], **When** [ação], **Then** [resultado observável na UI]
2. **Given** [estado], **When** [ação], **Then** [resultado]

---

### User Story 2 - [Brief Title] (Priority: P2)

[...]

---

[Adicione mais histórias conforme necessário, cada uma com prioridade.]

### Edge Cases

- O que acontece quando [condição de borda — lista vazia, 0 resultados, erro de rede]?
- Como a UI reage a [erro do BFF → `AppError.kind` → tag i18n]?
- Estados de carregamento, otimista, e reentrância (duplo submit)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE [capacidade visível ao usuário].
- **FR-002**: Usuários DEVEM conseguir [interação-chave].
- **FR-003**: O sistema DEVE [regra de validação na borda — Zod no input da server fn].

*Marcação de incerteza:*

- **FR-00X**: O sistema DEVE [comportamento] via [NEEDS CLARIFICATION: ...].

### Key Entities *(inclua se a feature envolve dados)*

- **[Entidade]**: [o que representa, atributos-chave sem implementação, relações].

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: [métrica mensurável e tech-agnostic — ex.: "usuário completa o cadastro em < 2 min"].
- **SC-002**: [métrica — ex.: "lista renderiza < 1s p95 com 500 itens"].
- **SC-003**: [satisfação/negócio].

## Impacto Arquitetural (web-app / BFF) *(obrigatório se a feature toca `src/`)*

<!--
  Seção específica do frontend v2. Liga a spec aos princípios da constituição (I–XII):
  BFF-Orchestrated Boundary, Errors-as-values, Client×Server, MVVM, Validação na borda.
  Detalhe técnico fica no plano, não aqui.
-->

- **Módulo(s) vertical(is) afetado(s)**: [ ] novo `src/modules/<m>/` · [ ] estende `auth` · [ ] estende `contracts` · [ ] `shared/ui` (design system)
  - Cross-módulo só via `public-api` (Princ. III). Tocar vários módulos numa feature exige justificativa.
- **Server functions novas/alteradas (a fronteira, Princ. I)?**: [listar `*.server-fn.ts` — input/output esperados]
- **Integração core-api**: [endpoints consumidos + prontidão → ver `api-readiness-report.md`]
- **Novos agregados / Value Objects (server/domain, Princ. IV)?**: [branded type + smart constructor `Result<T,E>`]
- **Eventos no client (Event Bus, Princ. XII)?**: [`EventName` em EN-passado; vivem em `client/data`]
- **Design System**: [ ] novos átomos/moléculas/organismos · [ ] só composição de existentes — ver `design-system/`
- **Possíveis violações da constituição (I–XII)?**: [ex.: token no browser, `class`, `throw` fora da borda, hex cru em `ui/`, data-hook em view burra — escalar no "Complexity Tracking" do plano]

## Assumptions

- [Premissa sobre usuários / escopo / dados / dependências do core-api.]

## Out of Scope

- [O que esta feature explicitamente NÃO faz.]
