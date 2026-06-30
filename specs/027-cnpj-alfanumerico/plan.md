# Implementation Plan: CNPJ alfanumérico (Serpro/2026) no frontend

**Branch**: `integration/cnpj-alfanumerico-027` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/027-cnpj-alfanumerico/spec.md`

## Summary

Adequar o frontend (front + BFF) ao CNPJ alfanumérico já suportado pelo core-api (PR #96/ADR-0044). A
abordagem central é **extrair um helper puro único de CNPJ** em `src/shared/` (normalizar, validar formato,
mascarar, distinguir CPF×CNPJ) e fazer todas as superfícies hoje "só-dígitos" consumirem esse helper:
máscara do Design System, VO de CNPJ do front, schemas Zod de parceiros, normalização nos adapters core-api
e helpers de exibição em Contratos/Financeiro. Mudança **aditiva**, com testes puros (node:test) cobrindo os
fixtures do contrato do backend e mantendo as suítes existentes verdes (zero regressão).

## Technical Context

**Language/Version**: TypeScript strict (migração 6→7, `erasableSyntaxOnly`).

**Primary Dependencies**: TanStack Start (Vite + Nitro), React 19, Zod 4, vanilla-extract. Nenhuma dep nova.

**Storage**: N/A (sem persistência no front; o dado vem/vai via BFF→core-api).

**Testing**: `node:test` (lógica pura — helper de CNPJ, VO, schemas: `*.test.ts`, imports relativos);
Vitest+jsdom só se houver comportamento de UI a cobrir (`*.spec.tsx`). TDD: testes antes.

**Target Platform**: Browser (client) + Nitro server (BFF).

**Project Type**: Web app (front + BFF unificado), módulos verticais com split client×server.

**Performance Goals**: N/A — operações de string O(n) triviais; sem impacto perceptível.

**Constraints**: tokens-only no DS; errors-as-values; sem `class`/`throw`/`any` fora da borda; i18n para
strings de UI; **zero regressão** no código do tech lead (mudança aditiva).

**Scale/Scope**: 1 helper compartilhado novo + ~10 pontos de consumo (DS mask, VO, 3 models de parceiro,
3 adapters core-api, 2 view-models/components de Contratos, 2 pontos do Financeiro), 1 tag i18n.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Princípio                                | Avaliação                                                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **I. Vertical-Modular**                  | ✅ O helper vive em `src/shared/` (cross-cutting puro, permitido por todas as camadas). Cada módulo só ajusta seus próprios arquivos; nada cruza fronteira de módulo sem ser via `shared`. |
| **II. Erros como valores**               | ✅ Helper de formato retorna `boolean`/`string` puros; o VO continua retornando `Result<CNPJ, CNPJError>`. Sem `throw`.                                                                    |
| **III. Server fn é a fronteira**         | ✅ Normalização acontece nos adapters core-api (borda), antes do envio. Sem novas travessias.                                                                                              |
| **IV. Estados ilegais irrepresentáveis** | ✅ VO branded `CNPJ` mantido (smart constructor + `Result`); `as` só dentro do smart constructor.                                                                                          |
| **V. Cadeia de erro fim-a-fim**          | ✅ `invalid-cnpj` do backend mapeado para tag i18n; UI não olha status HTTP.                                                                                                               |
| **VI. TS estrito/apagável**              | ✅ Sem `enum`/`namespace`/`any`; uniões de literais e `as const`.                                                                                                                          |
| **VII. Imutabilidade**                   | ✅ Helpers puros, sem estado mutável compartilhado.                                                                                                                                        |
| **VIII. Mínimo de deps**                 | ✅ Zero dependências novas; só `String`/`RegExp` nativos.                                                                                                                                  |
| **IX. Segurança por construção**         | ✅ Sem segredos; normalização não introduz superfície. Regex ancorada (`^…$`), sem catastrophic backtracking.                                                                              |
| **X. Design System só-tokens**           | ✅ Mudança é em lógica de máscara (`.ts`), não em estilos; nenhum literal de cor/medida.                                                                                                   |
| **XI. MVVM / views burras**              | ✅ Lógica de máscara/validação fica em utilitário puro e nos view-models; views continuam burras.                                                                                          |
| **XII. Event bus**                       | N/A — sem novos eventos de domínio.                                                                                                                                                        |

**Veredito**: PASS. Sem violações. Uma **divergência consciente em relação ao não-objetivo da spec** (ver
Complexity Tracking) — não é violação de constituição, é decisão de escopo.

## Project Structure

### Documentation (this feature)

```text
specs/027-cnpj-alfanumerico/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões (helper único, DV, heurística CPF×CNPJ)
├── data-model.md        # Fase 1 — representação do CNPJ + API do helper
├── quickstart.md        # Fase 1 — como validar (fixtures + testes + manual)
├── contracts/
│   └── cnpj-helper.contract.md   # Assinaturas do helper + tabela de comportamento da máscara
├── checklists/
│   └── requirements.md  # Checklist de qualidade da spec (já ✓)
└── tasks.md             # Fase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
src/shared/
└── document/                          # NOVO — utilitário puro cross-cutting de documentos
    └── cnpj.ts                        #   normalizeCnpj · isValidCnpjFormat · maskCnpj · maskCpfCnpj · isCnpjLength

