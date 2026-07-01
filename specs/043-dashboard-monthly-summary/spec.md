# Spec — Dashboard "Resumo Mensal" (reprodução fiel do legado) — 043

## Contexto

Reproduzir FIELMENTE a tela do Dashboard legado ("Dashboard - Resumo Mensal") no front v2.
A **fidelidade visual e a diagramação são a prioridade máxima** (pedido explícito da P.O.):
proporções, cores, espaçamento e a "cara" dos gráficos devem bater com o print legado.

Front-only por ora: **dados PLACEHOLDER**, EXCETO o widget "Últimos pagamentos" que já é REAL
(feature 042, no working tree, consumindo o endpoint #239). Este trabalho **reaproveita** a
feature 042 como a tabela da linha inferior.

## Escopo (tamanho L, design-heavy)

Front-only. Nenhum backend novo, nenhuma server function nova. Só camada `client/` (MVVM) +
design-system (vanilla-extract só-tokens). Reescreve o layout do `DashboardPage`.

## Layout a reproduzir

Título grande no topo: **"Dashboard - Resumo Mensal"** (remove o "Início" atual).
Fundo claro (cards brancos), tom institucional `vars.color.surface.app`.

### Linha 1 — 4 cards de MÉTRICA (grid 4 colunas, responsivo)

Cada card branco: rótulo pequeno em cima, **valor grande** embaixo, linha de **tendência**
("↑ 0% · <legenda>") e **ícone circular colorido** à direita.

1. **Gastos** — R$ 0,00 · ↑ 0% Último mês · ícone VERMELHO.
2. **Arrecadação** — R$ 0,00 · ↑ 0% Último mês · ícone VERDE.
3. **Top Financiador** — 0% · ↑ 0% Financiador · ícone ÍNDIGO/ROXO.
4. **Top Centro de Custo** — R$ 0,00 · ↑ 0% Centro de Custo · ícone LARANJA.

### Linha 2 — 2 colunas (esquerda ~2/3, direita ~1/3)

- **Esquerda — card "Visão geral"**: sub-link "Previsto x Realizado" + botão "Ver tudo".
  Dentro, **gráfico de LINHA em SVG nativo** (SEM lib nova — §VIII): eixo X Jan..Dez,
  eixo Y R$0..R$18k com gridlines pontilhadas em R$4.5k/9k/13.5k/18k; **2 séries** —
  "Previsto" (CIANO `#32C6F4`) e "Realizado" (VERDE) — placeholder (pico Fev-Mar → zero).
  SVG parametrizável por props (recebe pontos), pronto para dados reais depois.
- **Direita (topo) — card "Pagamentos por Centro de Custo em %"**: **DONUT em SVG** com
  estado VAZIO "Sem gastos no mês anterior". Componente aceita fatias por props.
- **Direita (baixo) — card "Fornecedores sem Contrato"**: título + botão "Ver todas"
  (largura total). Placeholder (sem lista por ora).

### Linha 3 — largura total — "Últimos pagamentos realizados"

REUSA o widget da feature 042 (dados REAIS do #239). Alinha as COLUNAS ao legado:
**NOME · VENCIMENTO · CONTA · VALOR** (renomear headers; usar dados reais; data = a do pagamento).
Mantém a resolução de nomes que já existe.

## User stories

- **US1 (P1)** — Como usuário, vejo a tela "Dashboard - Resumo Mensal" reproduzindo o legado:
  4 cards de métrica, gráfico de linha, donut vazio, card de fornecedores sem contrato, e a
  tabela de últimos pagamentos, com fidelidade visual ao print.
- **US2 (P1)** — Os "Últimos pagamentos" continuam REAIS (042) e sem regressão, com headers
  realinhados ao legado (Nome · Vencimento · Conta · Valor).

## Fora de escopo

- Backend / server functions novos (dados placeholder exceto 042).
- Ligação real dos 4 cards, do gráfico de linha, do donut e dos fornecedores sem contrato
  (dependem de endpoints inexistentes — core-api#112; SVG já parametrizável p/ ligar depois).
- Navegação real dos botões "Ver tudo"/"Ver todas" (placeholder por ora).

## Critérios de aceite

- Render visualmente fiel ao print (proporções/cores/espaçamento/gráficos).
- SEM dependência nova; gráficos em SVG nativo.
- CSS só-tokens `vars.*` (zero hex/px cru); i18n PT `dashboard.*` (nada hardcoded na view).
- MVVM: views burras; placeholder vem de constante/view-model puro; o widget real mantém seu binding.
- Feature 042 e o resto do app sem regressão.
- Testes DOM de render dos componentes novos + view-model puro (se houver derivação) verdes.
- 4 gates verdes: `pnpm typecheck`, `pnpm lint`, `pnpm verify`, `pnpm test:dom`.
