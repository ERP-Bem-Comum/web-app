# 03 — Organismos

> Seções complexas e relativamente autônomas da interface, compostas por
> moléculas e átomos. São os "blocos grandes" que montam uma página.

---

## `org.sidebar` — Barra lateral de navegação

**Compõe:** marca/logo + N × `mol.nav-item` (alguns expansíveis com filhos).

**Descrição:** navegação principal fixa à esquerda, fundo `--color-sidebar-bg`.

**Estrutura observada**
- Dashboard
- Gestão de Parceiros *(expansível)* → Colaboradores · Fornecedores · Financiadores · Estados · Municípios
- Gestão de Programas
- Gestão de Contratos
- Plano Orçamentário
- Relatórios
- Financeiro
- Gestão de Usuários

**Variantes:** `expanded` (com rótulos, `--sidebar-width-expanded`) e `collapsed` (só ícones, `--sidebar-width-collapsed`). Ambas vistas nas telas.

**Estados:** item ativo destacado; grupo aberto mostra filhos.

**Acessibilidade:** `<nav>` com landmark; item ativo com `aria-current="page"`; grupos como `aria-expanded`.

---

## `org.app-header` — Cabeçalho da aplicação

**Compõe:** (logo no canto) + `atom.label` saudação ("Olá, Alessandra Castro - Teste", `--color-text-greeting`) + `atom.avatar` ("AC") + `atom.icon` chevron (menu do usuário).

**Descrição:** barra superior fixa, fundo branco, altura `--header-height`.

**Comportamento:** chevron abre menu do usuário (perfil/sair).

**Onde aparece:** topo de todas as telas.

---

## `org.data-table` — Tabela de dados

**Compõe:** cabeçalho (`atom.label` column-header × N) + N × `mol.table-row` (com `mol.status-cell`) + `mol.pagination` no rodapé + `mol.empty-state` quando vazia + `atom.spinner` quando carregando.

**Descrição:** listagem tabular paginada e clicável. Cada linha leva aos detalhes.

**Colunas por tela**
| Tela | Colunas |
|------|---------|
| Financiadores | Nome · Representante Legal · CNPJ · Status |
| Fornecedores | Nome · Email · CNPJ · Contratos/Aditivos · Status |
| Colaboradores | Representante Legal · Email · Área de Atuação · Contratos/Aditivos · Função · Status |

**Estados:** `loaded`, `empty` (sem dados), `no-results` (filtro sem match), `loading`, `error`.

**Acessibilidade:** estrutura `<table>` semântica (`<thead>`/`<tbody>`/`<th scope>`); linha clicável com suporte a teclado (Enter); ordenação anunciada se houver.

**Onde aparece:** Financiadores, Fornecedores, Colaboradores.

**BDD:** paginação e estados em `bdd_colaboradores.md`; filtros e vazio em `bdd_fornecedores.md`; navegação a detalhes em `bdd_financiadores.md`.

---

## `org.list-toolbar` — Cabeçalho de listagem

**Compõe:** `mol.page-header` + `mol.toolbar`.

**Descrição:** bloco superior das páginas de lista (título + busca/filtro/ações). Tratado como organismo porque coordena busca, filtro e ações que afetam a tabela.

**Onde aparece:** Financiadores, Fornecedores, Colaboradores.

---

## `org.transfer-list` — Lista de transferência (lista dupla)

**Compõe:** dois `org.transfer-panel` lado a lado.

**Descrição:** padrão central de Estados e Municípios. Painel esquerdo = "Lista Geral"; painel direito = "Adicionados". Itens migram de um para o outro via `+` / `−`.

### `org.transfer-panel` — Painel de transferência

**Compõe:** `atom.label` (título do painel) + filtro (`mol.search-field` ou `mol.state-municipality-filter`) + cabeçalho (`atom.label` "ESTADOS/MUNICÍPIOS" + "ADD"/"REMOVER") + lista de `mol.list-row` (scroll) + `mol.empty-state`.

**Variantes de painel:** `general` (esquerdo, com busca/seletor e coluna ADD), `added` (direito, com busca e coluna REMOVER).

**Comportamento**
- Adicionar item → move para o painel "Adicionados"; na lista geral vira "Adicionado" (bloqueado).
- Remover item → dispara `org.confirm-dialog`; ao confirmar, volta a ficar disponível na lista geral.
- Buscas dos dois painéis são independentes.

