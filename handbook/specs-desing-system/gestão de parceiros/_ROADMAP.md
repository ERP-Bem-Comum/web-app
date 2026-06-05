# _ROADMAP — Implementação do Design System "Gestão de Parceiros"

> Documento-guarda-chuva que traduz os specs de design (`00`–`07`), os BDDs e o
> `adendo_001.md` em uma **ordem de implementação** fatiada em specs do **Spec Kit**,
> com estratégia de testes e ownership de agentes. Derivado de uma sessão de
> brainstorming (ver "Decisões desta sessão"). **Fonte de verdade do *o quê*** continua
> nos arquivos `00`–`07` + BDDs; este doc define o ***em que ordem* e *como validar***.

---

## Estado atual (código real em `src/`)

| Camada | Já existe (`src/shared/ui/`) | Falta (pedido pelos specs) |
|---|---|---|
| Tokens | `tokens/tokens.values.ts` (spec `004`) | — (reusar; **SSOT = código**, ver adendo #5) |
| Átomos | `button`, `input`, `checkbox`, `card`, `logo` (spec `005`) | `icon`, `select`, `icon-button`, `add-action`, `remove-action`, `spinner`, `divider`, `avatar`, `label`, `link`, `text-status` |
| Moléculas | `badge`, `field` | `search-field`, `table-row`, `list-row`, `status-cell`, `pagination`, `toolbar`, `nav-item`, `page-header`, `empty-state`, `dialog-actions`, `detail-actions`, `state-municipality-filter` |
| Organismos | — | `data-table`, `transfer-list`/`transfer-panel`, `detail-form`, `confirm-dialog`, `sidebar`, `app-header`, `toast`, `access-denied` |
| Módulo `partners` (front) | — (referência = `auth`) | criado nos verticais (010+) |
| Back `partners` | **existe** em `ERP-CONTRACTS/src/modules/partners` (doc: `ERP-CONTRACTS/docs/README.md`) | contrato BFF a definir nos verticais |

---

## Decisões desta sessão (brainstorming)

1. **Decomposição híbrida:** design system primeiro (em duas specs), depois verticais por padrão.
2. **Testes = pirâmide alinhada ao projeto** (sem lib nova): lint → `node:test` puro → Vitest/jsdom+a11y → Playwright (incl. regressão visual).
3. **Escopo deste ciclo = SÓ design system (008 + 009).** Verticais (dados/BFF/permissões/escrita) adiados.
4. **Regressão visual via Playwright** (reuso do que já existe; não Percy/BackstopJS).
5. **Tokens SSOT = código** (`tokens.values.ts`); spec referencia *intenção*, nunca hex cru (adendo #5; já coberto por lint).
6. **`badge`** permanece em `molecules/` (não mover — quebraria imports); alinhar só o ID no spec.

---

## Decomposição em specs (ordem de dependência — Atomic Design + ADR-0004)

| Spec | Título | Conteúdo | Depende de | Estado |
|---|---|---|---|---|
| **008** | DS — Átomos & Moléculas | os ~10 átomos + ~12 moléculas que faltam (lista acima) | tokens/átomos atuais | **ESTE CICLO** |
| **009** | DS — Organismos | `data-table`, `transfer-list`, `detail-form`, `confirm-dialog`, `sidebar`, `app-header`, `toast`, `access-denied` | 008 | **ESTE CICLO** |
| 010 | Partners — vertical "Lista" | Colaboradores · Fornecedores · Financiadores (páginas, view-models, BFF, guards) | 009 + back | adiado |
| 011 | Partners — vertical "Transfer List" | Estados · Municípios (cascata estado→município); **reescrever `bdd_cidades`** | 009 + back | adiado |
| 012 | Partners — Escrita & Validação | Adicionar/Editar (form + Zod + server-fn de escrita + descarte) | 010/011 | adiado |

> **Regra de ouro:** uma camada só usa a de baixo. Organismos são *views burras* (ADR-0004):
> recebem tudo por props → **testáveis sem backend**. Por isso 008/009 não dependem do `partners`.

---

## Estratégia de testes (pirâmide)

| Nível | Ferramenta | O que cobre em 008/009 |
|---|---|---|
| 0. SSOT de tokens | **ESLint** (já existe) | proíbe hex/rgb/px cru em `ui/`; componente só usa `vars.*` |
| 1. Lógica pura | **`node:test`** (`*.test.ts`, imports relativos) | filtro de busca, transfer add/remove/dedup, "Adicionado" idempotente, derivações puras |
| 2. Componente/DOM | **Vitest + jsdom** (`*.spec.tsx`) | render, variantes, matriz de estados (`06`), **a11y**: roles, `aria-*`, focus-trap (`confirm-dialog`), `aria-current` (sidebar) |
| 3. Regressão visual | **Playwright** (screenshots) | snapshot visual por componente/variante — pega quebra visual que jsdom não vê (adendo #5) |

> **Regras de negócio dos BDDs** (paginação 10, empty vs no-data, busca independente, proteção
> de remoção) materializam-se nos **testes puros das view-models dos verticais (010/011)** — a rede
> anti-regressão. Em 008/009 testamos a **lógica de componente** e o **contrato visual/a11y**.

---

## Ownership de agentes (`/speckit-plan` → `/speckit-implement`)

| Agente (`v2/.claude/agents/`) | Responsabilidade |
|---|---|
| `css-expert` | estilos vanilla-extract (ADR-0007), uso de tokens, regressão visual |
| `react-expert` | composição/comportamento de componentes + a11y |
| `typescript-expert` | tipos/props, discriminated unions de estado, exhaustive switch |
| `tanstack-query-expert` / `tanstack-router-expert` | (verticais) data layer + guards de rota/permissão |
| `zod-expert` | (vertical 012) schemas de formulário e fronteira de server-fn |
| `core-api-consultant` | (vertical 010) contrato BFF ↔ back `partners` (input: `ERP-CONTRACTS/docs/README.md`) |
| `vite-expert` / `nodejs-expert` / `pnpm-expert` | tooling, runners de teste, deps |

---

## Buracos parqueados (de `adendo_001.md`) — destino

| # | Buraco | Resolvido em |
|---|---|---|
| 1 | `bdd_cidades.md` é cópia de `bdd_estado.md` (falta cascata estado→município) | **011** (reescrever o Gherkin) |
| 2 | Contrato BFF ↔ back não especificado (errors-as-values, ADR-0002/0004) | **010** (`core-api-consultant` + BDD de integração) |
| 3 | Matriz RBAC subespecificada (só `collaborator:read`; falta `supplier:*`, `state:*`, `municipality:*`) | **010/011** (sad-path de segurança por módulo) |
| 4 | Fluxos de escrita sem contrato Zod (CNPJ inválido, e-mail, obrigatório vazio) | **012** |
| 5 | Tokens "agnósticos" vs `tokens.values.ts` (duas fontes de verdade) | **resolvido neste ciclo**: SSOT = código + lint + regressão visual |

---

## Referências (hierarquia de verdade)

1. ADRs: `handbook/adr/` — `0001` modular, `0002` errors-as-values, `0004` client×server MVVM/DDD, `0007` design-system vanilla-extract, `0009` framework-agnostic.
2. Constituição: `.specify/memory/constitution.md`.
3. Specs de design: `00`–`07` + BDDs (`bdd_*.md`) + `adendo_001.md` (esta pasta).
4. Feature-modelo: `src/modules/auth/README.md`.
5. Back: `ERP-CONTRACTS/docs/README.md` (para os verticais).

---

## Próximos comandos

```
/speckit-specify   # formaliza a Spec 008 (Átomos & Moléculas) a partir deste roadmap
/speckit-plan      # ordem de implementação da 008 (com ownership de agentes acima)
/speckit-tasks     # tarefas dependency-ordered
/speckit-implement # executa, TDD: teste antes da implementação
```
