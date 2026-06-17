# Implementation Plan: Contagem de contratos nos grids de parceiros

**Branch**: `integration/partners-contract-count-028` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

## Summary

Exibir `contractCount` (contratos ativos, já entregue pelo core-api #46) nos 4 grids de parceiros. Para
cada tipo (supplier/financier/act/collaborator) o pipeline é idêntico: **schema da borda → adapter →
model do item → coluna no grid**, + i18n do header. Display-only, aditivo, sem fetch extra.

## Technical Context

- **Stack**: TanStack Start + React 19 + Zod 4 + vanilla-extract, TS strict. Sem deps novas.
- **Camadas tocadas**: `server/adapters/core-api/*.schema.ts` (borda Zod), `core-api-*.ts` (mapeamento),
  `client/data/model/*.model.ts` (tipo do item), `client/*-list/page/*.page.tsx` (coluna), i18n.
- **Resiliência**: `contractCount: z.int().nonnegative().catch(0)` — presente → valor; ausente/inválido →
  `0` (atende FR-004/edge-case e mantém fixtures de teste existentes parseando sem o campo).
- **Testing**: node:test para o mapeamento do adapter (se houver suíte) — aditivo; gates verdes.

## Constitution Check

| Princípio                         | Status                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| I. Vertical-modular               | ✅ tudo dentro de `partners`; sem cruzar fronteira.                                |
| III. Server fn é a fronteira      | ✅ campo lido na borda (schema) e propagado; sem nova travessia.                   |
| V. Validação na borda             | ✅ Zod no `*.schema.ts` valida o campo novo.                                       |
| X. DS só-tokens                   | ✅ coluna usa estilos existentes; sem literal de cor/medida.                       |
| XI. Views burras                  | ✅ a coluna só lê `r.contractCount` (dado do view-model/model); sem hook de dados. |
| Demais (II,IV,VI,VII,VIII,IX,XII) | ✅ N/A ou sem impacto.                                                             |

**Veredito**: PASS. Sem violações, sem divergências.

## Project Structure (arquivos)

```text
src/modules/partners/server/adapters/core-api/
├── supplier.schema.ts · financier.schema.ts · act.schema.ts · collaborator.schema.ts   # +contractCount
├── core-api-suppliers.ts · core-api-financiers.ts · core-api-acts.ts · core-api-collaborators.ts  # itemToModel +contractCount
src/modules/partners/client/data/model/
├── supplier.model.ts · financier.model.ts · act.model.ts · collaborator.model.ts        # {X}ListItem +contractCount
src/modules/partners/client/{supplier,financier,act,collaborator}-list/page/*.page.tsx   # coluna "Contratos"
src/shared/i18n/catalog.pt-BR.ts                                                          # +financiers/acts columns.contracts
tests/modules/partners/...                                                                # ajuste aditivo de fixtures se necessário
```

**Structure Decision**: replicar o padrão existente por tipo. Colaborador já tem a coluna (gated "—") →
trocar `cell` para a contagem; supplier (já tem chave i18n) e financier/act (chave nova) recebem a coluna.

## Complexity Tracking

Sem violações/divergências — N/A.

## Estimativa de Pipeline (W0 size)

- **Tamanho**: **S/M** — 1 campo display replicado em 4 tipos, sem lógica nova.
- **Plano de testes**: garantir que as suítes de adapter/list de partners seguem verdes (o `.catch(0)`
  evita quebra de fixtures sem o campo); se houver teste que compara o objeto mapeado, adicionar
  `contractCount` ao fixture esperado (aditivo).
