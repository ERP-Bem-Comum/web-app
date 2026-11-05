# 130 — Identidade de Gênero: opção "Queer" e rótulo "Mulher transgênero / Travesti"

**Tamanho:** S · **Status:** em implementação · **Data:** 2026-10-23
**Backend:** core-api — novo valor `QUEER` no enum (sem migration: a coluna é `varchar(30)`)

## Pedido (P.O., 23/10, lista do cliente)

1. Mulher cisgênero
2. Homem cisgênero
3. **Mulher transgênero / Travesti** ← rótulo renomeado
4. Homem transgênero
5. Pessoa não binária
6. **Queer** ← novo, antes de "Outro"
7. Outro (texto livre — já existe, spec 122 / core-api#1054)
8. Prefiro não responder

Os demais rótulos ficam como estão. Segundo a P.O., a diferença para a lista do cliente é mínima.

## Decisões

- **TRAVESTI continua fora do seletor.** Não há dado gravado com esse valor: o legado não tinha a opção, e o
  migrado veio de lá (P.O., 12/10 e 23/10). O rótulo "Mulher transgênero / Travesti" é de `MULHER_TRANS`.
- `QUEER` é valor novo do enum (não é rótulo de outro), para o relatório contar separado.

## Escopo

| #   | Repo     | Entrega                                                                                      |
| --- | -------- | -------------------------------------------------------------------------------------------- |
| 1   | core-api | `QUEER` no domínio (`gender-identity.ts`), na validação da API e na lista-base da demografia |
| 2   | web-app  | `QUEER` em `GENDER_IDENTITIES` e em `GENDER_IDENTITY_OPTIONS` (antes de `OUTRO`)             |
| 3   | web-app  | Rótulos i18n: `QUEER` = "Queer"; `MULHER_TRANS` = "Mulher transgênero / Travesti"            |
| 4   | web-app  | Cor de `QUEER` na rosca de gênero do relatório Equipe                                        |

Alcance: os seletores do Cadastro completo e do Autocadastro, o detalhe, e o relatório Equipe (rosca, filtro,
coluna e CSV) leem a mesma lista e os mesmos rótulos, então acompanham sem mudança própria.

## Testes

Opções do seletor na ordem do cliente (puro); domínio do core-api aceita `QUEER`; template da demografia
com `QUEER` zerado.
