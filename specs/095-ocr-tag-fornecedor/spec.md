# 095 — Lançar Documento: tag "OCR" no Fornecedor auto-identificado

## Contexto

O processo de auto-identificar o fornecedor pelo OCR (CNPJ do emitente → parceiro) é do **backend**
(core-api#560): o rascunho vem com `supplierRef`, o front hidrata e o picker auto-seleciona. Faltava o
**sinal visual** de que o fornecedor foi lido/selecionado pela automação (os demais campos já acendem a
tag âmbar "OCR", o Fornecedor não).

## Escopo (front-only, decisão da P.O.: tag discreta)

- `OcrFieldKey` += `'supplier'`; `ocrReadFields` acende `'supplier'` quando, numa sessão de OCR, o
  `supplierRef` está preenchido (resolvido pelo backend #560 e hidratado) — mesma regra dos outros campos.
- `SupplierPicker` ganha prop `ocrRead`; renderiza a **tag âmbar "OCR" discreta** ao lado do rótulo
  "FORNECEDOR" (reusa o estilo `ocrTag` + i18n `preview.ocrBadge`), só quando há fornecedor selecionado.
- A page passa `ocrRead={ocrFields.has('supplier')}`.

## Dependência

A auto-seleção em si depende do **core-api#566** (hoje o leitor DANFSe trunca o CNPJ do emitente e escreve
"Fornecedor lido…" na descrição). Quando o #566 subir, o fornecedor auto-seleciona e a tag acende sozinha.
Antes disso, a tag também aparece se o operador escolher o fornecedor numa sessão de OCR (paridade com os
demais campos — a tag sinaliza o contexto OCR).

## Gates

`pnpm verify` (1611) + `pnpm test:dom` (590). Teste novo cobre `ocrReadFields` acendendo/não-acendendo
`'supplier'` (sessão OCR × fora × supplierRef vazio).
