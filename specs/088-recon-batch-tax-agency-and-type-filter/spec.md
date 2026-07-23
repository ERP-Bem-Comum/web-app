# 088 — Conciliação "Buscar vários": órgão no imposto + filtro de Tipo por retentionType

> Escala **M**. Dois bugs correlatos na aba **Buscar / Criar vários** da Conciliação, ambos com a mesma raiz:
> o front não usava o `retentionType` (enriquecido pelo BFF) para os títulos de imposto retido.

## Bug 1 — nome do título de imposto = fornecedor (não o órgão)

O `search-create-pane` mostrava `supplierName` para TODO título — inclusive impostos retidos (filhos), cujo
favorecido é o **ÓRGÃO** (ISS→SEFIN, federais→Receita Federal), não o fornecedor do documento-pai.

**Fix:** aplica o `retentionAgencyTag` (o mesmo helper do fix #192) na linha — imposto retido → tag do órgão;
não-imposto → segue o fornecedor. O `retentionType` já chega enriquecido pelo BFF (mapa de `/payable-titles`,
`enrichPaidPayable`); só faltava a View usá-lo.

## Bug 2 — filtro de Tipo não achava imposto (+ botão não ficava azul)

`filterPayables` casava o Tipo por `p.documentType`, que vem **null** (core-api#172) e, para imposto, o tipo vive
em `retentionType`. Então filtrar por INSS/ISS/IRRF/CSRF nunca achava nada. E o botão **TIPO** não tinha estado
ativo (Período/Valor ficam teal com a bolinha; o Tipo não).

**Fix:**

- `filterPayables`: imposto retido (IRRF/ISS/INSS/CSRF) casa por **`retentionType`**; tipos de documento
  (NFS-e/DANFE/…) seguem casando por `documentType` (null → não casa até core-api#172).
- Estado ativo do filtro de Tipo (`typeActive` = `documentType !== 'all'`) → chip **teal + bolinha** (token
  `pmMiniSelWrapOn` + `fltDot`), paridade com Período/Valor.

## Fora de escopo (backend)

- **Campos desabilitados na Nova Transação** (Número/Tipo/Emissão/Valor do documento + classificação Tarifa/Multa/
  Juros): o `manualEntryBodySchema` do core-api não os aceita → **core-api#370** (já aberto). Nada no front.
- **Filtro por tipo de DOCUMENTO** (NFS-e/DANFE): `documentType` vem null → só liga com **core-api#172** (o de
  imposto funciona porque usa `retentionType`, que o BFF já enriquece).

## Verificação

`pnpm typecheck` + `pnpm verify` (1581) + `pnpm test:dom` (578) verdes; lint 0 erros. Cobertura nova:
`filterPayables` casa imposto por `retentionType` (inclui o caso INSS do usuário) e documento por `documentType`;
`search-create-pane.spec` — imposto mostra o órgão. Validado em tela (Buscar vários → filtrar INSS lista os
impostos; botão Tipo fica azul).
