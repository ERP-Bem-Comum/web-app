# Mapa funcional — Módulo **Plano Orçamentário** (sistema legado)

> Levantamento feito navegando o sistema legado em `https://201.23.88.105.sslip.io`
> (login `admin@bemcomum.com`), em 2026-06-30, para reproduzir o módulo no frontend v2
> com o máximo de fidelidade. Cobre os dois submódulos: **Planejamento** e **Consolidado ABC**.
> Contexto do port: ver `MEMORY.md` → [[legacy-modules-port-plan]] (Budget Plans #113).
>
> **Fontes:** (a) navegação ao vivo com a admin; (b) vídeo de tela da usuária
> (`Gravação de Tela 2026-06-30 às 22.05.11.mov`, 8m30s) — extraí frames e incorporei
> os fluxos dinâmicos. Achados que só o vídeo revelou estão marcados com **🎥**.

---

## 0. Contexto e navegação

- **Item de menu (sidebar):** `Plano Orçamentário` (ícone de calendário), colapsável, com 2 subitens:
  - **Planejamento** → rota `/planejamento`
  - **Consolidado ABC** → rota `/consolidado`
- Sidebar é de ícones e **expande no hover** mostrando os rótulos. Cabeçalho fixo "Olá, Administrador".
- O módulo depende de outros cadastros:
  - **Programa** (vem de _Gestão de Programas_) — ex.: `ETI`.
  - **Estado / parceiro** (a "Rede") — ex.: `Acre`.
  - **Centros de custo / categorias / subcategorias** — gerenciados dentro do próprio plano.

### Conceito central

Um **Plano Orçamentário** = `Ano` + `Programa` (ex.: **"2026 ETI"**, **"2026 PARC"**, **"2025 EPV"**). Ele é **versionado**
(`1.0`, `1.2`, `2.0`…) e tem **status** — **3 valores** 🎥: `Rascunho` · `Em Calibração` · `Aprovado`. Os valores são orçados numa
matriz **Centro de Custo → Categoria → Subcategoria × 12 meses**, segmentada por **Rede** — que pode ser
**por Estado OU por Município** dependendo do programa 🎥 (a coluna PARCEIROS mostra "N estados" ou "N municípios").
Cada valor mensal de uma subcategoria é lançado conforme o **"Tipo de lançamento"** da subcategoria
(Folha/Pessoal · Valor+IPCA · Qtd×Custo unitário — ver 1.8), e a subcategoria tem um **"Tipo"** (`Institucional` | `Rede`)
que define se o gasto é único ou replicado por rede.

### Inventário de rotas

| Rota                                                | Tela                                                 | Seção   |
| --------------------------------------------------- | ---------------------------------------------------- | ------- |
| `/planejamento`                                     | Lista de planos orçamentários                        | 1.1     |
| `/planejamento/detalhes/:id`                        | Detalhe/consolidado do plano (por mês / por rede)    | 1.4     |
| `/planejamento/detalhes/:id/orcamento/:orcamentoId` | Edição do orçamento de 1 estado (grid + calculadora) | 1.7–1.8 |
| `/consolidado`                                      | Consolidado ABC (relatório multi-programa)           | 2       |

> `:id` observado = plano `3` (2026 ETI 1.2); `:orcamentoId` = `2` (Acre). Sidebar: _Plano Orçamentário_ → _Planejamento_ / _Consolidado ABC_.

### Inventário de modais/diálogos

- **Planejamento (lista):** Adicionar Plano Orçamentário · Compartilhar · Iniciar Calibração · Aprovar (confirm + sucesso) · Criar cenário · Excluir (confirm + sucesso) · alerta de permissão.
- **Detalhe:** Centros de Custo (gestão) → Adicionar/Editar Centro de custo · Adicionar/Editar Categoria · Adicionar/Editar Sub categoria (Tipo + Tipo de lançamento) · Adicionar Orçamento (+ alerta duplicado) · Plano Insight · Compartilhar.
- **Orçamento (edição):** Calculando Gastos (full-screen, 3 tipos de form) · confirmação de descarte · menu "…" (Exportar CSV · Excluir Orçamento).
- **Consolidado ABC:** Compartilhar.

---

## 1. Submódulo **Planejamento**

### 1.1 Lista de planos — `/planejamento`

Layout: título "Planejamento" + card branco com:

- **Barra de filtros:** botão de **funil** · campo **"Pesquise"** (busca por texto) · botão **"Criar Plano"** (à direita).
  - O **funil** expande uma linha de filtros 🎥: **Ano** (dropdown 2019–2026) · **Programa** (dropdown) · **Status** (dropdown: `Aprovado` · `Em Calibração` · `Rascunho`) · botão **"Filtrar"**.
- **Tabela** com colunas: `PLANO ORÇAMENTÁRIO` · `TOTAL` · `PARCEIROS` · `STATUS` · (coluna de ação "…").
  - Linha-pai = plano (ex.: `2026 ETI 1.0`, `R$ 0,00`, `0 estados`, badge **Aprovado** verde + "Administrador alteração 30/06/2026 22:06").
  - **Chevron** expande as **versões-filhas** (ex.: `2026 ETI 1.2` com subtítulo `Inicial`, `R$ 32.438,72`, `1 estados`, badge **Rascunho** cinza).
  - `PARCEIROS` conta as redes vinculadas — **"N estados" ou "N municípios"** conforme a granularidade do programa 🎥.
- **Paginação:** "Itens por página: 5" (seletor) · "1 - 1" · setas ‹ ›.
- Clique no nome da versão → **detalhe do plano** (`/planejamento/detalhes/:id`).
- **Badge de status por linha:** `Rascunho` (cinza) · `Em Calibração` (azul) · `Aprovado` (verde). Abaixo, **trilha de auditoria**: _"{usuário} alteração {dd/mm/aaaa hh:mm}"_ (multiusuário — ex.: Bruno Costa, Eduardo Silva, Administrador).

#### Versionamento (pai → versões/cenários/calibrações) 🎥

As linhas-filhas (chevron) representam versões do mesmo plano, com um **rótulo** (subtítulo). Exemplos reais:
| Linha | Rótulo | Status | Origem |
|---|---|---|---|
| `2026 EPV 1.0` | — | Rascunho | plano-pai |
| `2026 EPV 1.1` | Inicial | Rascunho | 1ª versão de trabalho |
| `2026 PARC 1.0` | — | Aprovado | plano-pai |
| `2026 PARC 2.0` | — | **Em Calibração** | **Calibração** de 1.0 (nova versão maior) |
| `2025 PARC 1.1` | **"Cenário 01 - Bruno"** | Rascunho | **Criar cenário** (rótulo = nome do cenário) |
| `2025 PARC 2.0` | — | Em Calibração | Calibração |

- **Calibração** → gera versão **`X.0`** com status **`Em Calibração`**.
- **Criar cenário** → gera versão-filha cujo **rótulo é o "Nome do cenário"** digitado (ex.: `1.1 · Cenário 01 - Bruno`), status Rascunho.
- **Versão inicial** de um plano leva o rótulo `Inicial`.
- Uma versão (ex.: `2.0`) pode ter seu **próprio chevron** (sub-versões aninhadas).

### 1.2 Criar Plano — modal "Adicionar Plano Orçamentário"

Disparado por **"Criar Plano"**. Campos:

- **Ano** (texto, default `2026`).
- **Programa** (dropdown — opções vindas de Gestão de Programas: `ETI`, `dsahlkdfshl`, `EPV`…).
- Toggle **"Importar dados"** 🎥 — quando **ligado**, revela o campo **"Criar a partir do ano de"**
  (dropdown de **ano**: 2019–2025). **Comportamento:** se existir orçamento planejado para o ano
  selecionado (mesmo programa), ele **repete/clona esses dados como base** no novo ano; se **não** existir,
  **avisa que não há dados**. Desligado = plano em branco.
- Botões: **Adicionar** / **Cancelar**.
- **Validação de duplicidade** 🎥: criar plano com Ano+Programa já existentes → alerta (i)
  _"Atenção! Já existe um plano orçamentário com essas informações."_ — **Entendi**.
  > Nota: na 1ª navegação o toggle apareceu como "Criar em branco"; o rótulo correto (prints da usuária) é
  > **"Importar dados"** + **"Criar a partir do ano de"** (dropdown de **ano**, não de plano).

### 1.3 Menu de ações do plano ("…")

Menu contextual por linha (list) e no cabeçalho do detalhe. **O conteúdo muda conforme o nó
seja um plano-pai ou uma versão-filha** 🎥:

| Item                          | Plano-pai | Versão aprovável | Versão não-aprovável\* |
| ----------------------------- | :-------: | :--------------: | :--------------------: |
| Compartilhar plano            |    ✅     |        ✅        |           ✅           |
| Planejado x Realizado         |    ✅     |        ✅        |           ✅           |
| **Iniciar Calibração**        |    ✅     |        ❌        |           ❌           |
| Aprovar Plano                 |    ✅     |        ✅        |           ❌           |
| **Criar cenário desse plano** |    ✅     |        ❌        |           ❌           |
| Exportar CSV                  |    ✅     |        ✅        |           ✅           |
| Excluir Plano                 |    ✅     |        ✅        |           ✅           |

\*🎥 Quando o plano já tem uma versão **Aprovada**, as versões-rascunho **irmãs** deixam de exibir **"Aprovar Plano"**
(observado no menu da versão `1.1` após `1.0` estar aprovada). Ou seja, o menu é **sensível ao estado** (não só pai/filho).

- **Compartilhar plano** — modal "Compartilhar": _"Informe os emails separados por ';' para enviar o link e senha do plano orçamentário"_ + textarea Email + **Compartilhar/Fechar**. (Acesso externo por link + senha.)
- **Planejado x Realizado** — visão de comparação orçado × realizado. **⚠️ Decisão do produto:** atualmente
  **não funciona** no legado; **manter o item/tela como placeholder** na reprodução e **atribuir a função depois**.
- **Iniciar Calibração** — modal _"Iremos duplicar esse plano orçamentário com o nome de: **2026 ETI 2.0**"_ + **Duplicar e Iniciar Calibração**. Cria a **próxima versão maior** (recalibração). Só no plano-pai.
  - **🎥 RBAC:** a ação pode ser **negada por permissão** → alerta _"Você não possui permissão para executar esta ação."_ + **Entendi** (o item aparece no menu, mas executar valida o papel do usuário no servidor).
- **Aprovar Plano** — fluxo em 3 passos 🎥:
  1. **Confirmação:** _"Tem certeza que quer aprovar o Plano Orçamentário '2026 ETI 1.0'?"_ + **Aprovar** / **Cancelar**.
  2. **Processamento assíncrono:** a coluna `TOTAL` de todas as linhas passa a exibir **"Calculando…"** com spinner (recálculo dos totais).
  3. **Sucesso:** toast _"Plano Orçamentário aprovado com sucesso!"_ + **Entendi**; status vira **Aprovado**.
- **Criar cenário desse plano** — modal **"Criar cenário"** 🎥: campo **"Nome do cenário"** (texto livre, ex.: "Teste") + **Criar cenário** / **Cancelar**. (Diferente da Calibração, que auto-nomeia `X.0`.) Só no plano-pai.
- **Exportar CSV** — download.
- **Excluir Plano** — confirmação 🎥: _"Atenção, você está prestes a excluir o plano '2026 ETI 1.1' e seus itens filhos, isso não pode ser desfeito. Tem certeza?"_ + **Excluir plano** (botão **vermelho**) / **Cancelar** → sucesso _"Plano excluído com sucesso!"_ + **Entendi**. (Remoção **em cascata** dos filhos.)
  > Obs.: "Compartilhar plano" aparece **duplicado** no menu (bug/duplicata do legado — não replicar).

### 1.4 Detalhe do plano — `/planejamento/detalhes/:id`

Breadcrumb "Planejamento > Detalhes". Cabeçalho: **`2026 ETI 1.2`** + badge de status · **`Total Plano: R$ 32.438,72`** (à direita).

- **Barra de ações:** filtro de **Rede** + botão **"Filtrar"** · (direita) **"Insights"** (ícone gráfico) · **"Adicionar Orçamento"** · **"…"**.
  - O filtro de Rede depende da granularidade do programa 🎥: programas **estaduais** → só **"Estado"**; programas **municipais** (ex.: EPV) → **"Estado" + "Município"** (em cascata: escolhe o estado, depois o município).
  - **Selecionar a Rede + "Filtrar" habilita o botão "Editar"** (que abre a tela de edição do orçamento — 1.7).
- **Seção consolidada** com 3 **toggles de visão** + navegação de meses (‹ ›):
  1. **Centro de Custo** → abre o **modal de gestão** (ver 1.5).
  2. **Por Mês** ("Consolidado por Mês") → matriz **Centros de Custo × meses** (JAN…DEZ, paginado por semestre). Linhas expansíveis até subcategoria. Linha **TOTAL** ao pé + total por mês.
  3. **Por Rede** ("Consolidado dos parceiros") → matriz **Centros de Custo × Estados** (colunas = estados, ex.: `ACRE`). Total por estado.
- Estrutura em árvore nas linhas: **Centro de Custo (– A PAGAR) → Categoria → Subcategoria**, cada nível com seu subtotal.
- **Views consolidadas são read-only.** A edição de valores só acontece filtrando por 1 estado (ver 1.7).

### 1.5 Modal "Centros de Custo - {Programa}" (gestão da estrutura)

Aberto pelo toggle **"Centro de Custo"**. Título inclui o **programa** (ex.: `Centros de Custo - ETI`,
`Centros de Custo - EPV`) — **a estrutura de centros/categorias é por programa** 🎥.
Subtítulo: _"Gerenciar os centros de custos, categorias e produtos/serviços"_.

- Dropdown **"Centro de Custo"** — lista **todos** os centros do programa e seleciona qual árvore exibir.
  Ex. (programa **EPV**) 🎥: `Consultoria` · `Pessoal` · `Comunicação_Inovação` · `Logística` ·
  `Avaliação externa` · `Eventos` · `Produção de conteúdo` · `Administração`.
  _(No plano ETL/ETI só apareciam 4 centros na matriz porque só esses tinham orçamento.)_
- Botão **"Adicionar centro de custo"** → modal **"Adicionar Centro de custo"** 🎥: `Nome do centro de custo` +
  `Tipo do centro de custo` (dropdown **A PAGAR / A RECEBER**) + **Adicionar Centro de custo** / **Cancelar**
  (mesmos campos do editar).
- **Árvore de 3 níveis** com ações por linha:
  - **Centro de Custo** (ex.: `Consultoria - A PAGAR` **ou** `Consultoria - A RECEBER` 🎥): **+ Categoria** · **Editar** · toggle **Desativar**.
  - **Categoria** — pode ser **numerada** (ex.: `1.1 CONSULTORIA EDUCACIONAL` 🎥; ou `Consultoria Educacional`, `Outras consultorias`): **+ Sub-categoria** · **Editar** · **Desativar**.
  - **Sub-categoria** (ex.: `Formação de professores`, `Formação de formadores`, `Produção de material didático-pedagógico para alunos`, `Formação com os gestores escolares`, `Formação com coordenadores/ supervisores pedagógicos`, `Avaliação`): **Editar** · **Desativar** (folha).
- **Form "Adicionar/Editar Centro de custo":** `Nome do centro de custo` + `Tipo do centro de custo` (**A PAGAR** / **A RECEBER**) + **Salvar/Cancelar**.
- **Form "Adicionar Categoria"** 🎥: apenas `Nome da categoria` + **Adicionar Categoria** / **Cancelar**.
- **Form "Adicionar Sub categoria"** 🎥 — **⚠️ resolve a lacuna do modelo de cálculo:**
  - `Nome da sub-categoria` (texto).
  - **`Tipo`** (dropdown): **`Institucional`** | **`Rede`** — se o gasto é único (institucional) ou replicado por rede (estado/município).
  - **`Tipo de lançamento`** (dropdown): **é o seletor do modelo de cálculo** que a subcategoria usará no modal "Calculando Gastos" (ver 1.8).
    - 💡 **Correspondência com o backend** ("resultados por índice") — **4 modelos confirmados**:
      **Despesas de Pessoal** (=Tipo A/Folha) · **IPCA** (=Tipo B/Valor reajustado) · **CAED** (=Tipo C/Qtd matrículas × custo unitário) · **Despesas de Logística** (=Tipo D/Viagem). Confirmar apenas os rótulos exatos do dropdown.
  - **Adicionar Sub categoria** / **Cancelar**.
    > **A RECEBER é usado de fato** (ex.: `Consultoria - A RECEBER` no programa EPV) — resolve a lacuna anterior.
    > Ex. (programa **PARC**, centro `ADMINISTRAÇÃO - A PAGAR`, categoria `8. ADMINISTRAÇÃO`): subcategorias
    > _Assessoria Jurídica · Locação de imóvel · Luz, água, telefonia e outros · Assessoria Contábil ·
    > Manutenção do escritório e outras despesas · Plataformas de Gestão_.

### 1.6 Ações auxiliares do detalhe

- **Adicionar Orçamento** — modal: dropdown **"Estado"** (autocomplete de estados) + **Adicionar**. Adiciona uma nova **coluna de estado** (orçamento por rede). Validação: _"Atenção! Já existe um orçamento com essas informações."_ (impede duplicar estado).
- **Insights** — modal "Plano Insight": _"Use esses insights para planejar seu plano orçamentário."_
  - **Histórico:** "Média de orçamento nos últimos 5 anos" (R$).
  - Card do ano: **Planejado** · **Realizado** · **Média de N Estados**.
  - 📌 **Origem do "Realizado"** (definido pela P.O.): vem do **Financeiro/Conciliação** — soma dos lançamentos com status **`CONCILIADO`**. (Mesma fonte alimenta "Planejado x Realizado".)

### 1.7 Edição de Orçamento por rede — `/planejamento/detalhes/:id/orcamento/:orcamentoId`

**Fluxo de navegação completo** 🎯 (reforçado pela P.O.):

1. Clicar no plano/versão no **grid** (`/planejamento`) → vai para **Planejamento > Detalhes** (`/planejamento/detalhes/:id`).
2. Preencher a **Rede** (Estado; + **Município** se o programa for municipal) e clicar **"Filtrar"** → **habilita "Editar"**.
3. Clicar **"Editar"** → abre **esta tela** (`.../orcamento/:orcamentoId`), onde se editam os valores orçados **por centro de custo**.

**⚠️ Regra de edição por status (RBAC/estado)** 🎯:
| Status do plano | Edição de valores |
|---|---|
| `Rascunho` | ✅ permitida |
| `Em Calibração` | ✅ permitida |
| `Aprovado` | ❌ **bloqueada** (somente leitura) |

> 🔁 **Para editar um plano Aprovado, inicia-se a Calibração** — isso gera uma nova versão `Em Calibração` (editável);
> ao reaprovar, ela volta a `Aprovado`. Ciclo: `Aprovado` → _Iniciar Calibração_ → `Em Calibração` (edita) → _Aprovar_ → `Aprovado`.

Breadcrumb "Planejamento > Detalhes > Orçamento". Cabeçalho: **`{plano} > {rede}`** (ex.: `2026 EPV 1.0 > Ceará`) · **`Total Orçamento: R$ …`**.

- **Barra:** dropdown **"Centro de Custo"** (lista todos os centros do programa) + **"Filtrar"** · (direita) **"Descartar Alterações"** · **"Salvar"** · **"…"**.
  - Menu **"…"** desta tela 🎥: **Exportar CSV** · **Excluir Orçamento** (ações do orçamento **daquele estado/rede**, não do plano inteiro).
- **Grid editável:** título = centro de custo selecionado · nav de meses (‹ ›) · botão **"Calcular Gasto"** (habilita ao entrar em edição).
  - Colunas: `CATEGORIAS` × meses. Linhas = Categorias → (expande) Subcategorias, com subtotais. Linha total ao pé.
  - **Hover na linha da subcategoria revela um ícone de calculadora** → abre o modal **"Calculando Gastos"** (1.8).

### 1.8 Modal **"Calculando Gastos - {plano} > {estado}"** (calculadora de custo)

Modal full-screen, layout mestre-detalhe de 3 painéis + **abas de Centro de Custo** no topo
(`Consultoria`, `Comunicação`, `Produção De Conteúdo`, `Avaliação Externa` + setas ‹ ›):

1. **Categoria** (lista selecionável).
2. **Subcategoria** (lista selecionável).
3. **Despesas** — Botão info (i) no topo direito.
   - Antes de escolher subcategoria, o painel fica **vazio**.
   - **Ao selecionar uma subcategoria** 🎥, o painel mostra a **lista dos 12 meses** (Janeiro…Dezembro) com os
     valores atuais + ícones **lixeira (limpar mês)** e **lápis (editar mês)**, e um botão **"Calcular"** ao pé.
     _(Comum a TODOS os tipos.)_
   - **Clicar no lápis de um mês abre o formulário de lançamento** — cujo **layout depende do "Tipo de lançamento"
     da subcategoria** (Tipo A/B/C, abaixo), com o mês clicado já pré-selecionado. Botões do form: **Descartar** / **Salvar**.
   - Botões ao pé do modal: **Descartar** / **Salvar**. Descartar pede confirmação
     (_"Você tem certeza que deseja descartar as alterações de gastos?"_ → Cancelar / Descartar alterações).
   - **Subcategorias são heterogêneas por natureza** 🎥 — podem ser **cargos** (ex.: Consultoria Estratégica →
     "Coordenador de Implementação"), **itens descritivos** (ex.: Consultoria Temática → "Consultoria de gênero e raça",
     "2.1 PARCERIA NOVA ESCOLA") ou **UFs/estados** (ex.: `5. AVALIAÇÃO` → `AL, BA, ES, GO, AP, MS, MT, PA, PB, MA, PE, PI, PR, RN, RS, SE…`).

> ⚠️ **Achado central (🎥):** o **formulário de Despesas tem 4 TIPOS diferentes** (= os "resultados por índice" do
> backend: Pessoal · IPCA · CAED · Logística), definidos pelo campo **"Tipo de lançamento" da Sub-categoria**
> (form "Adicionar/Editar Sub categoria", ver 1.5) — **não** pelo Centro de Custo. Ex.: no MESMO centro "Consultoria",
> _Consultoria Educacional_ usa **Tipo A (Folha)** e _Outras consultorias_ usa **Tipo B (IPCA)**.
> O botão **info (i)** do painel Despesas abre um popup **"Memória de cálculo"** que explica a fórmula daquela
> subcategoria 🎥 (ex.: _"Assessoria Contábil — Ajuste X% de IPCA sobre o TOTAL DO ANO ANTERIOR."_).

> ⚠️ **Correção (não presuma o tipo pelo nome):** o `Tipo de lançamento` é **por subcategoria** e não é dedutível
> do nome. Ex. real 🎥: a subcategoria **"Coordenador de Implementação"** (um cargo, em `1. CONSULTORIA ESTRATÉGICA`)
> abre o **form Tipo B (Valor+IPCA)** — não o de folha. Sempre respeitar o `tipoLancamento` configurado.

#### Tipo A — Folha / Pessoal (ex.: ETI › Consultoria Educacional)

Composição de custo de pessoal (quando `tipoLancamento = FOLHA`). Aqui o `Qtd de {subcategoria}` é o **headcount**.

- **Tipo:** `Nível` (Fundamental Completo/Incompleto · Médio · Superior · Pós-graduação · Mestrado · Doutorado) · `Vínculo` (**CLT** / **PJ**).
- **Remuneração Bruta Mensal:** `Qtd de {subcategoria}` (headcount) · `Meses` (**multi-select com chips** — ex.: "Fevereiro ⊗") · `Salário` · `Reajuste (%)` · `Salário Total` (calc).
- **Encargos Mensais (%):** `INSS Patronal` · `INSS` · `FGTS` · `PIS` · `Total Encargos` (calc).
- **Benefícios Mensais:** `Vale Transporte` · `Alimentação` · `Plano de Saúde` · `Seguro de Vida` · `Total Benefícios` (calc).
- **Provisões Mensais:** `Férias + Encargos` · `Abono` · `13º + Encargos` · `FGTS (Multa + Adicional)` · `Total Provisões` (calc).
- **Custo Total:** `Mensal` · `Anual` (calc).
  > Regra: `Qtd × (Salário reajustado + Encargos + Benefícios + Provisões)` nos meses selecionados.

#### Tipo B — Valor reajustado + IPCA (ex.: Outras consultorias, Comunicação, Produção De Conteúdo; PARC › Consultoria Estratégica › "Coordenador de Implementação") 🎥

Seção **"CONFIGURAÇÃO"**:

- Toggle **"Utilizar ano anterior"** — mesma regra do import 🎥: se **existir** orçamento planejado no ano
  anterior (mesma subcategoria), **repete os dados como base**; se **não** existir, **avisa que não há dados**.
  - **Quando LIGADO** 🎥, o form **colapsa** para apenas o toggle + **"APLICAR AOS MESES"** (some `Total reajustado`/`Justificativa`/`IPCA`, pois o valor vem do ano anterior).
- **Quando DESLIGADO:** `Total reajustado` (R$) · `Justificativa` (texto) · `IPCA (%)` · **Custo Total** (R$, calc).
- **"APLICAR AOS MESES":** checkboxes `Todos` + `Janeiro`…`Dezembro` (marca em quais meses replicar o valor).

#### Tipo C — Quantidade × Custo unitário / CAED (ex.: Avaliação Externa) 🎥

- `Qtd. matrículas` (número) · `Custo unitário da formação` (R$).
- **Prévia - Custo Total** (R$, calc = qtd × unitário).
- **"APLICAR AOS MESES":** checkboxes `Todos` + `Janeiro`…`Dezembro`.

#### Tipo D — Logística / Viagem (ex.: EPV › Logística Geral) 🎥

Modelo de custo de viagem. A **categoria** mostra um resumo _"Gastos consolidando todos os tipos de viagem"_
(Passagens Aéreas · Hospedagem · Despesas de viagem). Subcategorias típicas: **Passagens aéreas · Hospedagem · Despesas de viagem**.
Form (seção **CONFIGURAÇÃO**):

- **Valores dos produtos:** `Hospedagem` · `Alimentação` · `Transporte` · `Aluguel carro + combustível` · `Passagem aérea` (R$ cada).
- **Coordenadores estaduais e assistentes:** `Qtd Pessoas`.
- **Diárias (Multiplicador):** `Hospedagem` · `Alimentação` · `Transporte` · `Aluguel carro + combustível` (nº de diárias por produto).
- **Qtd de viagens por mês (passagens aéreas):** 12 campos (Jan…Dez) = nº de viagens no mês.
- **Cards-resumo:** `Passagens Aéreas` · `Hospedagem` · `Despesas` (R$, calc).
  > Regra: custo = Σ(valor do produto × diárias × qtd pessoas) + (passagem aérea × qtd de viagens do mês).

> **Nota de reprodução:** o seletor de meses difere por tipo — Tipo A usa `Meses` (multi-select com chips);
> Tipos B e C usam **checkboxes "APLICAR AOS MESES"** (com "Todos"); Tipo D usa **"Qtd de viagens por mês"** (12 campos numéricos).
> O botão **(i) "Memória de cálculo"** documenta a fórmula da subcategoria em todos os tipos.
> **Asterisco (\*)** em nomes de subcategoria (ex.: `Assessoria Contábil*`) 🟡 — marcação a confirmar (provável: "usa ano anterior").

---

## 2. Submódulo **Consolidado ABC** — `/consolidado`

Relatório consolidado (read-only) que **agrega os planos aprovados** por ano/programa.
Título "Consolidado ABC". Cabeçalho: **`2026 ABC`** · **`Total: R$ 0,00`** (com subtotal por programa: _"Programa ETI: R$ 0,00"_ quando filtrado).

- **Barra de filtros:** `Ano Base` (dropdown 2019–2026) · `Programas` (dropdown: `ETI`, `dsahlkdfshl`) · **"Filtrar"**.
- **Ações (direita):** **"Exportar Excel"** (download) · ícone **Compartilhar** (mesmo modal link+senha por e-mail).
- **Seção "Consolidado dos programas"** + nav de meses (‹ ›):
  - Matriz **Centro de Custo × meses** (JAN…DEZ). Linha **TOTAL: R$ …** no topo e ao pé, com total por mês.
  - Linhas expansíveis: Centro de Custo → Categorias, **com sufixo do programa** entre parênteses
    (ex.: `Consultoria Educacional (ETI)`, `Outras consultorias (ETI)`) — porque agrega múltiplos programas.
- Só reflete valores de **planos Aprovados** (o rascunho `1.2` com R$ 32.438,72 **não** aparece; por isso os totais estavam R$ 0,00).
- **Empty state** 🎥: quando o filtro não retorna nada, a tabela mostra **"Nenhum resultado encontrado"** (linhas TOTAL permanecem em R$ 0,00).

#### Formato do "Exportar Excel"/CSV 📄 (amostra real no repo: [`HANDBOOK-plano-orcamentario-consolidado-abc-export-exemplo.csv`](HANDBOOK-plano-orcamentario-consolidado-abc-export-exemplo.csv))

Colunas: `Centro de Custo` · `Categoria` · `Subcategoria` · `Janeiro`…`Dezembro` · `Total`.
Estrutura de linhas (agrega **até o nível de Categoria**; a coluna Subcategoria fica vazia neste export):

- **Linha de grupo por Centro de Custo:** nome na 1ª coluna, meses vazios, só o `Total` preenchido.
- **Linha por Categoria:** 2ª coluna no formato **`"{n}. {NOME} ({PROGRAMA})"`** (numerada + sufixo do programa), com os **12 valores mensais** + `Total`.
- **Linha final `TOTAL`:** soma por mês + total geral.
- Valores formatados em `R$` pt-BR (ex.: `R$ 10.645.530,00`). Exemplo (2026, todos os programas) → total geral **R$ 25.824.688,03**.
- Centros/categorias observados no PARC 2026 📄: `1. CONSULTORIA ESTRATÉGICA` · `2. CONSULTORIA TEMÁTICA` · `3. CONSULTORIA DE BASE` · `4. LOGÍSTICA` · `5. AVALIAÇÃO` · `6. EVENTOS` · `8. ADMINISTRAÇÃO` (numeração é por centro de custo).
  > Padrões nos dados: categorias com valor **linear** nos 12 meses (ex.: Consultoria Temática ~R$296k/mês) vs.
  > **pontuais** em meses específicos (ex.: Avaliação concentra em Mar/Jun/Set/Nov; Eventos em Abr/Jun/Ago) — reflete os "Aplicar aos meses" dos lançamentos.

---

## 2.5 Confirmações, toasts, estados e permissões (transversal) 🎥

**Padrão de diálogos** — toda ação sensível abre um modal centralizado com ícone (i ou ✓):
| Ação | Confirmação (antes) | Resultado (depois) |
|---|---|---|
| Aprovar Plano | _"Tem certeza que quer aprovar o Plano Orçamentário '{nome}'?"_ — **Aprovar**/Cancelar | toast ✓ _"Plano Orçamentário aprovado com sucesso!"_ — **Entendi** |
| Excluir Plano | _"Atenção, você está prestes a excluir o plano '{nome}' e seus itens filhos, isso não pode ser desfeito. Tem certeza?"_ — **Excluir plano** (vermelho)/Cancelar | toast ✓ _"Plano excluído com sucesso!"_ — **Entendi** |
| Iniciar Calibração | _"Iremos duplicar esse plano orçamentário com o nome de: {X.0}"_ — **Duplicar e Iniciar Calibração** | (nova versão criada) |
| Criar cenário | modal com campo **"Nome do cenário"** — **Criar cenário**/Cancelar | (novo cenário criado) |
| Descartar gastos | _"Você tem certeza que deseja descartar as alterações de gastos?"_ — Cancelar/**Descartar alterações** | (form limpo) |
| Adicionar Orçamento (estado duplicado) | — | alerta (i) _"Atenção! Já existe um orçamento com essas informações."_ — **Entendi** |

- **RBAC / permissões:** ações podem falhar por papel do usuário mesmo com o item visível no menu →
  alerta (i) _"Você não possui permissão para executar esta ação."_ — **Entendi** (visto em _Iniciar Calibração_).
  O front deve tratar a negação vinda do servidor, não esconder/gate só no client.
- **Estados assíncronos (loading):** após _Aprovar_, a coluna `TOTAL` de cada linha mostra
  **"Calculando…"** com spinner até o recálculo terminar. Reproduzir esse estado de carregamento por-linha.
- **Botões de destaque:** primário azul-ciano (`Aprovar`, `Adicionar`, `Salvar`); **destrutivo vermelho** (`Excluir plano`); toasts com botão **Entendi**.

---

## 3. Modelo de dados inferido (para o backend/BFF)

```
Programa (Gestão de Programas) { id, nome, granularidadeRede (ESTADO|MUNICIPIO) }
 └─ PlanoOrcamentario { id, ano, programaId, versao ("1.0"/"1.2"/"2.0"), rotulo ("Inicial"),
                        status (RASCUNHO|EM_CALIBRACAO|APROVADO), total, atualizadoPor, atualizadoEm,
                        planoPaiId (para versões/cenários/calibração), cenarioNome? }
     ├─ Rede vinculada (parceiro = Estado OU Município)  → Orcamento { id, planoId, redeId, total }
     ├─ CentroDeCusto { id, nome, tipo (A_PAGAR|A_RECEBER), ativo }
     │    └─ Categoria { id, nome (pode ter prefixo numérico "8."), ativo }
     │         └─ Subcategoria { id, nome, tipo (INSTITUCIONAL|REDE),
     │                           tipoLancamento (PESSOAL_FOLHA|IPCA|CAED_QTD_UNITARIO|LOGISTICA_VIAGEM), ativo }
     └─ Lancamento/Gasto (por Orcamento × Subcategoria) — POLIMÓRFICO por subcategoria.tipoLancamento:
        tipoA_folha {
            nivel (Fundamental…Doutorado), vinculo (CLT|PJ),
            qtd, meses[], salario, reajustePct, salarioTotal(calc),
            encargos{ inssPatronal, inss, fgts, pis, total(calc) },
            beneficios{ valeTransporte, alimentacao, planoSaude, seguroVida, total(calc) },
            provisoes{ feriasEncargos, abono, decimoTerceiro, fgtsMultaAdicional, total(calc) },
            custoMensal(calc), custoAnual(calc)
        }
        tipoB_valorIpca {
            utilizarAnoAnterior(bool), totalReajustado, justificativa, ipcaPct,
            custoTotal(calc), aplicarAosMeses[] (Todos|Jan…Dez)
        }
        tipoC_qtdUnitario {
            qtdMatriculas, custoUnitarioFormacao, custoTotal(calc),
            aplicarAosMeses[] (Todos|Jan…Dez)
        }
```

- **Subcategoria.`tipoLancamento`** (campo "Tipo de lançamento") seleciona qual formulário/modelo aplicar. 🎥
- **Subcategoria.`tipo`** = `INSTITUCIONAL` (gasto único) | `REDE` (replicado por estado/município). 🎥
- **Status `EM_CALIBRACAO`** = plano em processo de recalibração (entre a duplicação e a nova aprovação).
- **Consolidado ABC** = agregação de `Orcamento`/lançamentos de planos **APROVADOS** por `anoBase` + `programaId[]`.

---

## 4. Notas de UI / design (para reproduzir com fidelidade)

- **Paleta:** azul-ciano primário (botões `Salvar`, `Filtrar`, `Adicionar`, badges), verde para `Aprovado`, cinza para `Rascunho`. Cabeçalhos de tabela em **azul-claro**; linha de **TOTAL** destacada em azul-claro. Linhas expandidas ganham fundo azul-clarinho.
- **Padrões recorrentes:** tabelas com **linhas em árvore expansíveis** (chevron), **toggles de visão** (pílulas), **navegação de meses por setas** (semestre a semestre), **modais** para create/edit/share/insights, **menus "…"** contextuais.
- **Moeda:** `R$ 0,00` (pt-BR). **Meses** por extenso (JANEIRO…DEZEMBRO) nas colunas; nomes normais no calculador.
- **Ações destrutivas/irreversíveis** (Excluir, Descartar, Aprovar) sempre com **modal de confirmação**.
- **Compartilhamento** = envio de **link + senha** por e-mail (não é RBAC interno) — replicar com atenção à segurança (§IX: nada de senha no browser; o BFF deve gerar/gerir o token).

---

---

## 6. Apêndice — árvore de domínio observada (dados reais 🎥)

Estrutura **Centro de Custo → Categoria → Subcategoria** do programa **ETI** (útil como seed de exemplo
e para inferir o `tipoDeCalculo` de cada categoria):

- **Consultoria** (A PAGAR)
  - _Consultoria Educacional_ → **[Tipo A · Folha]** → { Formação de professores · Logística · Formação de formadores }
  - _Outras consultorias_ → **[Tipo B · Valor+IPCA]** → { Consultoria Financeira · Consultoria para construção de sistema de avaliação · Consultoria protocolos COVID }
- **Comunicação** (A PAGAR)
  - _Comunicação_ → **[Tipo B · Valor+IPCA]** → { Manutenção Plataforma ABC · Manutenção SAEV · Melhorias SAEV }
- **Produção De Conteúdo** (A PAGAR)
  - _Produção De Material_ → **[Tipo B · Valor+IPCA]**
  - _Impressão e entrega de material didático-pedagógico_ → **[Tipo B]** → { Transporte do material didático-pedagógico · Impressão de material didático-pedagógico }
- **Avaliação Externa** (A PAGAR)
  - _Avaliação Externa_ → **[Tipo C · Qtd × Custo unitário]** → { CAED · Gráfica · Apoio de coordenação municipal · Transportadora }

**Programa EPV** — o dropdown "Centro de Custo" do modal de gestão lista **8 centros** 🎥:
`Consultoria` · `Pessoal` · `Comunicação_Inovação` · `Logística` · `Avaliação externa` ·
`Eventos` · `Produção de conteúdo` · `Administração`. Exemplo com **A RECEBER**:

- **Consultoria** (A RECEBER)
  - _1.1 CONSULTORIA EDUCACIONAL_ (categoria **numerada**) → { Formação de professores · Formação de formadores · Produção de material didático-pedagógico para alunos · Formação com os gestores escolares · Formação com coordenadores/ supervisores pedagógicos · Avaliação }

> Domínio = programa educacional (ETI/ABC/EPV): consultoria pedagógica, comunicação/plataforma,
> produção de material didático, avaliação externa (matrículas). "SAEV"/"CAED" são entidades do setor.
> A estrutura de centros/categorias **varia por programa** e pode usar **A PAGAR ou A RECEBER** e **numeração** nas categorias.

---

## 7. Lacunas / a validar

- Comportamento exato de **"Calcular"** (Tipo A) e **"Calcular Gasto"** (grid) — provavelmente recalculam/distribuem os totais.
- **"Utilizar ano anterior"** (Tipo B): como puxa a base (do plano do ano anterior do mesmo programa?).
- **"Planejado x Realizado"**: fonte do "Realizado" (integra com Financeiro/Conciliação?). O Insight mostrou `Realizado R$ 11.450.000,00` — origem a confirmar. (No vídeo a usuária não abriu essa tela.)
- **Divergência "Qtd" na folha (§B.3):** a UI mostra `Qtd de {subcategoria}`, mas a fórmula legada de `DESPESAS_PESSOAIS` **não multiplica por quantidade** (é metadado). Confirmar como a UI/tela usa o Qtd (é só rótulo do headcount informativo? multiplica em outro lugar?).
- Significado do **asterisco (\*)** em nomes de subcategoria (ex.: `Assessoria Contábil*`).
- Regra que remove **"Aprovar Plano"** de versões irmãs quando já há uma versão aprovada (no legado, aprovar cenário **promove ao pai** — §B.4).
- **Planejado x Realizado:** manter como placeholder (função a definir — decisão de produto).
- Resolvidos 🎥/📄/🔧: ~~A RECEBER~~ · ~~funil/Pesquise/Status~~ · ~~forms +Categoria/+Sub-categoria~~ · ~~onde se define o tipo de cálculo~~ · ~~os 4 tipos de lançamento~~ · ~~**rótulos literais do "Tipo de lançamento"** (enum `SubCategoryReleaseType`: IPCA/CAED/DESPESAS_PESSOAIS/DESPESAS_LOGISTICAS — §B.2)~~ · ~~**as 4 fórmulas de cálculo** (§B.3)~~ · ~~"Criar a partir do ano de"~~ · ~~"Utilizar ano anterior" (endpoint all-last-year)~~ · ~~(i) Memória de cálculo~~ · ~~export Consolidado ABC~~ · ~~estado/município~~ · ~~origem do Realizado (Financeiro CONCILIADO)~~ · ~~"ABC" = nome da organização~~ · ~~CAED~~.

---

## Apêndice B — Backend legado (fonte do port) 🔧

> **Descoberta:** o módulo existe **completo** no legado v1 em `../ERP-BACKEND` (NestJS/TypeORM), nesta máquina.
> No **core-api (novo)** não há nada além do campo solto `budgetPlanRef` (`varchar(36)` nullable no documento
> financeiro); o módulo `programs` (Programa: ETI/PARC/EPV) já existe e é dependência do plano.
> Dois módulos legados: `src/modules/budget-plans/` (o Plano) e `src/modules/budgets/` (o Orçamento por rede).

### Inventário de endpoints (confirmado)

**budget-plans** — `budget-plans.controller.ts` + `share-budget-plans.controller.ts`:
`GET /` (listar) · `GET options` · `GET /:id` (detalhe) · `GET /:id/insights` · `POST /scenery` (criar cenário) ·
`POST /:id/start-calibration` (iniciar calibração) · `PATCH /:id/approve` (aprovar) · `DELETE /:id` (excluir) ·
`GET|POST /consolidated-result` (Consolidado ABC) · `GET /consolidated-result/csv` · `GET /:id/generate-csv` ·
compartilhamento externo: `POST check-credentials` + variantes `/shared` (`/:id/shared`, `/consolidated-result/shared`,
`/:id/insights/shared`, `…/csv/shared`, `GET /download-file/:filepath`).

**budgets** — `budgets.controller.ts` + `budget-results.controller.ts` (os 4 cálculos):
`POST /ipca` · `POST /caed` · `POST /personal-expenses` · `POST /logistics-expenses` ·
`GET /logistics-expenses/:budgetId/:categoryId` · `GET /all-by-budget-and-sub-category/:budgetId/:subCategoryId` ·
`GET /all-last-year/:budgetId/:subCategoryId` (= "Utilizar ano anterior"/import) · CRUD de budget.

### B.1 Modelo de dados (entities TypeORM)

Todas herdam `AbstractEntity` (`id` PK, `createdAt`, `updatedAt`). Valores monetários em **centavos** (bigint).

- **`budget_plans` (BudgetPlan)** — árvore `materialized-path` (pai + filhos cenário/calibração):
  `year` int · `scenarioName` varchar **null** (só em cenários) · `version` float (1.0 principal; 1.1/1.2 cenário; 2/3 calibração) ·
  `totalInCents` bigint=0 · `status` enum (default `RASCUNHO`) · `programId` FK Program · `updatedById` FK User · `parentId` FK self **null**.
  Relações: `program`, `updatedBy`, `costCenters`(1:N cascade), `budgets`(1:N cascade), `parent`/`children`(tree, CASCADE), `categorization`.
  Índice **ÚNICO `[year, programId, version, parentId]`**.
- **`budgets` (Budget)** — a fatia do plano p/ **um parceiro** (Estado XOR Município):
  `valueInCents` bigint=0 · `budgetPlanId` FK · `partnerStateId` **null** · `partnerMunicipalityId` **null**.
  Índices ÚNICOS `[budgetPlanId, partnerStateId]` e `[budgetPlanId, partnerMunicipalityId]` (1 parceiro por plano).
- **`budget_results` (BudgetResult)** — célula (orçamento × subcategoria × mês):
  `month` 1–12 · `valueInCents` bigint · `budgetId` FK · `costCenterSubCategoryId` FK · `costCenterCategoryId` FK · **`data` JSON** (inputs brutos do cálculo = `BudgetResultData`).
  Índice ÚNICO `[budgetId, costCenterSubCategoryId, month]` → **upsert** por célula.
- **`share_budget_plans` (ShareBudgetPlan)** — credencial externa temporária: `username` · `password` · `budgetPlanIds` (simple-array). Único `[password, username]`. Sem FK.
- **Estrutura de custos** (pendurada no plano): `cost_centers` (`name`, `type`, `active`, `budgetPlanId`) → `cost_centers_categories` (`name`, `active`) → `cost_centers_sub_categories` (`name`, **`type`**, **`releaseType`**, `active`). A **subcategoria** carrega o `releaseType` que decide o cálculo.

**Árvore:** `Program → BudgetPlan[ano+versão, self-tree] → Budget[1/parceiro] → BudgetResult[subcat×mês + JSON]`; em paralelo `BudgetPlan → CostCenter → Categoria → Subcategoria` classifica cada result. `Budget → PartnerState | PartnerMunicipality`.

### B.2 Enums (rótulos LITERAIS — resolve a lacuna do "Tipo de lançamento")

- **`BudgetPlanStatus`**: `RASCUNHO` (default) · `EM_CALIBRACAO` · `APROVADO`.
- **`SubCategoryReleaseType`** (= "Tipo de lançamento"): **`IPCA` · `CAED` · `DESPESAS_PESSOAIS` · `DESPESAS_LOGISTICAS`**.
- **`SubCategoryType`**: `INSTITUCIONAL` · `REDE`.
- **`CostCenterType`** (⚠️ valor ≠ chave): `PAGAR`=`"A PAGAR"` · `RECEBER`=`"A RECEBER"`.
- **`Education`** (folha): `EDUCACAO_INFANTIL`, `ENSINO_FUNDAMENTAL`, `ENSINO_MEDIO`, `ENSINO_SUPERIOR`, `POS_GRADUACAO`, `MESTRADO`, `DOUTORADO`.
- **`EmploymentRelationship`** (folha): `CLT` · `PJ`.
- **`OPTIONS_FOR_UPDATE_BUDGET_PLAN`** = `[RASCUNHO, EM_CALIBRACAO]` — únicos status editáveis.

### B.3 As 4 fórmulas (`common/utils/calc-total-value-result.ts`, tudo em centavos, **sem arredondamento**)

`calcTotalValueInCents(releaseType, item)` — cada mês é independente; total anual = **Σ dos 12 meses** (via SQL SUM).

- **DESPESAS_PESSOAIS (folha):**
  `totalSalary = salary·(1 + salaryAdjustment/100)` ·
  `totalCharges = (inssEmployer+inss+fgtsCharges+pisCharges)/100 · totalSalary` ·
  `totalBenefits = foodVoucher + transportationVouchers + healthInsurance + lifeInsurance` ·
  `totalProvisions = holidaysAndCharges + allowance + thirteenth + fgts` ·
  **`valor = totalSalary + totalCharges + totalBenefits + totalProvisions`**.
  ⚠️ **Não multiplica por quantidade/headcount** — `education`, `employmentRelationship`, `numberOfFinancialDirectors` são **metadados** (gravados no JSON `data`), não entram no total. _(Divergência com o rótulo "Qtd de {subcategoria}" da UI — confirmar como a UI usa isso; ver §1.8.)_
- **IPCA:** `valor = baseValue·(1 + ipca/100)`. `justification` é metadado. "Utilizar ano anterior" ⇒ preenche `baseValue` a partir do endpoint `all-last-year` (não é flag do cálculo).
- **CAED:** `valor = numberOfEnrollments × baseValue` (matrículas × custo unitário).
- **DESPESAS_LOGISTICAS:**
  `tripsOfPeople = numberOfPeople × totalTrips` ·
  `airfare = tripsOfPeople × airfare` ·
  `accommodation = tripsOfPeople × dailyAccommodation × accommodation` ·
  `expenses = tripsOfPeople × (dailyFood×food + dailyTransport×transport + dailyCarAndFuel×carAndFuel)` ·
  **`valor = airfare + accommodation + expenses`** (passagem NÃO multiplica por diária; os demais sim).
- **default** (releaseType não mapeado) = `baseValue` (valor manual cru).

### B.4 Contratos de endpoint (comportamento no service)

**budget-plans:**

- `POST /` cria v1.0 (valida programa ativo + unicidade ano+programa+v1; seed de cost-centers pela `abbreviation`; `yearForImport`→duplica plano APROVADO doutro ano).
- `POST /scenery` duplica como filho RASCUNHO, `version += 0.1`, `scenarioName=name`. Bloqueia se pai APROVADO / já-cenário / ≥2 filhos EM_CALIBRACAO.
- `POST /:id/start-calibration` (só de APROVADO, não-cenário) duplica filho **EM_CALIBRACAO**, `version = pai+1`.
- `GET /` lista raízes (`parentId IS NULL`) + `children` + contagem de parceiros; filtros page/limit/search/year/programId/status.
- `GET options` (só APROVADOS) → `{id, name}`.
- `GET /consolidated-result?year&programId?` = **Consolidado ABC**: soma planos v1 APROVADOS do ano, agrupa cost-centers **por nome**, sufixa categoria com `(abreviação do programa)`.
- `GET /:id/insights` = últimos 5 anos APROVADOS: `totalInCents`, `differenceValueInPercentage = (old−current)/current·100`, `type` up/down, média por parceiros.
- `GET /:id/generate-csv` e `/consolidated-result/csv` **geram o CSV e ENVIAM POR E-MAIL** (assíncrono); `GET /download-file/:filepath` faz o stream (**sem guard**).
- `PATCH /:id/approve` → status APROVADO. **Se for cenário, `copy()` PROMOVE o cenário ao pai** (apaga budgets/cost-centers do pai e reduplica do cenário — destrutivo).
- `DELETE /:id` só em {RASCUNHO, EM_CALIBRACAO} (cascata FK).
- **share:** `POST /share-budget-plans` gera `username`/`password` (`Math.random().toString(36)` — **fraca**) e envia link+senha por e-mail; `check-credentials` (sem guard) valida e **expira em < 1 dia** (403 "Credenciais expiradas").

**budgets / budget-results:**

- `POST /budgets` exige **exatamente 1 parceiro** (XOR estado/município); plano em RASCUNHO/EM_CALIBRACAO; rejeita parceiro duplicado (409).
- `POST /budget-results/{ipca|caed|personal-expenses|logistics-expenses}` → `createMany` com `months[]`; valida subcategoria `active` **e** `releaseType` batendo a rota; **upsert por (budget, subcat, mês)**; recalcula budget→plano por evento.
- `GET /budget-results/all-last-year/:budgetId/:subCategoryId` = base do **"Utilizar ano anterior"** (casa o budget do ano−1 APROVADO por parceiro + nome da subcategoria; hard stop em 2019).
- `GET /budget-results/logistics-expenses/:budgetId/:categoryId` = totais logísticos decompostos.

### B.5 Regras de negócio (para o backend novo e o front)

- **Edição só em `RASCUNHO`/`EM_CALIBRACAO`**; `APROVADO` trava tudo (bate com o observado na UI).
- **Unicidade** ano+programa+v1 → 409 _"Já existe um plano orçamentário com essas informações."_; 1 budget por parceiro/plano; 1 result por (budget, subcat, mês).
- **Recálculo por eventos**: `budgets.process-value` → `budgetPlans.process-value` → grava `totalInCents`. Só subcategorias `active` entram nos SUM.
- **Duplicação encadeada** (cenário/calibração/import): copia cost-centers → budgets → results, casando subcategoria **por nome** (ignora as não encontradas).
- **Segurança do share**: credencial fraca + expira em < 1 dia — **reescrever com segurança na v2** (coerente com decisão de adiar #9).

### B.6 O que o FRONTEND pode ANTECIPAR (adianta backend) ✅

- **(a) Tipos/DTOs já modeláveis** sem esperar o backend: `BudgetPlan/Budget/BudgetResult/ShareBudgetPlan`, os 4 DTOs de result-mês com `months[]`, `Create*`/`Paginate*`/`options`, e a **união discriminada por `releaseType`** do JSON `BudgetResultData`. Fixar já os **enums do §B.2** (labels literais; atenção ao `CostCenterType` valor "A PAGAR"/"A RECEBER").
- **(b) Validações no front já**: `month` 1–12; `months.length` 1–12; **XOR estado×município**; obrigatórios (matrículas/CAED, education+vínculo/folha, e-mails no share); disponibilidade de ações por status (editar/excluir só {RASCUNHO,EM_CALIBRACAO}; aprovar/calibrar/cenário com as travas).
- **(c) Preview de cálculo instantâneo**: as 4 fórmulas são **puras/determinísticas** (aritmética em centavos, sem arredondamento) → o front pode reproduzi-las 1:1 para mostrar o valor da célula/mês em tempo real e as somas (mês/categoria/ano) e insights (%/média), **confirmando no backend** (fonte de verdade). Trabalhar em **centavos** para evitar divergência.
- **Não antecipar** (depende do backend novo): layout final do CSV + `namesForMonths`; como o novo core modela a árvore/versionamento (o `materialized-path` é detalhe do TypeORM legado); o **seed de cost-centers por programa**; e o mecanismo de credencial externa (será substituído).

> **Arquivos-fonte no legado:** fórmulas `../ERP-BACKEND/src/common/utils/calc-total-value-result.ts` · inputs `.../budgets/repositories/typeorm/budget-results-repository.ts` (`BudgetResultData`) · regras de status `.../budget-plans/services/budget-plans.service.ts`.
