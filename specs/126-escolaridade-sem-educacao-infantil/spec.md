# 126 — Escolaridade sem "Educação Infantil"

**Tamanho:** S · **Status:** front implementado · **Data:** 2026-10-19
**Backend:** nenhuma mudança (o enum do core-api segue aceitando `EDUCACAO_INFANTIL`)

## Pedido (P.O., 19/10)

Remover a opção "Educação Infantil" do campo Escolaridade.

## Decisão de desenho

Sai do **seletor**, não do enum — mesmo padrão do TRAVESTI na spec 122:

| Lista                     | Papel                                                           | Educação Infantil |
| ------------------------- | --------------------------------------------------------------- | ----------------- |
| `EDUCATION_LEVELS`        | espelha o enum do core-api; lista canônica do gráfico do Equipe | **fica**          |
| `EDUCATION_LEVEL_OPTIONS` | opções dos seletores (detalhe e autocadastro)                   | **sai**           |

Tirar do `EDUCATION_LEVELS` faria o gráfico de Escolaridade do Equipe **descartar** quem já tem o valor
gravado (`countByOrder` ignora o que está fora da lista canônica).

**Valor já gravado:** no detalhe, quem tem "Educação Infantil" continua vendo o valor selecionado
(`selectableWithCurrent`); sem isso o `<select>` mostraria "Selecione..." e o dado pareceria faltando.

## Escopo

| #   | Entrega                                                                            |
| --- | ---------------------------------------------------------------------------------- |
| 1   | `EDUCATION_LEVEL_OPTIONS` + `selectableWithCurrent` no model                       |
| 2   | Detalhe do colaborador: seletor sem a opção; valor gravado escondido segue visível |
| 3   | Autocadastro: seletor sem a opção                                                  |

## Testes

`selectable-with-current.test.ts` (puro), `collaborator-education-options.spec.tsx` (detalhe: sem a opção;
gravado continua selecionado) e `autocadastro-views.spec.tsx` (autocadastro sem a opção).
