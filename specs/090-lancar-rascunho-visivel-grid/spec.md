# 090 — Rascunho do Lançar Documento visível no grid de Contas a Pagar

## Problema (regressão)

Rascunho (Draft) do Lançar Documento **salva** no core-api (status `Draft`), mas **some do grid**
de Contas a Pagar. Causa: o grid é **title-centric** (#201, lê `/payable-titles`) e rascunho
**não gera títulos-filho** (core-api `domain/document/document.ts:581`). A listagem por documento —
a única que traria Draft — foi **desligada** pelo #201. O chip "Rascunho" ficava morto e o operador
concluía "não salvou".

## Escopo (front-only)

Exibir os documentos `Draft` no grid title-centric, via o chip **Rascunho**:

- **Chip Rascunho**: o grid troca a fonte e mostra os rascunhos (paginados pelo `/documents?status=Draft`).
- **Todos / demais chips**: grid de título intacto, **sem** rascunhos.
- **Clicar** um rascunho → reabre o Lançar Documento (`?id=`) para finalizar (já existia, page:128).

> **Nota (correção pós-validação):** a 1ª tentativa colocava rascunho também no "Todos"; com dado real
> (78 rascunhos, muitos parciais do OCR ingest) isso **soterrava** os 62 títulos reais. Rascunho ficou
> FORA do Todos — só no chip Rascunho, como os demais status. Acha-se o inacabado pelo chip.

## Fora de escopo

- **Botão "Salvar rascunho" sempre ativo**: NÃO é front-only. O `createDocumentBodySchema` do core-api
  exige `type/documentNumber/supplierRef/paymentMethod/grossValueCents` **mesmo com `asDraft:true`**
  (o domínio `saveDraft` aceita opcional, mas a validação HTTP rejeita antes → 400). Requer afrouxar
  o schema no core-api → **issue aberta** (handoff). Só então o front solta o `canSaveDraft`.

## Implementação

- `contas-a-pagar.view-model.ts`: função PURA `mergeDraftsIntoGrid(drafts, titles, mode)` +
  tipo `DraftMergeMode`. Reusa `deriveListState` (documento→GridRow) já existente.
- `contas-a-pagar.binding.ts`: query de rascunhos (`status: 'Rascunho'`, mapeada p/ `Draft` na saída),
  `draftMode` derivado do chip/página, e `titleState = mergeDraftsIntoGrid(draftState, titleStateRaw, mode)`.
- Invalidação pós-save já cobre (`['financial','documents','list']` casa a query de rascunhos).

## Gates

`pnpm verify` (1592 pass) + `pnpm test:dom` (579 pass). Novo teste puro
`tests/.../merge-drafts-view-model.test.ts` cobre os 3 modos + bordas (vazio/erro).

## Handoff backend

core-api: afrouxar `createDocumentBodySchema` para `asDraft:true` (campos mínimos opcionais) → habilita
o botão "Salvar rascunho" sempre ativo. (Issue linkada no PR.)
