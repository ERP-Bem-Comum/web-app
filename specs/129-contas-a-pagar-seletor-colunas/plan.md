# 129 — Plano

## Camadas (MVVM, §XI)

| Arquivo                                  | Papel                                                           |
| ---------------------------------------- | --------------------------------------------------------------- |
| `contas-a-pagar.view-model.ts`           | `COLUMNS` ganha `locked`; tipo `ColumnKey`                      |
| `column-visibility.view-model.ts`        | puro: parse/serialize/toggle/visíveis; guarda as **escondidas** |
| `column-visibility.binding.ts`           | `useSyncExternalStore` + localStorage (`cap.hiddenColumns.v1`)  |
| `components/columns-menu.component.tsx`  | view burra: botão + menu de checkboxes + "Mostrar todas"        |
| `components/document-grid.component.tsx` | prop opcional `hiddenColumns`; células por chave (`cellOf`)     |
| `page/contas-a-pagar.css.ts`             | `COLUMN_TRACKS` por chave; `--cap-grid-cols` / `--cap-row-min`  |

## Decisões técnicas

- **Guardar as escondidas, não as visíveis:** coluna nova no `COLUMNS` nasce visível para quem já tem
  preferência salva. Chave desconhecida ou fixa no storage é ignorada.
- **`useSyncExternalStore`:** o SSR renderiza todas as colunas (sem localStorage no servidor) e o client
  aplica a preferência após hidratar, sem mismatch. Fallback em memória sem localStorage.
- **Template dinâmico via custom property:** o grid publica `--cap-grid-cols` e `--cap-row-min` no
  scroller; head e rows herdam. O fallback é o template completo — sem a prop, nada muda (aditivo).
- **Tracks `minmax(mín, peso fr)` com peso = mínimo** (Fornecedor 21fr = 15 × 1,4): a sobra se reparte em
  proporção. A largura mínima da linha (soma dos mínimos + gaps) preserva o fix das barras do #435.
