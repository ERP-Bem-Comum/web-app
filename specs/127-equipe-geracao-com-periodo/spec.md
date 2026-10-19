# 127 — Filtro de Geração com o período de nascimento

**Tamanho:** S · **Status:** front implementado · **Data:** 2026-10-19
**Backend:** nenhuma mudança · **Relacionada:** spec 123 (filtro de Geração)

## Pedido (P.O., 19/10)

No relatório **Equipe Bem Comum**, cada opção do filtro Geração mostra o período que ela abrange, ao lado
do nome — para quem filtra saber quem entra em cada uma.

## Períodos

Os anos são os recortes que o core-api usa para classificar cada pessoa (convenção Pew,
`partners/public-api/generation.ts`, `generationIdOf`). O front não calcula geração: só mostra os anos.

| Código       | Opção no filtro                         |
| ------------ | --------------------------------------- |
| `BOOMER`     | Baby Boomer (1946–1964)                 |
| `GEN_X`      | Geração X (1965–1980)                   |
| `MILLENNIAL` | Millennial / Geração Y (1981–1996)      |
| `GEN_Z`      | Geração Z (1997–2012)                   |
| `OUTROS`     | Outras gerações (até 1945 ou após 2012) |
| `NA`         | N/A (sem data de nascimento)            |

"Millennial (Geração Y)" vira "Millennial / Geração Y" só no filtro, para não ficar com dois parênteses.

⚠️ Os anos ficam duplicados no catálogo i18n do front. Se o core-api mudar um recorte, o catálogo
(`reports.equipe.filters.generationOption.*`) muda junto — o comentário no catálogo aponta a fonte.

## Escopo

Só o **select** do filtro. Gráfico, resumo dos filtros aplicados e CSV seguem com o nome curto.

## Testes

`equipe.page.spec.tsx`: as opções do filtro com o período; o resumo continua com o nome curto
("Geração: N/A").
