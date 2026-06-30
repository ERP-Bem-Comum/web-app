# Implementation Plan: Dados bancários + PIX no Financiador

**Branch**: `integration/financier-bank-pix-030` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

## Summary

Adicionar `bankAccount` + `pixKey` (opcionais) ao Financiador, espelhando o Fornecedor: tipos/contrato (io + client model), schema da borda (response detail + write body), adapter (detailToModel + toWriteBody), form (controller + componente: seção "Dados bancários e PIX") e detalhe. **Reuso** das form-schemas/validações e do enum PIX do Fornecedor (client, mesma pasta); **espelho** apenas de type-aliases/DTOs triviais onde o boundary do server-domain impede import cross-feature. **Zero alteração no Fornecedor.**

## Technical Context

- TanStack Start + React 19 + Zod 4 + vanilla-extract. Sem deps novas. Somente front (BFF + client).
- Reuso (client): `PIX_KEY_TYPES`, `PixKeyType`, `BankAccount`, `SupplierPixKey`, `BankAccountFormSchema`, `PixKeyFormSchema` importados de `supplier.model.ts` (mesma pasta `data/model`).
- Espelho (server, boundary): DTOs `BankAccount/PixKey` em `financier.schema.ts`; type-aliases em `financier.io.ts` (puros, sem lógica divergente).
- Testing: node:test do form-schema do financier (banco/PIX opcionais) e do mapper; gates verdes.

## Constitution Check

PASS. §I (reuso dentro de partners/data; server-domain espelha p/ não furar boundary), §V (Zod na borda), §XI (controller fora da view; view burra), §X (tokens-only no form). Zero-regressão no Fornecedor (não tocado).

## Project Structure (arquivos)

```text
src/modules/partners/server/domain/financier/financier.io.ts        # +bankAccount/pixKey (Input + Detail) — type-aliases espelhados
src/modules/partners/server/adapters/core-api/financier.schema.ts   # DTOs bank/PIX no detail; (write é montado no adapter)
src/modules/partners/server/adapters/core-api/core-api-financiers.ts# detailToModel lê bank/pix; toWriteBody envia bank/pix
src/modules/partners/client/data/model/financier.model.ts           # tipos (reuso) + FinancierFormSchema +bank/PIX + write input
src/modules/partners/client/financier-create/components/financier-form.controller.ts  # estado bank/PIX (espelha supplier)
src/modules/partners/client/financier-create/components/financier-form.component.tsx  # seção "Dados bancários e PIX"
src/modules/partners/client/financier-detail/... (view + componente)# exibição bank/PIX
src/shared/i18n/catalog.pt-BR.ts                                     # rótulos (reusar chaves do padrão de parceiros)
tests/modules/partners/...                                           # form-schema + mapper (aditivo)
```

NÃO tocar: qualquer arquivo de `supplier.*` (só importar exports já existentes).

## Complexity Tracking

Divergência da spec (reuso total) — já contornada: reuso no client; espelho de tipos triviais no server por boundary. Não é lógica divergente (FR-006 ok).

## Estimativa de Pipeline (W0 size)

- **Tamanho**: **M/L** — contrato em 4 camadas + form (controller+componente) + detalhe + i18n + testes.
- **Plano de testes**: form-schema aceita banco/PIX nulos e válidos; toWriteBody/detailToModel cobrem bank/pix; suítes do financier existentes verdes (não-regressão dos 6 campos).
