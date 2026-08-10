# Plan 046 — Relatório "Equipe ABC"

Front-first, MVVM (ADR-0009/0012, §XI). Reaproveita o padrão e a identidade dos gráficos do relatório
"Realizado × Planejado" (feature 045) no MESMO módulo `reports`.

## Arquitetura (camadas)

```
data/equipe.placeholder.ts        → TeamMemberRow[] SINTÉTICO (LGPD; só campos de exibição)
equipe.view-model.ts (PURO)       → 5 agregações + buildCsv + formatSharePercent (zero React)
components/                        → views burras (gráficos + tabela) + *.css.ts (só-tokens)
page/equipe.page.tsx              → compõe as views; UI-state local = filtros abertos + hover (nos gráficos)
public-api/index.ts               → exporta EquipePage + a ViewModel pura
routes/.../relatorios/equipe.tsx  → createFileRoute → EquipePage
```

## Decisões

1. **Reuso vs componente novo dos gráficos.** Os componentes do 045 (`RealizadoDonut`,
   `RealizadoCostCenterBars`, `RealizadoLineChart`) são acoplados a DINHEIRO (`valueCents`, formatadores BRL)
   e a semânticas fixas (MeasureKey, concentração). Em vez de mutá-los (risco de regressão no relatório já
   merged), criei **componentes irmãos orientados a CONTAGEM** que reaproveitam as MESMAS classes CSS de
   `realizado-charts.css.ts` (tooltip/hover/hbar/linha/legenda/empty) via re-export em `equipe-charts.css.ts`
   — identidade visual idêntica, zero duplicação de estilo, RxP intacto.
   - `equipe-genero-donut` (donut por contagem) — reusa o look do `realizado-donut`.
   - `equipe-vertical-bars` (**NOVO**) — barras verticais por Raça/Cor, cor por categoria.
   - `equipe-horizontal-bars` (contagem) — reusa o look das barras "Por centro de custo".
   - `equipe-line-chart` (contagem, N pontos genéricos) — reusa o look do `realizado-line-chart`.
   - `equipe-table` — lista "brand" enxuta (8 colunas), thead sticky, rolável.
   - **Reuso direto:** `RealizadoChartsMount` (wrapper de animação genérico).

2. **Idade.** Guardada como `number | null` no placeholder (null = "N/A") — evita date-math. O bucketing
   (5 faixas + N/A) vive na ViewModel (`byFaixaEtaria`).

3. **Cores dos gráficos.** Novas em `brand.color.equipe.*` (hex cru só no `*.values.ts`), aplicadas por
   `styleVariants` indexados por categoria — as views não importam tokens (boundary client-ui ↛ ds-tokens).

4. **Export.** CSV único (botão, não dropdown) via Blob — reaproveita o helper `downloadCsv` (mesmo padrão
   do 045). Sem PDF.

5. **Plumbing.** `fullBleedContent`/`showPageHeader` já cobrem `/relatorios/*` (só adicionei o `PAGE_TITLES`).
   Menu: subitem "Equipe ABC" sem `requiredPermission`. Testes do root VM atualizados (título + menu).

## Refino (4 melhorias P.O.)

6. **Gráficos em 2 linhas (3 topo + 2 base).** Nova grade `charts3` (3 colunas iguais) ao lado de `charts2`
   em `equipe.page.css.ts`, mesmo breakpoint responsivo (colapsa a 1 coluna a 60rem). Topo = Gênero + Idade +
   Raça/Cor; base = Ano + Função (os 2 mais largos). `chartFull` deixou de ser usado. Só-tokens preservado.

7. **Paginação da tabela.** `BrandPaginator` compartilhado (`#shared/ui/brand`) abaixo da tabela. O UI-state
   (`page`/`perPage`, default 10) mora na page (`useState`); a fatia é derivação PURA da ViewModel
   (`totalPages`/`pageSlice`, clamp defensivo, sem `throw`). A tabela recebe `rows` já fatiadas + `totalCount`
   (o contador do cabeçalho não muda ao paginar). Trocar perPage reseta a página para 1.

8. **Linha clicável → modal de detalhe.** A linha da tabela virou `<button>` (`rowClickable`) — foco/Enter/
   Espaço nativos, `aria-label` "Ver detalhes de {nome}". Novo `equipe-detail-modal.component.tsx` (view
   burra, padrão do `PaymentDateModal`: overlay `role="dialog"` + `aria-modal`, fecha por Esc/overlay/
   "Fechar"). Mostra só os **9 campos enxutos** em lista rótulo/valor — LGPD preservado (nenhum campo
   sensível existe no tipo). `member` selecionado = `useState` na page. CSS do modal em `equipe.page.css.ts`
   (só-tokens brand + `vars.color.institutional.overlay`).

9. **"Editar" → módulo Colaboradores.** Botão "Editar" do modal navega (`useNavigate`) ao índice
   `/parceiros/colaboradores` (edição no módulo próprio, não inline). Front-first: sem id real de parceiro nos
   dados sintéticos; comentário no código marca o deep-link `/parceiros/colaboradores/$id` para o dado real.
   Navegação na view (router na view é permitido); a ViewModel pura continua sem React/router.

## Testes

- `tests/modules/reports/client/equipe.view-model.test.ts` (node:test): as 5 agregações (contagens por
  categoria, bucketing de idade incl. N/A, contagem por ano incl. ano-fora-do-range ignorado, função DESC),
  o CSV (cabeçalho + 1ª linha + idade null → "N/A" + NÃO vaza PII), tamanho do placeholder (36) e a garantia
  LGPD (só as 9 chaves de exibição no tipo).
- `tests/modules/shell/client/root/root.view-model.test.ts`: título `/relatorios/equipe` = "Equipe ABC" +
  o accordion agora com 3 subitens (Equipe ABC sem RBAC).
- `tests/modules/reports/client/equipe.view-model.test.ts` (node:test, refino): `totalPages`/`pageSlice`
  (ceil, mínimo 1, fatia 1-based, clamp defensivo, `PER_PAGE_DEFAULT=10`).
- `tests/modules/reports/client/equipe.page.spec.tsx` (Vitest/jsdom, refino): paginator presente
  (Página 1 de 4); 1ª página mostra 10 linhas; "Próxima" reslice; troca de perPage volta à 1ª página;
  clique na linha abre o modal com os 9 campos; modal sem PII (LGPD); "Fechar" fecha; "Editar" chama
  `useNavigate` (mockado) com `/parceiros/colaboradores`.

## Gates (política de regressão zero)

typecheck · build · lint (0 erros) · test (node:test) · test:dom — todos verdes antes de fechar.
