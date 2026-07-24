# 094 — Conciliação: importar PDF + rótulos OFX/CSV/PDF + excluir extrato

Leva de melhorias no import/gestão de extrato da Conciliação, destravadas pelo core-api (`dev`).

## 1. Rótulos do menu Importar (P.O.)

`OFX — extrato bancário`/`CSV — planilha de lançamentos`/`PDF — leitura por OCR` → **OFX/CSV/PDF** (sem descritivo).

## 2. Importar extrato em PDF (core-api#557)

- PDF vira formato real no menu (`accept .pdf`; sai o "Em breve").
- O PDF é lido em **BASE64** (`fileToBase64`, o mesmo helper do OCR do Lançar Documento) — o backend decodifica
  → `unpdf` extrai texto → parseia (gabarito Bradesco). OFX/CSV seguem por `file.text()`. Checagem de conta = só OFX.
- `StatementFormat` + io-schema (+ `content .max 5MB`) ganham `'PDF'`.
- **Backend correlato:** core-api#559 (CHECK `fin_bank_statements.file_format` incluir 'PDF') — **FECHADO** (migration 0041).

## 3. Excluir extrato importado (core-api#558)

- Botão **"Excluir extrato"** na bottombar (footer), habilitado só com extrato importado (`ui.statementId`).
- **Modal de confirmação** que NOMEIA o extrato (conta + período), não as transações:
  "Deseja excluir o extrato de {apelido · banco · Ag · CC} do período {DD/MM/AAAA – DD/MM/AAAA}?" + "Esta ação não
  pode ser desfeita." (fallback quando conta/período não resolvidos).
- Guardas 409 exibidas no modal: transação conciliada ("desfaça antes") · período fechado ("reabra antes").
- Pós-sucesso: `clear-statement` (zera statementId + limpa localStorage) + invalida `['financial','reconciliation']`.
- Cadeia: server-fn `delete-bank-statement` → adapter `DELETE /bank-statements/:id` (204) → repo → `useDeleteStatement`.

## Gates

`pnpm verify` (1608) + `pnpm test:dom` (590). Testes: import-menu (PDF habilitado), delete (error-tag, reducer,
mapper, modal com pergunta composta + fallback).

## Notas

Import de PDF é **gabarito Bradesco** (#557); outros bancos podem não ler ainda. Em prod, PDF depende do deploy
do core-api `dev` (parser #557 + CHECK #559).
