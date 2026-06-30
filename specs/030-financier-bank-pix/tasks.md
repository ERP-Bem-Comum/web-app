---
description: 'Task list — dados bancários + PIX no Financiador'
---

# Tasks: Dados bancários + PIX no Financiador

**Input**: specs/030-financier-bank-pix/ (spec, plan)

## Phase 1: Contrato (io + schema + model)

- [x] T001 `financier.io.ts`: `CreateFinancierInput` e `FinancierDetail` ganham `bankAccount: BankAccount | null` e `pixKey: FinancierPixKey | null` (type-aliases espelhados do shape do Fornecedor; sem lógica).
- [x] T002 `financier.schema.ts`: DTOs `BankAccount`/`PixKey` (espelho) no `CoreApiFinancierItemSchema`/Detail (response) — `bankAccount: …nullable()`, `pixKey: …nullable()`.
- [x] T003 `financier.model.ts` (client): importar `BankAccount`, `SupplierPixKey` (alias `PixKey`), `PIX_KEY_TYPES`, `BankAccountFormSchema`, `PixKeyFormSchema` de `supplier.model.ts`; `FinancierDetail` + `FinancierWriteInput` ganham bank/PIX; `FinancierFormSchema` ganha `bankAccount`/`pixKey` (`.nullable().default(null)`).

## Phase 2: Adapter (BFF)

- [x] T004 `core-api-financiers.ts`: `detailToModel` lê `bankAccount`/`pixKey` do parse; `toWriteBody` envia `bankAccount`/`pixKey` (objeto coeso ou null) ao core-api.

## Phase 3: UI (form + detalhe)

- [x] T005 `financier-form.controller.ts`: estado de `bankAccount`/`pixKey` (espelha `supplier-form.controller.ts`), incluindo hidratação na edição e limpeza→null.
- [x] T006 `financier-form.component.tsx`: seção "Dados bancários e PIX" (banco, agência-DV, conta, dígito, tipo de chave, chave PIX), espelhando o Fornecedor; tokens-only; i18n.
- [x] T007 Detalhe do Financiador: exibir banco/PIX quando presentes; degradar quando ausentes.
- [x] T008 i18n: rótulos de banco/PIX p/ financiador (reusar chaves do padrão de parceiros se existirem; senão adicionar `partners.financiers.*`).

## Phase 4: Testes + gates

- [x] T009 (RED→GREEN) Teste do `FinancierFormSchema`: aceita banco/PIX nulos e válidos; e do `toWriteBody`/`detailToModel` cobrindo bank/pix. Aditivo.
- [x] T010 `pnpm typecheck` + `pnpm lint` (0 erros); ajustar fixtures de teste do financier aditivamente.
- [x] T011 `pnpm test` + `pnpm test:dom` verdes (zero regressão dos 6 campos atuais).
- [~] T012 Validação em tela PENDENTE — exige rebuildar o web desta branch (off develop → Financeiro some temporariamente). Gates verdes; validar quando as branches convergirem em develop, ou rebuild dedicado.

## Dependencies

- Phase 1 antes da 2/3. T005 (controller) antes do T006 (componente). T009 (RED) antes da impl correspondente.

## Notes

- Zero alteração em `supplier.*` (só importar exports existentes).
- Reuso no client (form-schemas/PIX enum); espelho de type-aliases/DTOs no server por boundary (sem lógica divergente).
- Escopo = Financiador. Colaborador (banco/PIX create-only) fica no item D (#015).
- 1 feature por PR → PR off develop.
