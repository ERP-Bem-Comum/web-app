# 05 — Páginas

> Instâncias concretas dos templates, com dados e regras reais. Cada página lista
> o template usado, os organismos, e os cenários BDD que ela precisa satisfazer.

---

## Página: Colaboradores (lista)

- **Template:** `tpl.list-page`
- **Rota sugerida:** `/colaboradores`
- **Permissão:** requer `collaborator:read` (senão → `org.access-denied`)
- **Toolbar:** filtro + busca + "Importar CSV/Excel" + "Adicionar Colaborador"
- **Colunas:** Representante Legal · Email · Área de Atuação · Contratos/Aditivos · Função · Status (badge + sub-status)
- **Paginação:** padrão 10/página
- **Linha clicável:** → `/colaboradores/:id` (detalhe)

**BDD a satisfazer (`bdd_colaboradores.md`):**
- Bloqueio sem permissão (menu **e** URL direta) → `org.access-denied`
- Lista sem dados → `mol.empty-state` (no-data), nunca tabela vazia
- 15 registros → mostra 10 + paginação
- Servidor lento/indisponível → mantém `atom.spinner` (loading)

---

## Página: Colaboradores > Detalhes

- **Template:** `tpl.detail-page`
- **Rota:** `/colaboradores/:id`
- **Form (`org.detail-form`):** seção "Pré-Cadastro de colaborador(a)" — Representante Legal · Email · Área de atuação · Função · Início de Contrato (date) · Vínculo Empregatício · CPF (todos readonly)
- **Ações:** Voltar · Editar

**Observação:** registros podem estar em estado "Pré Cadastrado" (badge Inativo + sub-status). O título do form reflete isso.

---

## Página: Fornecedores (lista)

- **Template:** `tpl.list-page`
- **Rota:** `/fornecedores`
- **Permissão:** requer permissões gerenciais
- **Toolbar:** filtro + busca + "Adicionar Fornecedores"
- **Colunas:** Nome · Email · CNPJ · Contratos/Aditivos · Status
- **Filtros:** por Status (ex.: "Inativo"), por Categoria (ex.: "Buffet")

**BDD a satisfazer (`bdd_fornecedores.md`):**
- Listagem inicial paginada com colunas essenciais
- Filtrar com sucesso → tabela só com correspondências
- Filtros restritivos sem match → `mol.empty-state` ("Nenhum resultado encontrado")
- Selecionar fornecedor → detalhes
- Cancelar inclusão com dados parciais → `org.confirm-dialog` (discard-changes)

---

## Página: Fornecedores > Detalhes

- **Template:** `tpl.detail-page`
- **Rota:** `/fornecedores/:id`
- **Form:** três seções —
  - **Dados cadastrais:** Nome · E-mail · CNPJ · Razão Social · Nome Fantasia · Categoria de Serviço · Avaliação de Serviço · Comentário da Avaliação
  - **Dados Bancários:** Banco · Agência-DV · Número da Conta · DV
  - **Dados PIX:** Tipo de chave · Chave PIX
- **Ações:** Voltar · Editar (campos readonly até editar)

**BDD:** "dados cadastrais e bancários bloqueados para edição" + "Editar disponível".

---

## Página: Financiadores (lista)

- **Template:** `tpl.list-page`
- **Rota:** `/financiadores`
- **Toolbar:** busca + "Adicionar Financiadores"
- **Colunas:** Nome · Representante Legal · CNPJ · Status
- **Paginação:** "Itens por página: 5", range "1 - 1"

**BDD a satisfazer (`bdd_financiadores.md`):**
- Listagem inicial com colunas essenciais + paginação padrão
- Acessar "Adicionar Financiadores" → tela de adição com campos em branco
- Cancelar sem preencher → volta à listagem, nada criado
- Selecionar financiador → detalhes (readonly + Editar)

---

## Página: Financiadores > Detalhes

- **Template:** `tpl.detail-page`
- **Rota:** `/financiadores/:id`
- **Form:** Nome do Financiador · Razão Social · CNPJ · Telefone · Representante Legal · Endereço (readonly)
- **Ações:** Voltar · Editar

---

## Página: Estados Parceiros

- **Template:** `tpl.transfer-page`
- **Rota:** `/estados`
- **Painel geral:** busca "Procurar Estado" + lista de estados (coluna ADD)
- **Painel adicionados:** busca "Procurar Estado" + lista (coluna REMOVER)

**BDD a satisfazer (`bdd_estado.md`):**
- Exibir os dois painéis simultaneamente, com buscas independentes
- Buscar estado válido → filtra lista correspondente
- Buscar inexistente nos adicionados → vazio + "Nenhum resultado encontrado"
- Adicionar com sucesso → move para adicionados; lista geral marca "Adicionado" (bloqueado)
- Remover → `org.confirm-dialog` (alerta sobre orçamentos):
  - "Descartar alterações" → permanece sem mudança
  - "Sim, salvar alterações" → `org.toast` "Estado removido com sucesso!" + volta a ficar disponível na lista geral

---

## Página: Municípios Parceiros

- **Template:** `tpl.transfer-page`
- **Rota:** `/municipios` — **confirmada** via DOM (`baseURI: .../municipios`)
- **Painel geral:** `mol.state-municipality-filter` (Selecionar Estado + Procurar Município) + lista (coluna ADD)
- **Painel adicionados:** busca + lista (coluna REMOVER)
- **Pré-condição:** lista geral só popula após escolher um estado (ex.: "Amazonas")

**BDD a satisfazer (`bdd_cidades.md`):** mesmos cenários de Estados, aplicados a municípios, com o passo adicional de seleção de estado.

---

## Mapa de cobertura Página × BDD

| Página | Arquivo BDD | Cenários cobertos |
|--------|-------------|-------------------|
| Colaboradores (lista) | `bdd_colaboradores.md` | Permissão (menu/URL), sem dados, paginação, loading |
| Colaboradores > Detalhes | `bdd_colaboradores.md` | Pré-cadastro / leitura |
| Fornecedores (lista) | `bdd_fornecedores.md` | Listagem, filtros, vazio, navegação, cancelar c/ proteção |
| Fornecedores > Detalhes | `bdd_fornecedores.md` | Detalhe readonly + Editar |
| Financiadores (lista) | `bdd_financiadores.md` | Listagem, adicionar, cancelar, navegação |
| Financiadores > Detalhes | `bdd_financiadores.md` | Detalhe readonly + Editar |
| Estados Parceiros | `bdd_estado.md` | Visualização, busca, adição, remoção + proteção |
| Municípios Parceiros | `bdd_cidades.md` | Idem + seleção de estado |
