# 099 — Descrição do serviço nos gabaritos de PDF: cobertura de teste

**Tamanho:** S (só testes; nenhuma mudança de comportamento)
**Origem:** pedido da P.O. em 2026-08-09
**Branch:** `test/gabaritos-descricao-cobertura`

## O pedido

Validar que a **Descrição do Serviço** lida do PDF é replicada no campo Descrição da tela Lançar Documento.

## A cadeia (única para todos os gabaritos)

```
gabarito extrai o campo `descricao`
  → read-pdf-lines.ts:29 `descriptionOf` (colapsa quebras, corta em 500 = teto do backend)
  → document-reading.view.ts:64 `patch.description`
  → campo Descrição do form
```

| gabarito                              | tipo    | extrai `descricao`?                                        |
| ------------------------------------- | ------- | ---------------------------------------------------------- |
| DANFSe v1 (nacional / "modelo geral") | serviço | ✅                                                         |
| DANFSe v2 (Fortaleza)                 | serviço | ✅                                                         |
| DANFE                                 | produto | ❌ — correto: nota de produto não tem descrição de serviço |
| FILU-SP (São Paulo)                   | serviço | ❌ — fora de escopo (ver abaixo)                           |

No caminho **XML** não há lacuna: os quatro leitores extraem descrição (`Discriminacao` em SP e ABRASF,
`xDescServ` no nacional, lista de itens no de produto).

## Validação

**Validado pela P.O. em ambiente PBE (2026-08-09)** com DANFE, nota de serviço modelo geral e modelo de
Fortaleza — todos leram o campo corretamente, coerente com o que os testes fixam.

## O que este PR entrega

**Só testes.** 11 casos novos (1721 → 1732). Até aqui **só a DANFSe v1 era exercida** — não havia nenhum
caso para FILU-SP, DANFSe v2 ou DANFE.

- **DANFSe v2 (4):** identificação, valor, retenções, **descrição lida e colapsada**, ISSQN "Não Retido"
  → `iss` zero (o apurado é o que o prestador deve, não o que foi retido de nós), IBS/CBS ausentes → zero.
- **FILU-SP (4):** identificação, valores **sem "R$"** (regex posicional), ISS zerado por `posProcessar`,
  ausência de CNPJ do emitente, e a descrição.
- **DANFE (3):** roteamento produto × serviço, bloco de impostos próprio, ausência de descrição de serviço.

Fixtures **sintéticas**, montadas a partir das âncoras declaradas em cada gabarito — mesma convenção do
teste que já existia. Não são PDFs reais.

## São Paulo fica para a próxima leva

O FILU-SP não extrai a descrição, e isso **não será tratado agora**: decisão da P.O. em 09/08/2026 — novos
modelos de gabarito entram em breve e o de São Paulo será revisto nessa leva.

O teste correspondente é de **caracterização**: afirma `description === null` para fixar o estado atual e
falhar de propósito quando o campo for adicionado, para que a mudança seja notada em vez de descoberta por
acaso.

## Aceite

- [x] Os 4 gabaritos têm teste (antes: só um).
- [x] DANFSe v1 e v2 leem e replicam a descrição — por teste e validado em tela (PBE).
- [x] Estado do FILU-SP fixado por teste, para a leva de novos gabaritos.
