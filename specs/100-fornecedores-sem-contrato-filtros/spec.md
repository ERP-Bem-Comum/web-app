# 100 — Fornecedores sem Contrato: filtros reais + Plano Orçamentário na árvore

**Tamanho:** M · **Status:** implementado · **Data:** 2026-08-11
**Backend:** core-api#694 (entregue 11/08) · **Semântica:** core-api#437 (fechada 10/08)

## Problema

Dos 7 filtros da tela, **só o Limite funcionava**. Os outros 6 (Programa, Plano Orçamentário, Período,
Centro de Custo, Categoria, Subcategoria) eram placeholder por construção: selects sem fonte de dados,
um campo de data solto e um botão "Filtrar" **sem `onClick`**.

Não era descuido de front: o endpoint não declarava `querystring` (o handler ignorava o request) e a
resposta trazia 4 campos — `supplierRef`, `name`, `totalCents`, `payableCount`. Não havia o que recortar
nem no servidor nem no cliente.

E a árvore Fornecedor → Plano Orçamentário tinha o 2º nível **falso**: como o total vinha agregado só por
fornecedor, o front escrevia `budgetPlan: '—'` em código.

## Escopo

| #   | Entrega                                                                                         |
| --- | ----------------------------------------------------------------------------------------------- |
| 1   | Os 6 filtros aplicam no SERVIDOR (querystring do #694), commitados no "Filtrar"                 |
| 2   | A árvore mostra o Plano Orçamentário REAL; sem plano → "Sem plano"                              |
| 3   | Centro/Categoria/Subcategoria listam **só a taxonomia do plano** — nunca o catálogo operacional |
| 4   | Período vira De/Até (dois campos), como nos demais relatórios                                   |

**Fora de escopo:** filtro de Conta bancária (o endpoint não aceita esse recorte, diferente da Posição e
do Fluxo — não se oferece dropdown que o servidor ignora).

## Critérios de aceite

- [x] 1ª carga vai **sem recorte** — a tela abre mostrando tudo (filtro é recorte, não pré-requisito)
- [x] Mudar um campo não re-busca; "Filtrar" commita e vai ao servidor
- [x] Sem plano escolhido, Centro/Categoria/Subcategoria têm exatamente `['Todos']`
- [x] Com plano escolhido, os três listam a taxonomia daquele plano (ADR-0051)
- [x] O Limite segue client-side, aplicando ao digitar
- [x] O mesmo fornecedor em 2 planos vira 2 linhas na árvore, mas o Limite soma o FORNECEDOR

## Decisões

**Schema de borda EXIGE `budgetPlanRef`/`budgetPlanName`** (nullable, não opcional). Aceitar o campo
ausente faria a tela mostrar "Sem plano" em tudo, em silêncio, se o backend regredisse — a mesma classe de
bug que segurou a demografia do Equipe por semanas. Preferimos quebrar alto.

**Cascata sem plano fica vazia, não cai no operacional.** Os hooks do financial têm
`if (!isPlanId(planoRef)) return operational`, e o catálogo operacional flat NÃO é a taxonomia: oferece
centros e categorias que não existem em plano nenhum. Corrigido no binding DESTE relatório, não no hook
compartilhado (que também serve o Lançar Documento).

## Dívida registrada

O mesmo fallback operacional existe na **Posição de Pagamentos**, no **Fluxo de Caixa** e no **Relatório
Geral**. Não tocados aqui (um relatório por vez) — vale rever quando cada um chegar na fila.
