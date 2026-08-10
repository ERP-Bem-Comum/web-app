# 087 — Filtros Estado/Município do relatório vêm da Rede dos planos do Programa

> Escala **M**. Ajuste da specs/084 (filtros do Realizado × Planejado) — a P.O. validou contra o LEGADO: os
> filtros Estado/Município devem seguir o que está **cadastrado nos planos** (a "Rede"), não a geografia de
> parceiros.

## Análise do legado

Print do legado: com **Programa = EPV** selecionado (Plano vazio), **Estado = CE** e **Município = Fortaleza**
aparecem e cascateiam. Ou seja: Estado/Município **seguem o PROGRAMA** (a Rede territorial dos planos dele),
independem de escolher um Plano; rótulos = UF (sigla) no Estado e nome no Município.

## Antes (specs/084)

Estado vinha de `listPartnerStatesFn` (geografia de **parceiros**) e Município de `listMunicipalitiesByUfFn` —
fonte errada. O display (uf/nome, cascata) já batia; só a FONTE estava fora.

## Decisão

Estado/Município derivados da **Rede dos planos aprovados do Programa selecionado** (`PlanDetail.networks`):

- A Rede mora no DETALHE do plano; a lista só traz `programAbbreviation` + `children` (versões) e **não** o UUID
  do programa. Então: resolve a **sigla** do programa selecionado (do `useProgramaOptions`), filtra os planos
  APROVADOS por `programAbbreviation`, busca o detalhe de cada um (`getBudgetPlanDetailFn`) e **agrega** os
  `networks`. Fan-out de N detalhes (poucos planos/programa), cacheado.
- **Estado** = `uf` únicos da Rede → value/label = uf (sigla). **Município** = `kind:'municipality'` agrupados por
  `uf` (`municipiosByUf`) → value = `ref` (ibge), label = nome; a page cascateia pelo Estado escolhido.
- Sem Programa → Estado/Município vazios. Trocar o Programa **zera** Estado/Município (a Rede muda).
- Programa de granularidade **estadual** → sem municípios (Município fica vazio), igual ao legado.

Os IDs enviados ao endpoint não mudam (uf/ibge). A ordem dos filtros também não.

## Verificação

`pnpm typecheck` + `pnpm verify` (1580) + `pnpm test:dom` (578) verdes; lint 0 erros. Validado em tela (local
ERP-INFRA): Programa **ABC** → Estado lista **CE, RN** da Rede dos planos aprovados (não mais parceiros); Município
vazio (planos aprovados do ABC são estaduais). No local só ABC/EFD têm planos aprovados com Rede (ambos estaduais);
a Rede de município está em plano não-aprovado (fora do escopo — filtro por aprovados, como o dropdown de Plano).

## Follow-up

Município `disabled` — affordance visual (cosmético, herdado da specs/084).
