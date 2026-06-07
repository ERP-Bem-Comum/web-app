# Métricas & NFRs: [FEATURE]

**Feature**: `specs/[###-feature-name]/` · **Consultores**: `/acdg-skills:software-architect` + `/acdg-skills:requirements-engineer`

> Fase de NFRs (frontend, máximo rigor). NFRs ancorados com **citação canônica** via `skills_citar`.
> Toda métrica deve ser **mensurável**. Foco do front: experiência (latência de tela, acessibilidade),
> integridade (validação na borda), e segurança (token nunca no browser).

## Métricas funcionais

> "Faz a coisa certa" — verificáveis por teste/cenário.

| ID | Métrica | Alvo | Como medir |
|---|---|---|---|
| MF-001 | [ex: VO rejeita CPF inválido] | 100% | teste de domínio (`node:test`) |
| MF-002 | [ex: switch exaustivo em AppError → tag i18n] | sem `default` solto | typecheck + teste view-model |

## NFRs

| ID | Categoria | Alvo mensurável | Como medir |
|---|---|---|---|
| NFR-001 | Performance (UI) | [ex: lista p95 < 1s @ 500 itens] | trace/Lighthouse |
| NFR-002 | Segurança | bundle do client sem `accessToken`/`refreshToken`/`Bearer` | grep no bundle (SC-002 da auth) |
| NFR-003 | Acessibilidade | [ex: navegável por teclado; contraste AA] | axe / Lighthouse a11y |
| NFR-004 | i18n | 0 string literal de UI fora do catálogo | lint |
| NFR-005 | Design system | 0 hex/rgb/px cru em `ui/` | lint (so-tokens) |

**Citação que sustenta os NFRs** (obrigatória):
> [trecho literal ≥4 linhas — `skills_citar`]
> — *(Linha NNNN, p. PP, AUTOR, *LIVRO*)*

## Métricas de performance (orçamento)

| ID | Indicador | Baseline | Alvo | Orçamento |
|---|---|---|---|---|
| MP-001 | TTI da rota | [N/A] | [alvo] | [limite] |
| MP-002 | tamanho do chunk da feature | [...] | [...] | [...] |

## Critérios de sucesso (mensuráveis, tech-agnostic)

- **SC-001**: [ex: usuário completa o fluxo X em < 2 min].
- **SC-002**: [métrica de negócio].

## Observabilidade

[Como observar em runtime: logs do BFF, contadores, erros do TanStack Query (queryCache.onError).]
