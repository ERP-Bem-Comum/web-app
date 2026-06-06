# Descoberta: [FEATURE]

**Feature**: `specs/[###-feature-name]/` · **Consultor**: `/acdg-skills:requirements-engineer`

> Fase 0 (frontend). Elicitação ancorada em Engenharia de Requisitos + Histórias de Usuário.
> Saída alimenta a SPEC. Restrições deste nível = front + BFF (não core-api): a fonte de dados é o
> `core-api` via server function; o front clona comportamento e nunca acessa o backend direto.

## Problema / Oportunidade

[Qual dor/necessidade motiva a feature? 2-4 frases, sem solução técnica.]

## Stakeholders

| Stakeholder | Interesse / o que espera | Decisor? |
|---|---|---|
| [ex: P.O.] | [...] | sim/não |

## Histórias de usuário (INVEST)

<!-- Independent, Negotiable, Valuable, Estimable, Small, Testable -->

- **US-001** (P1): Como [papel], quero [ação], para [benefício].
  - **Valor / prioridade**: [por que P1]
  - **Critérios de aceitação** (viram BDD/cenários): dado [estado], quando [ação], então [resultado na UI].
- **US-002** (P2): ...

## Requisitos

### Funcionais
- **RF-001**: O sistema DEVE [capacidade verificável na UI].

### Não-funcionais (viram métricas)
- **RNF-001**: [performance de tela / acessibilidade / segurança (token never in browser) / i18n] — [alvo].

## Restrições e premissas (frontend)

- Stack: TanStack Start + React 19 + Zod 4 + vanilla-extract; pnpm; TS estrito (ADR-0003/0007/0009).
- BFF é a única fronteira; dados vêm do `core-api` (ver `api-readiness-report.md`).
- Design system só-tokens; strings via i18n.
- [Premissas assumidas quando o pedido foi vago.]

## Fora de escopo

- [O que esta feature explicitamente NÃO faz.]

## Fonte de evidência (engenharia reversa, se clone do legado)

- [Caminhos da evidência crua — screenshots/DOM/context — e o que é "clone fiel" vs. bug a sanear.]

## Perguntas em aberto

- [ ] [NEEDS CLARIFICATION: ...] → resolver em `/speckit-clarify`.
