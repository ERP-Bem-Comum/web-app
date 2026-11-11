# 132 — CSV do Contas a Pagar com todas as colunas e o filtro inteiro

**Tamanho:** M · **Status:** entregue (em teste no QA) · **Data:** 2026-11-11
**Linear:** CAS-40 (sub-issues CAS-41 a CAS-44), em "Teste"
**Backend:** core-api#1111 (merge na dev em `a3624fc5`): `issuedFrom`/`issuedTo` em
`GET /financial/payable-titles` e `/payable-titles/counts`.
**Front:** web-app#446 (merge na develop em `ab225508`), depois do core-api.

**Em aberto com a P.O.** (registrado no CAS-40/CAS-44):

- Com linhas selecionadas, o CSV exporta só a seleção. Falta confirmar se é o comportamento esperado.
- Com Tipo = imposto, a lista de rascunhos fica vazia, mas o número do chip Rascunho conta todos (o
  `/counts` vai sem `type`). Comportamento anterior a esta spec.

## Pedido

Exportar no CSV todas as colunas do grid, respeitando os filtros e considerando todas as páginas.

## O que estava errado

| Card      | Problema                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------- |
| CAS-41    | O CSV tinha 7 colunas fixas; o grid tem 11. Faltavam Contrato, Forma de pagamento, Emissão e Bruto      |
| CAS-43    | O filtro de Emissão aparecia habilitado, mas não chegava ao servidor: grid, chips e CSV fora do período |
| CAS-43/44 | O chip Rascunho lia `/documents` paginado: o CSV saía só com a página visível                           |

## Comportamento

- **Colunas (CAS-41):** cabeçalho e células derivados do `COLUMNS` do grid, com os mesmos rótulos da tela.
  Uma coluna nova no grid entra no CSV sem outra mudança; o `switch` exaustivo cobra a célula no typecheck.
  A linha de total do Líquido continua no fim.
- **Colunas ocultas (CAS-42):** o CSV usa o `COLUMNS` inteiro. Esconder uma coluna muda só a tela
  (decisão da spec 129).
- **Emissão (CAS-43):** `issuedFrom`/`issuedTo` vão na listagem completa de títulos e na contagem dos
  chips. O schema da server fn passa a aceitar as chaves (antes o Zod as descartava em silêncio).
- **Rascunho (CAS-43/44):** nova server fn `listAllDocumentsFn`, que percorre todas as páginas do
  `/documents` no BFF, como a `listAllPayableTitlesFn` (specs/101). Os rascunhos recebem o filtro inteiro
  (vencimento, emissão, tipo e fornecedor; antes só fornecedor), para bater com o `draft` do `/counts`.

## Fora de escopo

- **Linhas selecionadas exportam só a seleção** (`exportRows`): não mudou. É uma pergunta em aberto para a
  P.O., registrada no CAS-44.
- Export gerado no backend: decisão em aberto no CAS-40.

## Ordem de deploy

Sem o core-api novo, o front é inofensivo: o core-api descarta os params desconhecidos e o filtro de
Emissão continua ignorado, como antes. Por isso o core-api entrou primeiro (cumprido em 11/11).

## Testes

- `contas-a-pagar-view-model.test.ts`: cabeçalho = `COLUMNS`; a linha traz as 4 colunas que faltavam;
  forma de pagamento ausente sai "—"; coluna oculta continua no CSV; total sob Fornecedor/Líquido.
- `payable-list-filters.test.ts` (adapter com `fetch` gravado): Emissão na lista paginada, na completa e no
  `/counts`; cada extremo sozinho; o schema preserva as chaves e recusa formato inválido; `listAllDocuments`
  percorre as 3 páginas com o filtro inteiro e devolve erro-valor se uma página falha.
