# Plan — Dashboard "Resumo Mensal" — 043

## Abordagem

Trabalho 100% na camada `client/` do módulo `financial`, subpasta `dashboard/`. Reusa a
feature 042 (widget "Últimos pagamentos") como a tabela da linha 3. Sem backend novo.

Gráficos em **SVG nativo** (§VIII — sem dep nova), componentes de apresentação BURROS (§XI)
que recebem tudo por props e são parametrizáveis para receber dados reais depois.

## Componentes a criar (`components/`)

- `MetricCard` (`.component.tsx` + `.css.ts`) — rótulo, valor, tendência, ícone circular
  colorido. Reusável pelos 4. Cor do círculo por prop (tokens de cor).
- `LineChart` (`.component.tsx` + `.css.ts`) — SVG nativo, 2 séries, eixos Jan..Dez / R$0..R$18k,
  gridlines pontilhadas. Recebe `series` (pontos) por props.
- `DonutChart` (`.component.tsx` + `.css.ts`) — SVG nativo, fatias por props; fatias vazias →
  mensagem de estado vazio.
- `SuppliersWithoutContractCard` (`.component.tsx` + `.css.ts`) — título + botão "Ver todas"
  (largura total), placeholder.

## View-model / placeholder (núcleo puro, sem React — ADR-0009)

- `dashboard-summary.view-model.ts` — constantes/derivação PURA dos dados placeholder:
  as 4 métricas (rótulo/valor/tendência/legenda/cor do ícone), as 2 séries do gráfico de linha
  (pontos placeholder: pico Fev-Mar → zero), as fatias do donut (vazio).
  Tipos como uniões/`Readonly` (§IV/§VII). Sem import de framework.

## Página

- `page/dashboard.page.tsx` — reescreve o layout: título "Dashboard - Resumo Mensal" (remove
  "Início"), grid em 3 linhas (linha1 4 cols · linha2 2 cols 2fr/1fr · linha3 full). Continua
  chamando `useRecentPayments()` para o widget real. Consome o view-model puro p/ o placeholder.
- `page/dashboard.css.ts` — grid responsivo só-tokens.

## Widget 042 (ajuste mínimo, sem regressão)

- Renomear os HEADERS para o legado: Nome · Vencimento · Conta · Valor. Trocar só as tags i18n
  usadas nos `<th>` (novas chaves `dashboard.recent-payments.col.*` legadas) — NÃO mexer no
  binding/view-model/query nem na resolução de nomes. Dados reais mantidos.

## i18n (`catalog.pt-BR.ts`)

Adicionar chaves `dashboard.*`: título da tela, rótulos/legendas/tendência dos 4 cards,
títulos "Visão geral"/"Previsto x Realizado"/"Ver tudo", "Pagamentos por Centro de Custo em %"

- estado vazio, "Fornecedores sem Contrato"/"Ver todas", e os headers legados do widget.
  Trocar `dashboard.title` de "Início" para "Dashboard - Resumo Mensal".

## Tokens de cor dos ícones (só-tokens)

Reusar tokens existentes p/ os círculos: VERMELHO=`color.feedback.errorText`,
VERDE=`color.status.activeText`/`institutional.green`, ÍNDIGO=`color.nav.background`,
LARANJA=`color.institutional.orange`. Ciano do gráfico = a cor de ação da marca (`#32C6F4`
é papel de ação — expor via token se não houver; senão `institutional`/brand). O
vanilla-extract-expert decide o token exato sem hex cru.

## Constitution Check (§I–§XII)

- §I Vertical-modular: tudo dentro de `financial/client/dashboard`; import externo (partners)
  só via public-api (já é o caso no binding 042). OK.
- §III Server fn única fronteira: nenhum backend novo; só o widget real usa a fn existente. OK.
- §IV/§VII: placeholder tipado com uniões/`Readonly`/`as const`. OK.
- §VI: TS estrito, sem any/enum. OK.
- §VIII: SEM dep nova — gráficos em SVG nativo. OK.
- §X: só-tokens vanilla-extract, zero hex/px cru; ícones via tokens de cor. OK.
- §XI: views BURRAS; placeholder de view-model puro; widget real mantém binding. OK.
- Sem decisão arquitetural nova → sem ADR.

## Gates

`pnpm typecheck` · `pnpm lint` · `pnpm verify` · `pnpm test:dom`. Testes existentes verdes +
novos testes DOM de render (cards/charts com placeholder) e view-model puro.
