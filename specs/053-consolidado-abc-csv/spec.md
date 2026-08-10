# Spec — Export CSV do Consolidado ABC (server-side / BFF) · #053

- **Feature:** `053-consolidado-abc-csv`
- **Escala:** M (feature pequena, front-first sobre placeholder)
- **Rastreio:** core-api#319 (camada Frontend/BFF) · Decisão 11 da P.O. · HANDBOOK Plano Orçamentário §2
- **Origem do dado:** INTERINO placeholder (o core-api `GET /budget-plans/consolidated-result` está ABERTO)

## Contexto

A tela **Consolidado ABC** (`src/modules/budget-plans/client/planejamento/consolidado/`) já existe e
renderiza a matriz Centro de Custo → Categoria × 12 meses a partir de um placeholder. Falta o **export CSV**.

**Decisão 11 da P.O.:** o CSV é gerado **server-side** (o BFF É server-side), **não** client-side. O client
apenas dispara o download do artefato que o BFF entregou.

## User Story (P1)

> Como analista de planejamento, quero exportar o Consolidado ABC em CSV para abrir na planilha,
> com o layout exato do relatório oficial (Centro de Custo, Categoria, 12 meses, Total, valores em R$).

## Requisitos funcionais

- **FR-001** — O BFF expõe uma server function `exportConsolidadoAbcCsvFn` (§III, única fronteira) que
  recebe `{ year, programs }`, valida na borda (Zod §IX), e devolve `{ filename, content }` — o `content`
  é o CSV **já serializado no servidor**.
- **FR-002** — A serialização é uma função **pura** no domínio (`consolidatedAbcToCsv`), sem `throw` (§II),
  testável por `node:test`.
- **FR-003** — O CSV espelha **byte-a-byte** a amostra do handbook
  (`HANDBOOK-plano-orcamentario-consolidado-abc-export-exemplo.csv`):
  - Header (16 colunas): `Centro de Custo, Categoria, Subcategoria, Janeiro…Dezembro, Total`.
  - Por Centro de Custo: 1 linha de **grupo** (nome do CC + meses vazios + total do CC) seguida das
    linhas de **Categoria** (Categoria + 12 meses + total). Subcategorias (quando houver) em linha própria.
  - Linha final **TOTAL** (soma coluna-a-coluna dos meses + total geral).
  - Valores em BRL pt-BR (`R$ 1.234,56`) a partir de **centavos** (§IV). Todos os campos entre aspas duplas,
    delimitados por vírgula.
- **FR-004** — O client liga o botão **"Exportar CSV"** (remove o `TODO(#113)`): chama a server fn, recebe o
  CSV do servidor e dispara o download (Blob + anchor). O CSV **não** é montado no client.
- **FR-005** — Estados de `loading`/`erro` do export tratados na binding (mutation).
- **FR-006** — A FONTE placeholder fica **isolada num único arquivo** no server. Quando o core-api fechar
  o endpoint, troca-se **só a fonte**; o serializador e a server fn permanecem.

## Critério de aceite (DoD)

- `consolidatedAbcToCsv(placeholderSource())` **=== o CSV-exemplo do handbook** (fixture byte-a-byte).
- Cobertura node:test: header, linha de grupo do CC, linhas de categoria, linha TOTAL, formatação BRL.
- Teste DOM: o botão "Exportar CSV" dispara a server fn + download (fn/URL/anchor mockados).
- Sem `!` (non-null assertion). Gates verdes: `typecheck && build && lint && test && test:dom`.

## Fora de escopo

- Export XLSX/PDF nativo.
- Chamada real ao core-api (fica para quando `GET /budget-plans/consolidated-result` existir — só troca a fonte).
