# 02 — Moléculas

> Combinações pequenas e funcionais de átomos que formam uma unidade reutilizável
> com um propósito único. Compõem-se **somente de átomos** (e tokens).

---

## `mol.search-field` — Campo de busca

**Compõe:** `atom.input` (variante search) + `atom.icon` (lupa).

**Descrição:** input com ícone de lupa para filtrar listas. Cada lista tem o seu, de forma independente.

**Propriedades:** `placeholder`, `value`, `onSearch`, `debounce` (ms).

**Comportamento:** filtra a lista associada conforme o usuário digita (ou ao submeter).

**Onde aparece:** "Procurar Estado/Município" (duas instâncias independentes por tela), "Pesquise" (Financiadores, Fornecedores, Colaboradores).

**BDD:**
- `bdd_estado.md` → "Buscar por um estado específico" e "ambas as listas devem possuir campos de busca independentes".
- `bdd_cidades.md` → idem para municípios.

---

## `mol.state-municipality-filter` — Filtro de Estado + busca (Municípios)

**Compõe:** `atom.select` ("Selecionar Estado") + `mol.search-field` ("Procurar Município").

**Descrição:** bloco de filtro do painel esquerdo de Municípios. A lista de municípios só popula **após** selecionar um estado.

**Comportamento:** sem estado selecionado → lista mostra "Nenhum resultado encontrado". Com estado (ex.: "Amazonas") → carrega municípios daquele estado.

**Onde aparece:** topo do painel "Lista Geral de Municípios".

**BDD:** `bdd_cidades.md` (fluxo de visualização e busca).

---

## `mol.field` — Campo de formulário

**Compõe:** `atom.label` (flutuante) + `atom.input` **ou** `atom.select`.

**Descrição:** unidade de formulário rotulada. Nas telas de detalhe aparece em **modo readonly** (valor preenchido, campo bloqueado em cinza).

**Variantes:** `text`, `select`, `date` (com ícone de calendário — "Início de Contrato").

**Propriedades:** `label`, `value`, `readonly`, `disabled`, `error`, `required`.

**Onde aparece:** todas as telas de detalhe (Colaboradores, Fornecedores, Financiadores).

**BDD:**
- `bdd_financiadores.md` / `bdd_fornecedores.md` → "informações em formato somente leitura".

---

## `mol.list-row` — Linha de lista (transfer list)

**Compõe:** `atom.label` (nome) + (`atom.add-action` **ou** `atom.remove-action`) + `atom.divider`.

**Descrição:** uma linha das listas de Estados/Municípios. À esquerda o nome; à direita a ação (adicionar na lista geral, remover na lista de adicionados).

**Variantes:** `available` (com botão +), `available-added` (texto "Adicionado", bloqueado), `added` (com botão −).

**Propriedades:** `name`, `mode` (available | added), `state` (enabled | added), `onAdd`, `onRemove`.

**Onde aparece:** painéis de Estados e Municípios.

**BDD:** adição/remoção em `bdd_estado.md` e `bdd_cidades.md`.

---

## `mol.table-row` — Linha de tabela de dados

**Compõe:** N × célula (`atom.label`/texto) + opcional `atom.badge` + opcional `atom.text-status` + `atom.divider`.

**Descrição:** linha de uma tabela de listagem. Clicável → navega para os detalhes.

**Propriedades:** `columns` (array de valores), `onClick` (abre detalhes).

**Onde aparece:** Financiadores, Fornecedores, Colaboradores.

**BDD:**
- `bdd_financiadores.md` → "seleciono um financiador… redirecionado para Detalhes".
- `bdd_fornecedores.md` → idem.

---

## `mol.status-cell` — Célula de status

**Compõe:** `atom.badge` + (opcional) `atom.text-status`.

**Descrição:** célula da coluna STATUS. Em Colaboradores combina badge ("Ativo"/"Inativo") com sub-status ("Cadastrado"/"Pré Cadastrado").

**Onde aparece:** coluna STATUS das tabelas.

---

## `mol.pagination` — Paginação

**Compõe:** `atom.select` ("Itens por página") + `atom.link`/texto (range "1 - 41") + `atom.icon-button` × 2 (anterior/próximo).

