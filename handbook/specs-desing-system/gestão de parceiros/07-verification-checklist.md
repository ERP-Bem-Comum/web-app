# 07 — Checklist de Verificação

> Use esta lista para auditar o que a IA (ou o time) implementou. Marque `[x]` ao validar.
> Itens com ⚠️ exigem conferência contra o arquivo de design original.

---

## A. Tokens

- [ ] Todos os tokens de `00-design-tokens.md` foram materializados (CSS vars / JSON / SCSS).
- [ ] ⚠️ Cores conferidas contra o design oficial (todas as marcadas com ⚠️).
- [ ] ⚠️ Família tipográfica confirmada (Roboto?).
- [ ] Nenhum componente usa cor/espaço/fonte hardcoded — tudo via token.
- [ ] Escala de espaçamento respeitada (múltiplos de 4px).

## B. Átomos

- [ ] `atom.button` com 4 variantes + estados (hover, focus, disabled, loading).
- [ ] `atom.icon-button` sempre com `aria-label`.
- [ ] `atom.add-action` alterna corretamente para "Adicionado" (bloqueado).
- [ ] `atom.remove-action` dispara o fluxo de confirmação.
- [ ] `atom.input` cobre: search, floating-label, readonly, error.
- [ ] `atom.select` com teclado (↑↓ Enter Esc) e `aria-expanded`.
- [ ] `atom.badge` Ativo (verde) e Inativo (cinza) — significado não depende só da cor.
- [ ] `atom.spinner` disponível para loading.

## C. Moléculas

- [ ] `mol.search-field` com filtragem (debounce definido).
- [ ] `mol.state-municipality-filter` exige estado antes de listar municípios.
- [ ] `mol.field` em readonly nas telas de detalhe.
- [ ] `mol.table-row` clicável (mouse + teclado) → navega ao detalhe.
- [ ] `mol.pagination` com padrão de 10/página e range correto.
- [ ] `mol.empty-state` distingue "sem resultados" de "sem dados".

## D. Organismos

- [ ] `org.sidebar` com variantes expandida/recolhida e item ativo (`aria-current`).
- [ ] `org.app-header` com saudação + avatar + menu do usuário.
- [ ] `org.data-table` cobre os 5+ estados (default/loading/empty/no-results/error).
- [ ] `org.transfer-list` move itens corretamente entre painéis.
- [ ] Buscas dos dois painéis da transfer list são **independentes**.
- [ ] `org.detail-form` agrupa campos por seção conforme cada tela.
- [ ] `org.confirm-dialog` com focus trap, `role="dialog"`, `aria-modal`.
- [ ] ⚠️ Semântica dos botões de remoção NÃO está invertida (ver `06`, item 5).
- [ ] `org.toast` exibe "Estado removido com sucesso!".
- [ ] `org.access-denied` bloqueia menu **e** URL direta.

## E. Templates & Páginas

- [ ] `tpl.app-shell` (header + sidebar + conteúdo) aplicado a todas as páginas.
- [ ] `tpl.list-page` usado por Financiadores, Fornecedores, Colaboradores.
- [ ] `tpl.detail-page` com grade responsiva (4→2→1 colunas).
- [ ] `tpl.transfer-page` usado por Estados e Municípios.
- [ ] Cada página implementa as colunas/campos exatos listados em `05-pages.md`.

## F. Cobertura BDD (comportamento)

### Colaboradores (`bdd_colaboradores.md`)
- [ ] Sem `collaborator:read` via menu → bloqueio + mensagem + orientação.
- [ ] Sem `collaborator:read` via URL direta → mesmo bloqueio.
- [ ] Sem dados cadastrados → mensagem clara (não tabela vazia).
- [ ] 15 registros → 10 visíveis + paginação.
- [ ] Serviço lento/indisponível → loading mantido.

### Fornecedores (`bdd_fornecedores.md`)
- [ ] Listagem inicial paginada com colunas essenciais.
- [ ] Filtro por status atualiza a tabela.
- [ ] Filtros restritivos sem match → "Nenhum resultado encontrado".
- [ ] Selecionar → detalhes (readonly + Editar).
- [ ] Cancelar cadastro com dados parciais → alerta de descarte.

### Financiadores (`bdd_financiadores.md`)
- [ ] Listagem com colunas Nome/Representante/CNPJ/Status + paginação.
- [ ] "Adicionar Financiadores" → form em branco.
- [ ] Cancelar sem preencher → volta à lista, nada criado.
- [ ] Selecionar → detalhes (readonly + Editar).

### Estados (`bdd_estado.md`)
- [ ] Dois painéis simultâneos com buscas independentes.
- [ ] Buscar válido → filtra; buscar inexistente (adicionados) → vazio + mensagem.
- [ ] Adicionar → move + marca "Adicionado".
- [ ] Remover → alerta de orçamentos → "Descartar" mantém / "Sim, salvar" remove.
- [ ] Remoção bem-sucedida → toast + item volta à lista geral.

### Municípios (`bdd_cidades.md`)
- [ ] Todos os itens de Estados, **mais** seleção de estado antes de listar.

## G. Acessibilidade (geral)

- [ ] Navegação por teclado completa (Tab/Shift+Tab/Enter/Esc).
- [ ] Foco visível em todos os interativos.
- [ ] Landmarks: `<nav>`, `<main>`, `<header>`.
- [ ] Diálogos com foco preso e retorno de foco ao fechar.
- [ ] Contraste de texto conforme WCAG AA (⚠️ checar badges e texto muted).
- [ ] Status comunicados por texto, não só por cor.

---

## Como pedir à IA para auto-verificar

> "Compare a implementação atual com `atomic-design/07-verification-checklist.md`.
> Para cada item, responda ✅/❌ e cite o arquivo/linha onde está implementado.
> Liste primeiro os ❌ e os ⚠️ pendentes."
