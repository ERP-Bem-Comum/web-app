# ADR-0001: Clone fiel do legado com integração progressiva (mock onde a API não existe)

**Feature**: `specs/008-partners/` · **Status**: Aceito
**Data**: 2026-06-05 (atualizado 2026-06-06) · **Consultor**: `/acdg-skills:software-architect`

> **Atualização (2026-06-06)**: o time core-api implementou os gaps (import, export, catálogo, estados,
> municípios). O **mock deixou de ser necessário** para a Fase 1 — a API cobre toda a superfície. A parte
> ainda válida e mantida desta decisão é o **princípio**: clone-fiel + saneamento de bugs de borda na ACL,
> e o **ponto de troca isolado no gateway** (SC-005). Permanecem fora (não-mock): financiador-PF e filtros
> programa/idade (decisão de escopo). Detalhe da seção §2 sobre "mock" agora se lê como "gateway trocável".

## Contexto

A Gestão de Parceiros deve **clonar fielmente** o comportamento visível do legado (o usuário não pode
perceber a troca de tecnologia). Porém, o `core-api` está **parcialmente pronto** (ver
`api-readiness-report.md`): Financiadores/Fornecedores 🟢, Colaboradores 🟡 (sem import em lote, sem
filtros programa/idade), Estados/Municípios 🔴 (ausentes). Além disso, o legado tem **bugs de borda**
(encoding `AvaliaÃ§Ã£o`, breadcrumb singular/plural) que são da API/legado, não da UI.

Precisamos entregar valor já (Princ. X, entrega incremental) sem acoplar a UI ao estado atual do backend,
e sem replicar bugs que não são de UI.

## Decisão

1. **Clonamos o comportamento visível**, mas **saneamos** bugs de borda (encoding/breadcrumb) na
   **anti-corruption layer** (`server/adapters`). Bugs reservados (coluna `CONTRATOS/ADITIVOS` vazia) são
   mantidos como placeholder.
2. **Integração progressiva**: onde a API existe, integramos de verdade; onde não existe (Estados/Municípios)
   ou é parcial (import/export, catálogo de categorias), usamos **mock/fallback isolado no gateway/repository**
   (`client/data`) ou no client core-api (`server/adapters`). A **UI (`client/ui`) e o `*.view-model.ts` não
   mudam** quando o mock vira real (SC-005).

**Fundamentação canônica** (anti-corruption layer):
> New systems almost always have to be integrated with legacy or other systems, which have their own models. Translation layers can be simple, even elegant, when bridging well-designed BOUNDED CONTEXTS with cooperative teams. But when the other side of the boundary starts to leak through, the translation layer may take on a more defensive tone.
> When a new system is being built that must have a large interface with another, the difficulty of relating the two models can eventually overwhelm the intent of the new model altogether...
> — *(Linha 4997, p. 224, Eric Evans, *Domain-Driven Design*)*

A ACL é exatamente o lugar para sanear o legado e abrigar o mock: protege o domínio limpo do módulo do
modelo legado do core-api e do "vazamento" de bugs de borda.

## Consequências

- **Positivas**: entrega já (sub-domínios prontos); UI estável; ponto único de troca mock→real; bugs de borda saneados sem replicar.
- **Negativas / custo**: manter mocks coerentes com o contrato futuro; risco de divergência se o backend mudar o shape — mitigado validando com Zod na borda.
- **Ponto de troca / reversibilidade**: o `gateway`/`repository` (client) ou o client core-api (server). Trocar um mock por chamada real não toca UI/ViewModel.

## Alternativas consideradas

| Alternativa | Por que rejeitada |
|---|---|
| Esperar o backend ficar 100% pronto | Bloqueia a entrega dos sub-domínios já prontos; D9 do ADR-0031 (estados/municípios) é incerto. |
| Mockar na UI / ViewModel | Viola Princ. XI (view burra) e SC-005; acopla a apresentação ao estado do backend. |
| Replicar os bugs de borda (encoding) | Degrada a experiência; o bug é da API, não da UI — saneável na ACL. |