**Descrição:** controle de navegação entre páginas de uma tabela.

**Propriedades:** `pageSize`, `pageSizeOptions`, `rangeLabel`, `hasPrev`, `hasNext`, `onPrev`, `onNext`, `onPageSizeChange`.

**Comportamento padrão:** 10 itens por página por padrão (regra BDD); nas telas mostra "5" selecionado como exemplo.

**Onde aparece:** rodapé de Financiadores, Fornecedores, Colaboradores.

**BDD:** `bdd_colaboradores.md` → "ver apenas os 10 primeiros registros… visualizar o controle de paginação". `bdd_financiadores.md` → "respeitando o limite de paginação padrão".

---

## `mol.toolbar` — Barra de ações da listagem

**Compõe:** (opcional `atom.icon-button` filtro) + `mol.search-field` + `atom.button` (ação primária) + (opcional `atom.button` secundário).

**Descrição:** faixa no topo das listas com busca, filtro e botões de adicionar/importar.

**Variantes**
| Tela | Conteúdo |
|------|----------|
| Financiadores | busca + "Adicionar Financiadores" |
| Fornecedores | filtro + busca + "Adicionar Fornecedores" |
| Colaboradores | filtro + busca + "Importar CSV/Excel" + "Adicionar Colaborador" |

**Onde aparece:** topo de cada página de lista.

**BDD:** acesso ao formulário de adição em `bdd_financiadores.md`; filtro em `bdd_fornecedores.md`.

---

## `mol.nav-item` — Item de navegação

**Compõe:** `atom.icon` + `atom.label` + (opcional `atom.icon` chevron para grupos expansíveis).

**Descrição:** item da sidebar. Pode ser folha (link) ou grupo expansível (ex.: "Gestão de Parceiros" abre Colaboradores/Fornecedores/Financiadores/Estados/Municípios).

**Estados:** default, hover, `active` (fundo/realce `--color-sidebar-active`), expanded/collapsed (grupos), e variação **icon-only** quando a sidebar está recolhida.

**Propriedades:** `icon`, `label`, `active`, `expandable`, `expanded`, `children`.

**Onde aparece:** sidebar (todas as telas).

---

## `mol.page-header` — Cabeçalho de página

**Compõe:** (opcional `atom.icon-button` voltar) + `atom.label` (título da página, `--text-page-title`).

**Variantes:** `simple` (só título — telas de lista), `with-back` (seta voltar + título com breadcrumb "X > Detalhes").

**Onde aparece:** topo de toda página de conteúdo.

---

## `mol.dialog-actions` — Ações de diálogo

**Compõe:** `atom.button` secundário ("Descartar alterações" / "Cancelar") + `atom.button` primário/danger ("Sim, salvar alterações").

**Descrição:** par de botões no rodapé de diálogos de confirmação.

**Onde aparece:** diálogos de remoção de estado e de descarte de cadastro.

**BDD:** `bdd_estado.md` ("Descartar alterações" / "Sim, salvar alterações"); `bdd_fornecedores.md` (confirmar descarte).

---

## `mol.detail-actions` — Ações da tela de detalhe

**Compõe:** `atom.button` secundário ("Voltar") + `atom.button` primário ("Editar").

**Descrição:** par de botões alinhado à direita, abaixo dos campos, nas telas de detalhe.

**Onde aparece:** Colaboradores/Fornecedores/Financiadores > Detalhes.

**BDD:** "a opção de Editar deve estar visível e disponível".

---

## `mol.empty-state` — Estado vazio

**Compõe:** `atom.icon` (opcional) + `atom.label`/texto (mensagem).

**Descrição:** mensagem exibida quando uma lista/tabela não tem resultados ou registros.

**Variantes:** `no-results` ("Nenhum resultado encontrado"), `no-data` ("não existem colaboradores cadastrados").

**Onde aparece:** painéis de Estados/Municípios vazios; tabelas sem dados.

**BDD:**
- `bdd_estado.md` → "Nenhum resultado encontrado".
- `bdd_fornecedores.md` → "Nenhum resultado encontrado" em filtro sem correspondência.
- `bdd_colaboradores.md` → "não devo ver uma tabela vazia… mensagem clara informando que não existem colaboradores cadastrados".
