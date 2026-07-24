# 093 — Conciliação: campos de documento na Nova Transação (#370) + categoria no detalhe (#554/#555)

## Contexto

O core-api (`dev`, PRs #552/#554/#555) destravou dois handoffs da Conciliação:

- **#552 (#370):** `manualEntryBodySchema` passou a aceitar `documentNumber`/`documentType`/`issueDate`/
  `documentValueCents` (opcionais; `documentValueCents` omitido → backend usa o valor da transação).
- **#554/#555:** a resposta de detalhe da conciliação passou a retornar `category`.

## Frente (a) — campos de documento na "Nova Transação" (#370/#552)

Os 4 campos (Número/Tipo/Emissão/Valor) eram **chrome** (desabilitados) no `new-transaction-pane`. Agora são
REAIS, ligados ao form state e enviados no template do lançamento manual — **só no bloco Pagamento/Recebimento**
(`showPayeeBlock`). `documentValueCents` só vai quando o usuário digita valor válido (senão o backend usa o da
transação). Data via `<input type="date">` (YYYY-MM-DD nativo). **Tarifa/Multa/Juros (`feeKind`) segue chrome**
— o core-api#371 ainda não subiu.

## Frente (b) — categoria no detalhe (#554/#555)

O detalhe da conciliação passou a exibir a **categoria** real (reusa a linha "Categoria" do modal). É
nível-conciliação → acende no lançamento manual (fatia 1) e no match 1:1 (fatia 2). N:1 mantém o layout por-linha.

## Cadeia (MVVM + BFF, aditivo)

- io-schema `reconciliation.io-schemas.ts` + domínio `reconciliation.io.ts`: +4 campos no `ManualEntryTemplate`
  (+ `DocumentType`), +`category` em `TransactionReconciliation` (guards `AssertEqual` verdes).
- adapter core-api `reconciliation.schema.ts`/`.mappers.ts`: `category` tolerante (`.nullable().catch(null)`) + propagação.
  (`core-api-reconciliation.ts` não mudou — já espalha `...template` e `...base`.)
- client `reconciliation.model.ts`; `manual-entry.binding.ts` (state/setters/opções + montagem no submit);
  `new-transaction-pane.component.tsx` (RealInput/RealSelect); `reconciliation-workspace.view-model.ts` +
  `match-details.binding.ts` (plumb da categoria no detalhe).

## Gates

`pnpm verify` (1604) + `pnpm test:dom` (583). Testes: componente (4 campos reais), view-model (categoria no
detalhe), mappers (parse de `category`).

## Ajustes de validação (P.O.)

- **Valor do documento com máscara BRL** (`maskMoneyBRL`, o mesmo do Lançar Documento) — as-you-type "133.830,10"; submit → `documentValueCents` via `parseBRLToCents`; vazio → omitido.
- **Fornecedor só o NOME na Conciliação** (sem "· CPF/CNPJ") — label montado localmente no `manual-entry.binding.ts`; o dropdown compartilhado do Lançar Documento/Contrato (#190) fica intocado.
- **Tarifa/Juros: removido o campo CLASSIFICAÇÃO** (`feeKind`, chrome) **e adicionado Programa** — alinha a taxonomia. O #371 fica **descartado do front**.

## Handoff backend

- **core-api#556** — o detalhe da conciliação NÃO retorna os campos de documento (só `category`). Enquanto não voltar, o **Número do documento não aparece no modal de detalhe** (a escrita do #370 funciona; falta a leitura).
- Categoria vazia no detalhe: plumbing do front verificado OK ponta a ponta → provável `category=null` do backend p/ aquela conciliação.

## Fora de escopo

- **core-api#371** (`feePenaltyKind`): descartado do front (campo CLASSIFICAÇÃO removido a pedido da P.O.).
