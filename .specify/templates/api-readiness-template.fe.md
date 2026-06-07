# Relatório de Prontidão da API (core-api): [FEATURE]

**Feature**: `specs/[###-feature-name]/` · **Emissor**: Arquitetura Frontend v2 · **Destinatário**: Time core-api

> Documento `-fe` específico do BFF. Como o browser **nunca** fala com o `core-api` direto (Princ. I),
> toda capacidade depende de um endpoint atrás da server function. Este relatório mapeia, por
> sub-domínio/capacidade, **o que a API já entrega** vs. **o que falta**, e define a **estratégia de
> integração progressiva** (integrar de verdade onde está pronto, mock/fallback onde não está — como o
> módulo `contracts` fez). Alimenta o `plan.md` (seção "Integração core-api") e os ADRs.

## 1. Resumo Executivo

[3-5 linhas: dá pra integrar já? quanto depende de mock? riscos. Cite o prefixo de rotas
(`/api/v1` vs `/api/v2`) e a fonte de verdade do contrato (`GET /docs/json` — OpenAPI).]

## 2. Matriz de Prontidão

| Sub-domínio / Capacidade | Endpoint (método rota) | Existe? | Contrato OK? | RBAC | Veredito |
|---|---|---|---|---|---|
| [ex: Listar X] | `GET /api/vN/x` | ✅/❌ | ✅/parcial | `x:read` | 🟢 PRONTO / 🟡 PARCIAL / 🔴 AUSENTE |

## 3. Gaps por Sub-domínio

### [Sub-domínio] — 🟢/🟡/🔴 [PRONTO/PARCIAL/AUSENTE]

- **Endpoints**: [rotas + arquivo no core-api]
- **Contrato (request/response)**: [campos relevantes; divergências vs. o que o front precisa]
- **Agregado/tabela**: [existe? cite schema/migration]
- **GAP**: [o que falta — endpoint inexistente, campo, filtro, import/export, catálogo de opções]
- **Estratégia front**: [integrar direto · mock total · fallback (tenta API, cai pra mock) · hardcode de catálogo]

## 4. Estratégia de Integração Progressiva

| Sub-domínio | Fase 1 (agora) | Quando o backend evoluir |
|---|---|---|
| [X] | [integra real / mock] | [trocar gateway mock → real, sem tocar UI/ViewModel] |

> Decisão registrada como ADR (ex.: "clone-fiel + mock progressivo"). O ponto de troca é o **gateway/
> repository** (`client/data`) ou o **client core-api** (`server/adapters`) — a UI e o ViewModel não mudam.

## 5. Pedidos ao Time core-api (priorizados)

- **P1**: [endpoint/campo bloqueante].
- **P2**: [melhoria].