**Estados:** com itens, vazio ("Nenhum resultado encontrado"), carregando.

**Onde aparece:** Estados Parceiros, Municípios Parceiros.

**BDD:** `bdd_estado.md` e `bdd_cidades.md` (todos os cenários de visualização, busca, adição, remoção e proteção).

---

## `org.detail-form` — Formulário de detalhe (read-only)

**Compõe:** (opcional `atom.label` section-title) + grade de `mol.field` (readonly) agrupados por seção + `atom.divider` + `mol.detail-actions` (Voltar/Editar).

**Descrição:** exibe os dados de um registro em modo somente leitura, com opção de editar.

**Agrupamento por tela**
| Tela | Seções / campos |
|------|-----------------|
| Colaboradores > Detalhes | "Pré-Cadastro de colaborador(a)": Representante Legal · Email · Área de atuação · Função · Início de Contrato (date) · Vínculo Empregatício · CPF |
| Fornecedores > Detalhes | "Dados cadastrais": Nome · E-mail · CNPJ · Razão Social · Nome Fantasia · Categoria de Serviço · Avaliação de Serviço · Comentário · **"Dados Bancários"**: Banco · Agência-DV · Número da Conta · DV · **"Dados PIX"**: Tipo de chave · Chave PIX |
| Financiadores > Detalhes | Nome do Financiador · Razão Social · CNPJ · Telefone · Representante Legal · Endereço |

**Estados:** view (readonly, padrão), edit (campos habilitados — fora do escopo das telas atuais, mas o botão "Editar" leva a ele).

**Acessibilidade:** campos readonly anunciados como tal; foco gerenciado ao entrar.

**BDD:** `bdd_financiadores.md` / `bdd_fornecedores.md` (consulta de detalhes); `bdd_colaboradores.md` (pré-cadastro).

---

## `org.confirm-dialog` — Diálogo de confirmação

**Compõe:** backdrop (`--z-overlay`) + cartão (`--shadow-overlay`) com `atom.icon` (atenção) + `atom.label` título + texto da mensagem + `mol.dialog-actions`.

**Descrição:** sobreposição modal para confirmar ações sensíveis/destrutivas.

**Variantes**
| Variante | Disparo | Botões |
|----------|---------|--------|
| `remove-state` | Remover estado/município que tem orçamentos | "Descartar alterações" / "Sim, salvar alterações" |
| `discard-changes` | Cancelar cadastro com dados preenchidos | "Cancelar" (continua) / confirmar descarte |

**Comportamento:** bloqueia interação com o fundo; Esc = ação não-destrutiva; foco preso no diálogo (focus trap).

**Acessibilidade:** `role="dialog"` + `aria-modal="true"` + `aria-labelledby`/`aria-describedby`; foco inicial no botão seguro.

**Onde aparece:** remoção em Estados/Municípios; cancelamento de cadastro em Fornecedores.

**BDD:**
- `bdd_estado.md` → "Desistir da remoção (Proteção)" e "Confirmar a remoção com sucesso" (alerta sobre orçamentos).
- `bdd_fornecedores.md` → "Cancelar a inclusão… com proteção de dados" (alerta de descarte).

---

## `org.toast` — Notificação de feedback

**Compõe:** `atom.icon` + texto + (opcional fechar).

**Descrição:** mensagem temporária de sucesso/erro.

**Variantes:** `success` ("Estado removido com sucesso!"), `error`.

**Acessibilidade:** `role="status"` (ou `alert` para erro), `aria-live`.

**BDD:** `bdd_estado.md` → "Estado removido com sucesso!".

---

## `org.access-denied` — Bloqueio por permissão

**Compõe:** `atom.icon` + `atom.label` título + texto explicativo + (opcional) orientação de próximos passos.

**Descrição:** conteúdo exibido quando o usuário não tem a permissão necessária (ex.: `collaborator:read`), seja via menu ou via acesso direto por URL.

**Comportamento:** substitui o conteúdo do módulo; **não** mostra dados; orienta procurar quem libera acesso.

**BDD:** `bdd_colaboradores.md` → "Tentativa de acesso sem permissões" (menu e URL direta) → mensagem clara + orientação.