src/shared/ui/atoms/input/
└── input.mask.ts                      # consome o helper (maskCnpj alfanumérico; heurística cpf-cnpj revista)

src/modules/partners/server/domain/value-objects/
└── cnpj.value-object.ts               # normalização alfanumérica + DV via fórmula Serpro (charCodeAt−48)

src/modules/partners/client/data/model/
├── supplier.model.ts                  # CnpjFieldSchema → normalizeCnpj + refine formato
├── financier.model.ts                 # idem
└── act.model.ts                       # idem (hoje transforma com onlyDigits)

src/modules/partners/server/adapters/core-api/
├── core-api-suppliers.ts              # onlyDigits → normalizeCnpj no envio (length 14)
├── core-api-financiers.ts             # idem
└── core-api-acts.ts                   # idem

src/modules/contracts/client/                       # exibição
├── contract-list/contract-list.view-model.ts       # formatação por documento (14 alfanum / 11 num)
├── contract-list/components/contract-row.component.tsx
├── contract-detail/components/contract-info.component.tsx
├── contract-create/components/contract-form.component.tsx
└── amendment-create/components/amendment-modal.component.tsx

src/modules/financial/client/                        # exibição + busca
├── contas-a-pagar-list/contas-a-pagar.view-model.ts # maskCnpj de exibição
└── document-create/document-form.view.ts            # isCnpj + filtro de busca de fornecedor

src/shared/i18n/catalog.pt-BR.ts                      # tag para invalid-cnpj

tests/                                                # espelha src/ — node:test (*.test.ts)
├── shared/document/cnpj.test.ts                      # NOVO — fixtures válidos/inválidos
└── modules/partners/server/domain/*.test.ts          # atualizar fixtures p/ alfanumérico (aditivo)
```

**Structure Decision**: helper puro em `src/shared/document/cnpj.ts` (camada `shared`, importável por
qualquer camada conforme `boundaryRules`). Consumido pelo DS (`ui/atoms/input`), pelo domínio
(`server/domain` → só importa `shared`), pelos adapters (borda) e pelos view-models/components. Centralizar
elimina as ~6 cópias divergentes de "máscara por dígitos" e dá um único ponto de teste.

## Complexity Tracking

> Divergência de escopo (não de constituição) que precisa ser registrada e aprovada.

| Item            | Decisão                                                                                                                                                                                                                                                                                                              | Por quê / alternativa rejeitada                                                                                                                                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **DV no front** | A spec listou "não calcular DV" como **não-objetivo**, mas o VO `cnpj.value-object.ts` **já calcula DV** (módulo 11) e é load-bearing (supplier/financier use-cases + pix-key + 4 suítes). **Decisão: estender o DV para alfanumérico** (fórmula Serpro `charCodeAt−48`, idêntica p/ numérico), em vez de removê-lo. | Remover o DV seria **regressão** na validação existente (CNPJ numérico com DV errado deixaria de ser pego localmente) → fere a política de zero regressão. Manter+estender preserva o feedback local e cobre alfanumérico. Mantém o front como "espelho" do backend, não fonte divergente. |

## Migrations Drizzle (core-api)

- **Mudanças de schema**: [x] nenhuma. Feature **somente frontend**; o backend já entregou (ADR-0044).

## Contrato HTTP (Fase 2+)

N/A — não há novos endpoints. A borda dos parceiros (supplier/financier/act) já aceita `length(14)`; o
front passa a enviar 14 caracteres normalizados (alfanuméricos maiúsculos) em vez de "14 dígitos".

## Estimativa de Pipeline (W0 size)

- **Tamanho**: [x] **M** — utilitário puro novo + refactor localizado em múltiplos consumidores, sem novo
  agregado/BC/endpoint.
- **Justificativa**: a lógica é simples, mas transversal (vários arquivos) e exige TDD do helper + VO +
  não-regressão das suítes de parceiros.
- **Plano de testes W0 (RED)**: `tests/shared/document/cnpj.test.ts` falha primeiro descrevendo
  `normalizeCnpj`/`isValidCnpjFormat`/`maskCnpj`/`maskCpfCnpj` com os fixtures do contrato; depois os testes
  do VO (`value-objects.test.ts`) ganham casos alfanuméricos (válido `12ABC34501DE35`, DV inválido
  `12ABC34501DE34`, formato inválido `12ABC34501DEAB`).
