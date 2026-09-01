# 113 — O front alcança o contrato da remessa (core-api de 01/09)

> Duas correções com a MESMA causa: em 01/09/2026 o core-api mergeou 6 PRs entre 13h e 16h, dois deles
> mudando o que a borda devolve. O front ficou para trás, e cada divergência apareceu na tela do
> operador — uma delas queimando NSA.

## Problema

| #                         | O que mudou no core-api                                            | O que o front fazia                                 | O que o operador via                                       |
| ------------------------- | ------------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------- |
| **#837** (PR #925, 13:10) | régua única pré-voo × emissor; `PayoutReadiness` ganha `no-issuer` | status desconhecido → fallback de drift → `blocked` | linha **vermelha sem motivo** num cadastro completo        |
| **#929** (14:21)          | a geração reparte por MODALIDADE; resposta vira `{ files: [...] }` | `safeParse` da forma antiga → `err('server')`       | **"Algo deu errado"** — depois de o título ser transmitido |

O segundo é o grave. O `safeParse` sem `.catch()` é deliberado (um comprovante não pode mentir sobre
pagamento enfileirado), mas a recusa acontecia **depois** de o backend ter alocado o NSA e transmitido o
título. Medido em produção-local: **NSA 5, 6 e 7 em 01/09, um por clique**, cada um irrecuperável.

## Correção

### `no-issuer` (#837)

`'no-issuer'` entra na união do domínio, no espelho do client e no `LINE_STATUSES` do mapper, com frase
própria: _"Esta forma de pagamento ainda não sai na remessa — o emissor CNAB não tem esse trilho"_.

Status PRÓPRIO e não `blocked` pela mesma razão do `transmitted` (#792): a ação do operador é outra.
`blocked` pede correção de cadastro; aqui **não há o que corrigir**.

⚠️ **Só PIX e guia caem aqui.** `ROUTES_WITH_ISSUER = ['transfer', 'billet']` — boleto e transferência
têm emissor e não regridem.

**A régua interina do front (`ROUTES_WITHOUT_EMITTER`) FICA**, e o motivo é sequenciamento: enquanto a
homologação não tiver o #925, removê-la faria o PIX voltar a aparecer apto, o operador geraria, e o
montador abortaria o arquivo inteiro. Gatilho de remoção escrito no código: _o pré-voo da homologação
devolver `no-issuer` para um PIX_.

### Contrato do lote (#929)

`GeneratedRemittance` passa a ser o **LOTE** (`{ files: [...] }`); `GeneratedRemittanceFile` é cada
arquivo. Manter o nome do tipo poupou 4 arquivos da cadeia (fn, use-case, repositório, cliente).

O comprovante lista **todos** os arquivos — NSA, nome e total por arquivo, com **download próprio para
cada um**. Pegar só o primeiro seria pior que o erro: descreveria metade do que foi enfileirado, e o
operador confirmaria acreditando ter conferido. O total sai por arquivo, nunca somado: é por arquivo
que o banco processa e que o extrato será conferido.

## Testes (7)

- `remittance-preview-mapper.test.ts` — `no-issuer` não cai no fallback; **teste de governança** que
  percorre a união inteira do domínio e reprova qualquer status novo que caia em drift (o esquecimento
  já custou duas telas ilegíveis: `transmitted` e `no-issuer`);
- `generatedToModel` — **não tinha teste algum**, e era a única função do caminho do dinheiro sem rede.
  Cinco casos: lote aceito, **seleção mista preserva todos**, forma antiga recusada, lista vazia
  recusada, `nsa` ausente falha alto.

## Validado

Boleto gerado no local após o core-api#928 (J-52) e **aceito pelo Validador do Bradesco** — confirmado
pela P.O. em 01/09. Gate: `pnpm verify` 1877 (+7) · `pnpm test:dom` 725 · lint 0 erros.

## Fora de escopo

Remover a régua interina do front (ver gatilho acima) e o alerta por título na tela do CNAB.
