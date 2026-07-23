# 091 — Contrato: objeto longo salva + contador de caracteres

## Problema

Salvar contrato com **Objeto longo** falhava, mesmo após o core-api mudar `ctr_contracts.objective`
para `text` (#530). Causa real: o `title` do contrato é `varchar(255)` e o controller **derivava o
title do objeto inteiro** quando o título estava vazio (`title = state.title || state.objective`).
Objeto > 255 chars → title > 255 → estoura a coluna → salvamento falha.

## Escopo (front-only)

1. **Título derivado curto:** quando não há título explícito, deriva um título **curto** do objeto
   (whitespace colapsado, ≤120 chars + reticências). Título explícito é clampado a 255. Assim o objeto
   pode ser longo sem estourar `title varchar(255)`.
   - `contract-create/components/contract-form.controller.ts` (submit).
2. **Limite + contador no campo Objeto** (pedido da P.O.):
   - `maxLength={5000}` no textarea (cap generoso; a coluna é `text`; impede ultrapassar, inclusive colar).
   - **contador** abaixo do campo (`N / 5000`, à direita, mono), vermelho ao atingir o limite.
   - `contract-form.component.tsx` + estilos `charCounter`/`charCounterMax` em `contract-create.css.ts`.

## Decisão

- Limite do objeto = **5000 caracteres** (produto; `text` comporta muito mais). Ajustável em
  `OBJETO_MAX_CHARS` no componente.
- Título derivado ≤120 chars — é um rótulo, não o objeto inteiro.

## Gates

`pnpm verify` (1591) + `pnpm test:dom` (579).

## Notas

- O backend (#530, `objective` = `text`) já está no `dev` e rodando no local (migrations aplicadas).
- Follow-up possível: mesma derivação de título no **aditivo** (amendment) se reproduzir o padrão.
