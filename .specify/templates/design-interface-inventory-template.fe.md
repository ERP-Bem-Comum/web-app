# 00 · Interface Inventory: [FEATURE]

**Feature**: `specs/[###-feature-name]/design-system/` · **Método**: Atomic Design (Frost), Cap. 4

> O **interface inventory** é a foto crua de TODA a UI da feature antes de sistematizar: cataloga cada
> elemento visual repetido (botões, campos, badges, tabelas, modais…), expõe **inconsistências** e
> estabelece o **vocabulário compartilhado**. É o insumo dos documentos 01–06 (tokens→pages).
> No clone fiel, também fixa a **política de fidelidade**: replicar comportamento visível, **sanear**
> bugs de borda (API/encoding) — bug a bug.

## 1. Fonte da evidência

- [Caminhos: screenshots, DOM capturado, context — `handbook/specs-desing-system/.../`]
- Telas cobertas: [listar]

## 2. Inventário por categoria (Frost)

> Liste o que aparece, com onde foi visto. Marque duplicatas/variações divergentes.

| Categoria | Variações encontradas | Onde aparece | Consolidar como |
|---|---|---|---|
| Botões | [primário ciano, outline, ícone, destrutivo…] | [telas] | [átomo `Button` variants] |
| Campos | [text, select, datepicker, combobox autocomplete…] | [...] | [átomos/moléculas] |
| Badges/Status | [Ativo/Inativo, Cadastrado/Pré…] | [...] | [`StatusBadge`] |
| Tabelas | [colunas, linha clicável, paginação] | [...] | [organismo `DataTable`] |
| Modais | [confirmar/descartar/desativar] | [...] | [organismos] |
| Navegação | [AppShell, sidebar, breadcrumb, back] | [...] | [shell/organismos] |

## 3. Inconsistências detectadas

| # | Inconsistência | Telas | Decisão (padronizar / manter / sanear) |
|---|---|---|---|
| 1 | [ex: breadcrumb singular vs plural] | [...] | padronizar |
| 2 | [ex: encoding `AvaliaÃ§Ã£o`] | [...] | sanear (bug de API) |

## 4. Política de fidelidade (clone fiel)

- **Replicar** (comportamento visível): [...]
- **Sanear** (bug de borda, não-UI): [... → registrar em ADR]
- **Reservado para futuro** (manter placeholder): [ex.: coluna CONTRATOS/ADITIVOS vazia]

## 5. Vocabulário compartilhado (saída)

[Lista de nomes canônicos que os documentos 02–06 e o código (`shared/ui` + `modules/*/client/ui`) usam —
nomeados por **papel/estrutura**, nunca por conteúdo.]
