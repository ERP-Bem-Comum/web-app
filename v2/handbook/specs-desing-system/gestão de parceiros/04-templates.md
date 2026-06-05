# 04 — Templates

> Esqueletos de layout: definem **onde** os organismos ficam, sem dados reais.
> Uma página é um template preenchido com conteúdo concreto.

Todos os templates compartilham o **layout base**:

## `tpl.app-shell` — Casca da aplicação

```
┌──────────────────────────────────────────────────────────┐
│ org.app-header                                            │  ← fixo, --header-height
├──────────┬───────────────────────────────────────────────┤
│          │                                                │
│ org.     │   [ ÁREA DE CONTEÚDO ]                         │
│ sidebar  │   (um dos templates abaixo)                    │
│          │   fundo --color-bg                             │
│ (fixo)   │   padding --content-padding-y/x (32px / 24px)  │
│          │   max-width --content-max-width                │
│          │                                                │
└──────────┴───────────────────────────────────────────────┘
```

Toda página vive dentro desta casca. A área de conteúdo recebe um dos templates a seguir.

---

## `tpl.list-page` — Página de lista

**Usa:** `org.list-toolbar` + `org.data-table`.

```
┌────────────────────────────────────────────────────┐
│ mol.page-header (título)                            │
│ mol.toolbar  [filtro?] [busca........] [+ Adicionar]│
├────────────────────────────────────────────────────┤
│ org.data-table                                      │
│   ┌ cabeçalho de colunas ───────────────────────┐  │
│   │ COL · COL · COL · STATUS                     │  │
│   ├──────────────────────────────────────────────┤  │
│   │ linha clicável → detalhe                     │  │
│   │ linha clicável → detalhe                     │  │
│   │ … (ou empty-state / spinner)                 │  │
│   ├──────────────────────────────────────────────┤  │
│   │ mol.pagination          Itens/pág · 1-N · ‹ ›│  │
│   └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Slots configuráveis:** título; presença de filtro; ações da toolbar; definição de colunas; rota de detalhe ao clicar na linha.

**Aplica-se a:** Financiadores, Fornecedores, Colaboradores.

---

## `tpl.detail-page` — Página de detalhe

**Usa:** `mol.page-header` (with-back) + `org.detail-form`.

```
┌────────────────────────────────────────────────────┐
│ ‹  Módulo > Detalhes                                │  ← page-header com voltar
├────────────────────────────────────────────────────┤
│ org.detail-form (cartão branco)                     │
│   [Seção opcional]                                  │
│   ┌ campo ┐ ┌ campo ┐ ┌ campo ┐ ┌ campo ┐  (grade) │
│   ┌ campo ┐ ┌ campo ┐ ┌ campo ┐                     │
│   ──────────────────────────────────  (divisor)    │
│                              [ Voltar ] [ Editar ]  │
└────────────────────────────────────────────────────┘
```

**Slots configuráveis:** breadcrumb/título; seções e campos; ação do "Editar".

**Grade:** observada em **4 colunas** nas telas largas (Fornecedores, Financiadores) e quebrando conforme o conteúdo. Definir grid responsivo (4 → 2 → 1 colunas).

**Aplica-se a:** Colaboradores, Fornecedores, Financiadores > Detalhes.

---

## `tpl.transfer-page` — Página de transfer list

**Usa:** `mol.page-header` (simple) + `org.transfer-list` (dois painéis).

```
┌────────────────────────────────────────────────────┐
│ Título Parceiros                                    │
├──────────────────────────┬─────────────────────────┤
│ Lista Geral              │ Parceiros Adicionados    │
│ ┌ filtro/seletor ──────┐ │ ┌ busca ──────────────┐  │
│ │ [busca / select]     │ │ │ [busca]             │  │
│ ├──────────────────────┤ │ ├─────────────────────┤  │
│ │ ITENS          ADD   │ │ │ ITENS        REMOVER │  │
│ │ nome           (+)   │ │ │ nome           (−)   │  │
│ │ nome      Adicionado │ │ │ … / empty-state      │  │
│ │ … (scroll)           │ │ │                      │  │
│ └──────────────────────┘ │ └─────────────────────┘  │
└──────────────────────────┴─────────────────────────┘
```

**Slots configuráveis:** título; tipo de filtro do painel geral (busca simples = Estados; seletor de estado + busca = Municípios); fonte de dados de cada painel.

**Aplica-se a:** Estados Parceiros, Municípios Parceiros.

---

## Responsividade (diretriz geral)

> ⚠️ As telas fornecidas são desktop. As regras abaixo são recomendações a confirmar.

| Breakpoint | Comportamento |
|------------|---------------|
| ≥ 1200px | Layout completo; transfer list e grade de detalhe lado a lado |
| 768–1199px | Sidebar recolhida (ícones); grade de detalhe em 2 colunas; transfer panels podem empilhar |
| < 768px | Sidebar vira menu off-canvas; tabelas com scroll horizontal ou cartões; painéis empilhados; grade de detalhe em 1 coluna |
