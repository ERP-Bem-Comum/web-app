# Métricas & NFRs: Gestão de Parceiros (`partners`)

**Feature**: `specs/008-partners/` · **Consultores**: `/acdg-skills:software-architect` + `/acdg-skills:requirements-engineer`

> NFRs ancorados com citação canônica; toda métrica é mensurável. Foco do front: experiência (latência,
> a11y), integridade (validação na borda) e segurança (token nunca no browser).

## Métricas funcionais

| ID | Métrica | Alvo | Como medir |
|---|---|---|---|
| MF-001 | VOs rejeitam entrada inválida (CPF/CNPJ/Email/UF/PixKey) | 100% rejeita inválido | teste de domínio (`node:test`) |
| MF-002 | `switch` exaustivo em `AppError.kind` → tag i18n | sem `default` solto (guarda `never`) | typecheck + teste de view-model |
| MF-003 | Situação cadastral só avança `Pré → Cadastrado` | transição inválida bloqueada | teste de domínio |
| MF-004 | Desativar Colaborador exige Motivo | botão desabilitado sem motivo | teste de view-model/DOM |
| MF-005 | Troca mock→real não altera UI/ViewModel | diff = 0 em `ui/` e `*.view-model.ts` | revisão + teste de contrato do gateway |

## NFRs

| ID | Categoria | Alvo mensurável | Como medir |
|---|---|---|---|
| NFR-001 | Performance (UI) | listagem p95 < 1s @ volume de teste (≤50) | trace/Lighthouse |
| NFR-002 | Segurança | bundle do client sem `accessToken`/`refreshToken`/`Bearer` | grep no bundle (SC-004) |
| NFR-003 | Acessibilidade | telas navegáveis por teclado; modais com foco/aria-live; contraste AA | axe / Lighthouse a11y |
| NFR-004 | i18n | 0 string literal de UI fora do catálogo | lint |
| NFR-005 | Design system | 0 hex/rgb/px cru em `ui/` (só `vars.*`) | lint (so-tokens) |
| NFR-006 | Evolutibilidade | mock→real isolado no gateway (Princ. XI + SC-005) | revisão de boundaries |

**Citação que sustenta os NFRs** (qualidades = propriedades induzidas por constraints da arquitetura):
> The set of architectural properties of a software architecture includes all properties that derive from the selection and arrangement of components, connectors, and data within the system. Examples include both the functional properties achieved by the system and non-functional properties, such as relative ease of evolution, reusability of components, efficiency, and dynamic extensibility, often referred to as quality attributes.
> Properties are induced by the set of constraints within an architecture. Constraints are often motivated by the application of a software engineering principle to an aspect of the architectural elements.
> — *(Linha 408, p. 96, Roy T. Fielding, *Architectural Styles and the Design of Network-based Software Architectures*)*

> Leitura para a feature: nossos NFRs (evolutibilidade, segurança, reuso) **não são acidentais** — são
> induzidos pelas constraints da constituição (I BFF-boundary, II errors-as-values, XI MVVM agnóstico,
> design-system só-tokens). Medir os NFRs = verificar que as constraints estão sendo respeitadas.

## Métricas de performance (orçamento)

| ID | Indicador | Baseline | Alvo | Orçamento |
|---|---|---|---|---|
| MP-001 | TTI da rota de listagem | N/A (novo) | < 2s | 2.5s |
| MP-002 | tamanho do chunk do módulo `partners` | N/A | a definir no build | < 150KB gzip |
| MP-003 | nº de re-renders por digitação na busca | N/A | debounce/estável | sem render em cascata |

## Critérios de sucesso (tech-agnostic)

- **SC-001**: usuário cria pré-cadastro válido em < 2 min.
- **SC-002**: listagem p95 < 1s no volume de teste.
- **SC-005**: trocar mock→real não exige alteração em `client/ui` nem `*.view-model.ts`.

## Observabilidade

- Erros do BFF logados server-side com `requestId` (envelope do core-api).
- Erros de client capturados em `queryCache.onError`/`mutationCache.onError` (401 → signOut).
- Contadores opcionais de uso por sub-domínio (futuro).
