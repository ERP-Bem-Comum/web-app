Todos os pontos abertos explorados. Aqui está o documento completo e fechado:

---

```markdown
# reconstructed-spec.md — Módulo: Gestão de Parceiros

> Gerado via reverse-specs a partir de screenshots + read_page (DOM).
> Data da captura: 2026-06-05
> Base URL: https://erp-financeiro-frontend-558775345474.us-central1.run.app

---

## 0. Visão Geral do Módulo

"Gestão de Parceiros" é o módulo de cadastro e gerenciamento das entidades
que se relacionam com a organização. Agrupa 5 sub-módulos acessados pelo
menu lateral (sidebar accordion):

| Sub-módulo       | Rota raiz       | Descrição                                                                  |
|------------------|-----------------|----------------------------------------------------------------------------|
| Colaboradores    | `/colaboradores`| Pessoas físicas vinculadas a programas; cadastro em 2 etapas               |
| Fornecedores     | `/fornecedores` | PJs prestadoras de serviço; inclui dados bancários e PIX                   |
| Financiadores    | `/financiadores`| Entidades financiadoras de programas; CNPJ + representante legal           |
| Estados          | `/estados`      | Seleção de estados brasileiros parceiros (dual-panel)                      |
| Municípios       | `/municipios`   | Seleção de municípios parceiros por estado (dual-panel com filtro de UF)   |

---

## 1. Padrões de UI Compartilhados pelo Módulo

### 1.1 Shell / Layout (herdado do app)

Sidebar colapsada (só ícones ~70px) → hover/click expande (~235px).
"Gestão de Parceiros" é um accordion: ao clicar, expande listando os 5 sub-itens
com indent. Item ativo fica destacado em azul ciano (#00BCD4) com fundo mais escuro.

### 1.2 Padrão "Tela de Listagem"

Usado em: Colaboradores, Fornecedores, Financiadores.

```
┌────────────────────────────────────────────────────────────────┐
│ [Título da Tela]                                               │
│                                                                │
│ [🔽 Filtro?]  [🔍 Pesquise_____________]   [Ação secundária?] [CTA primário] │
│ ┌── Painel de filtros avançados (toggle) ──────────────────┐   │
│ │ [campo1▾] [campo2▾] ... [Filtrar] [Exportar]            │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│  COL1      COL2      COL3      ...      STATUS                 │
│  ────────────────────────────────────────────────             │
│  linha 1   (linha inteira é clicável)                         │
│  linha 2                                                       │
│                                                                │
│          Itens por página: [5▾]    X - Y    [<] [>]           │
└────────────────────────────────────────────────────────────────┘
```

**Componentes fixos:**
- **Busca livre:** `<input type="text">` com label flutuante "Pesquise" + ícone de lupa. Filtro em tempo real (debounce provável).
- **Botão funil:** toggle que expande/colapsa painel de filtros avançados. Presente em Colaboradores e Fornecedores; ausente em Financiadores.
- **CTA primário:** botão ciano no canto superior direito ("Adicionar X").
- **Tabela:** cabeçalhos em ciano/teal maiúsculo, sem borda externa, separadores horizontais entre linhas. **Linha inteira é clicável** e navega para `/[entidade]/detalhes/:id`.
- **Paginação:** select "Itens por página" (5 | 10 | 25) + contador "X - Y" (página atual - total de páginas) + botões `<` `>` (desabilitados nos extremos).

### 1.3 Padrão "Tela de Formulário" (Detalhe / Editar / Adicionar)

```
┌────────────────────────────────────────────────────────────────┐
│ [←]  [Entidade] > [Detalhes | Editar | Adicionar]             │
│                                                                │
│ ┌──── FormCard (branco, sombra, border-radius ~12px) ───────┐  │
│ │  Seção (opcional)                                         │  │
│ │  [Campo]  [Campo]  [Campo]  [Campo]   ← grid 4 cols       │  │
│ │  [Campo]  [Campo largo ─────────────]                     │  │
│ │  ...                                                      │  │
│ │  [Desativar?]           [Cancelar/Voltar]  [Salvar/Editar]│  │
│ └───────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

- **Botão voltar:** `←` quadrado com border-radius, fundo azul ciano, ícone chevron branco. Posicionado no canto superior esquerdo, inline com o breadcrumb.
- **Breadcrumb:** `"Entidade > Modo"` — ex: "Financiadores > Detalhes", "Colaboradores > Adicionar".
- **Campos:** estilo Material — label flutuante (sobe ao foco ou preenchimento), borda inferior ou box com borda.
- **Grid de campos:** 4 colunas na linha principal; campos de endereço/texto longo ocupam 2–4 colunas.
- **Botões de ação no rodapé do FormCard:**

| Modo | Botões |
|---|---|
| Detalhe | [Voltar] outline + [Editar] ciano |
| Editar | [Desativar] vermelho-coral (esquerda) + [Cancelar] outline + [Salvar] ciano (submit) |
| Adicionar | [Cancelar] outline + [Adicionar] ciano (submit) |

### 1.4 Status Badge

| Valor    | Aparência                                              |
|----------|--------------------------------------------------------|
| Ativo    | Pill com borda fina, fundo branco, texto "Ativo"       |
| Inativo  | Pill cinza escuro sólido (#757575), texto branco       |

### 1.5 Loading State

Spinner circular ciano centralizado na área de conteúdo, substituindo tabela/formulário.
Header (busca + CTA) e rodapé de paginação já aparecem durante o loading.

### 1.6 Modal de Confirmação de Cancelamento de Edição

Disparado ao clicar **[Cancelar]** no modo Editar:

```
┌──────────────────────────────────────────────────┐
│         ℹ️  (ícone info, círculo ciano)           │
│                                                  │
│  Ao confirmar essa opção todas as suas           │
│  alterações serão perdidas.                      │
│                                                  │
│  [ Sim, Descartar alterações ]  ← ciano          │
│  [ Não Descartar alterações  ]  ← outline        │
└──────────────────────────────────────────────────┘
```
- Backdrop escuro semi-transparente.
- Card branco centralizado, border-radius ~12px.

### 1.7 Modal de Confirmação de Desativação

Disparado ao clicar **[Desativar]** no modo Editar:

```
┌──────────────────────────────────────────────────┐
│         ℹ️  (ícone info, círculo ciano)           │
│                                                  │
│  Você está prestes a desativar o                 │
│  [tipo] [Nome do registro]. Tem certeza          │
│  que deseja continuar?                           │
│                                                  │
│  [ Não desativar    ]  ← ciano (ação segura)     │
│  [ Sim, tenho certeza ]  ← outline (destrutivo)  │
└──────────────────────────────────────────────────┘
```
- Mesmo estilo do modal de cancelamento.
- O texto é dinâmico: inclui o tipo da entidade e o nome do registro.
- **Inversão intencional de hierarquia:** o botão de segurança ("Não desativar") é ciano (destaque), e o de confirmação destrutiva ("Sim, tenho certeza") é outline — padrão que protege contra clique acidental.

### 1.8 Padrão "Dual-Panel"

Usado em: Estados, Municípios.

```
┌──────────────────────────┬──────────────────────────────────┐
│  Lista Geral de X        │  X Parceiros Adicionados         │
│                          │                                  │
│  [🔍 Procurar X]         │  [🔍 Procurar X]                 │
│                          │                                  │
│  ITEM         ADD        │  ITEM            REMOVER         │
│  ──────────────────      │  ───────────────────────────     │
│  Item A     [+] verde    │  Item Z    [-] vermelho/coral    │
│  Item B     [+] verde    │                                  │
│  Item Z   "Adicionado"   │                                  │
└──────────────────────────┴──────────────────────────────────┘
```
- **Painel esquerdo:** fonte completa de itens, scrollável, sem paginação.
- **Painel direito:** itens selecionados.
- **ADD (`+`):** ícone `+` em círculo verde → move item para direita, substitui o `+` por texto cinza "Adicionado" na esquerda.
- **REMOVER (`−`):** ícone `−` em círculo vermelho/coral → remove da direita, restaura `+` na esquerda.
- **Ambas as buscas** filtram independentemente seus painéis (reativas, sem botão confirmar).
- **Sem botão "Salvar"** explícito: operações são imediatas (chamada de API a cada ação).

---

## 2. Sub-módulo: Colaboradores

### 2.1 Rotas

| Tela        | Rota                              |
|-------------|-----------------------------------|
| Listagem    | `/colaboradores`                  |
| Detalhe     | `/colaboradores/detalhes/:id`     |
| Editar      | `/colaboradores/editar/:id`       |
| Adicionar   | `/colaboradores/adicionar`        |

### 2.2 Listagem — `/colaboradores`

**Colunas da tabela:**

| Coluna              | Tipo   | Notas                                                                   |
|---------------------|--------|-------------------------------------------------------------------------|
| REPRESENTANTE LEGAL | texto  | Nome completo do colaborador                                            |
| EMAIL               | texto  | E-mail pessoal ou institucional                                         |
| ÁREA DE ATUAÇÃO     | texto  | Código do programa: "EPV", "PARC", etc.                                 |
| CONTRATOS/ADITIVOS  | —      | Coluna visível, aparece vazia — reservada para contagem de contratos vinculados |
| FUNÇÃO              | texto  | "Diretor de Programa", "Analista de Avaliação", "Diretor de Programa Adjunto" |
| STATUS              | duplo  | Badge (Ativo/Inativo) + texto abaixo (Cadastrado / Pré Cadastrado)      |

Total de registros no ambiente: **41** (paginação 1–41, 5 por página = ~9 páginas).

**Ações no header:**

| Elemento              | Tipo    | Comportamento                                      |
|-----------------------|---------|----------------------------------------------------|
| Botão funil           | toggle  | Expande/colapsa painel de filtros avançados        |
| Pesquise              | input   | Busca livre em tempo real                          |
| Importar CSV/Excel    | button outline | Dispara `<input type="file">` oculto        |
| Adicionar Colaborador | button ciano  | Navega para `/colaboradores/adicionar`       |

**Painel de Filtros Avançados (toggle):**

| Campo                  | Tipo             | Opções / Notas                              |
|------------------------|------------------|---------------------------------------------|
| Escolaridade           | combobox         | —                                           |
| Raça                   | combobox         | —                                           |
| Ano de Contratação     | date picker      | Spinner de ano + ícone de calendário        |
| Desativado por         | combobox         | —                                           |
| Programa               | combobox         | —                                           |
| Função                 | combobox         | —                                           |
| Identidade de Gênero   | combobox         | —                                           |
| Status                 | combobox         | Ativo / Inativo                             |
| Situação Cadastral     | combobox         | Cadastrado / Pré Cadastrado                 |
| Idade                  | number input     | —                                           |
| Vínculo Empregatício   | combobox         | PJ, CLT (inferido)                          |
| [Filtrar]              | button ciano     | Aplica todos os filtros combinados          |
| [Exportar]             | button outline   | Exporta resultado (formato .xlsx provável)  |

### 2.3 Detalhe — `/colaboradores/detalhes/:id`

Breadcrumb: **"Colaboradores > Detalhes"**

**Seção 1 — "Dados pré-preenchidos pela ABC:"**
*(campos somente-leitura no modo Detalhe; editáveis em Editar)*

| Campo               | Tipo                           | Exemplo                                        |
|---------------------|--------------------------------|------------------------------------------------|
| Representante Legal | text                           | "Agatha Francisco"                             |
| Email               | text                           | "agatha-francisco@tuamaeaquelaursa.com"        |
| Área de atuação     | combobox                       | "EPV"                                          |
| Função              | combobox                       | "Analista de Avaliação"                        |
| Início de Contrato  | date picker (DD/MM/AAAA)       | "01/01/2024"                                   |
| Vínculo Empregatício| combobox                       | "PJ"                                           |
| CPF                 | text com máscara               | "030.700.460-02"                               |

**Seção 2 — "Complete seu cadastro:"**
*(campos complementares — preenchíveis pelo próprio colaborador)*

| Campo                        | Tipo                       | Notas                                        |
|------------------------------|----------------------------|----------------------------------------------|
| RG                           | text                       | —                                            |
| Endereço completo            | text (largo)               | Ocupa ~50% da linha                          |
| Data de nascimento           | date picker                | —                                            |
| Celular                      | text com máscara           | —                                            |
| Nome contato de emergência   | text                       | —                                            |
| Número contato de emergência | text                       | —                                            |
| Identidade de gênero         | combobox                   | —                                            |
| Raça/Cor                     | combobox                   | —                                            |
| Possui Alergia               | combobox                   | "Sim" / "Não"                                |
| Alergias                     | text                       | Habilitado condicionalmente (Possui Alergia = Sim) |
| Categoria alimentar          | combobox                   | —                                            |
| Escolaridade                 | combobox                   | —                                            |
| Experiência no setor público | combobox                   | "Sim" / "Não"                                |
| Mini biografia               | textarea                   | Placeholder "Digite aqui …", máx. 500 chars  |

**Botões:** [Voltar] outline → listagem | [Editar] ciano → `/colaboradores/editar/:id`

### 2.4 Editar — `/colaboradores/editar/:id`

Mesmos campos do Detalhe, todos habilitados.

**Botões:** [Desativar] vermelho-coral + [Cancelar] outline + [Salvar] ciano (submit)

- [Cancelar] → abre **Modal de Confirmação de Cancelamento**
- [Desativar] → abre **Modal de Confirmação de Desativação**

### 2.5 Adicionar — `/colaboradores/adicionar`

Breadcrumb: **"Colaboradores > Adicionar"**
Título interno: **"Pré-Cadastro de colaborador(a)"**

Formulário reduzido: **apenas a Seção 1** (7 campos).

**Botões:** [Cancelar] outline | [Adicionar] ciano (submit)

---

## 3. Sub-módulo: Fornecedores

### 3.1 Rotas

| Tela      | Rota                           |
|-----------|--------------------------------|
| Listagem  | `/fornecedores`                |
| Detalhe   | `/fornecedores/detalhes/:id`   |
| Editar    | `/fornecedores/editar/:id`     |
| Adicionar | `/fornecedores/adicionar`      |

### 3.2 Listagem — `/fornecedores`

**Colunas da tabela:**

| Coluna             | Tipo  | Notas                                                          |
|--------------------|-------|----------------------------------------------------------------|
| NOME               | texto | Nome fantasia ou razão social                                  |
| EMAIL              | texto | —                                                              |
| CNPJ               | texto | Formatado XX.XXX.XXX/XXXX-XX                                   |
| CONTRATOS/ADITIVOS | —     | Aparece vazia — reservada para contagem de contratos vinculados |
| STATUS             | badge | Ativo / Inativo                                                |

Total: ~15 registros (paginação 1-3 páginas).

**Ações no header:** botão funil + campo Pesquise + botão **"Adicionar Fornecedores"** ciano.

**Painel de Filtros Avançados (toggle):**

| Campo                  | Tipo    | Opções                                              |
|------------------------|---------|-----------------------------------------------------|
| Status de contrato:    | combobox| Possuem contratos / Não possuem contratos / Contratos em vigência |
| Status do fornecedor:  | combobox| Ativo / Inativo                                     |
| Categoria de serviço:  | combobox| Água, Alimentação, Ar condicionado, Assessoria, Auditoria Externa, Buffet, Compras e suprimentos, Consultoria, Contábeis, Material de Consumo, Material de Informática, Material de Limpeza, Material Expediente, Obras, Organização de eventos, Pintura, Produção, Reserva de Hospedagem, Segurança, Serviços Administrativos, Transporte, Vidraçaria |
| [Filtrar]              | button ciano | Aplica filtros                                 |
| [Exportar]             | button outline | Exporta resultado                            |

### 3.3 Detalhe — `/fornecedores/detalhes/:id`

Breadcrumb: **"Fornecedores > Detalhes"**
Formulário em 3 seções:

**Seção 1 — "Dados cadastrais do fornecedor:"**

| Campo                  | Tipo      | Exemplo               |
|------------------------|-----------|-----------------------|
| Nome                   | text      | "Banco Bradesco S.A." |
| E-mail                 | text      | "nicole.ruivo@going2.com.br" |
| CNPJ                   | text (máscara) | "60.746.948/0001-12" |
| Razão Social           | text      | "Banco Bradesco S.A." |
| Nome Fantasia          | text      | "Banco Bradesco S.A." |
| Categoria de Serviço   | combobox  | (ver lista acima)     |
| Avaliação De Serviço   | combobox  | —                     |
| Comentário da Avaliação| text      | —                     |

**Seção 2 — "Dados Bancários:"**

| Campo       | Tipo     | Exemplo   |
|-------------|----------|-----------|
| Banco       | combobox | — (logo do banco exibido ao selecionar) |
| Agência - DV| text     | "0288-7"  |
| Número da Conta | text | "0476781" |
| DV          | text     | "0"       |

**Seção 3 — "Dados PIX:"**

| Campo        | Tipo     | Opções / Exemplo                                           |
|--------------|----------|------------------------------------------------------------|
| Tipo de chave| combobox | CPF, CNPJ, Email, Telefone, Chave aleatória (inferido)    |
| Chave PIX    | text     | "472.697.718-04"                                           |

**Botões (Detalhe):** [Voltar] | [Editar]

### 3.4 Editar — `/fornecedores/editar/:id`

Mesmos campos, habilitados. **Botões:** [Desativar] + [Cancelar] + [Salvar]

### 3.5 Adicionar — `/fornecedores/adicionar`

Breadcrumb: **"Fornecedor > Adicionar"** *(singular — inconsistência com a listagem)*
Mesmo formulário completo (3 seções), campos vazios.
**Botões:** [Cancelar] | [Adicionar]

---

## 4. Sub-módulo: Financiadores

### 4.1 Rotas

| Tela      | Rota                            |
|-----------|---------------------------------|
| Listagem  | `/financiadores`                |
| Detalhe   | `/financiadores/detalhes/:id`   |
| Editar    | `/financiadores/editar/:id`     |
| Adicionar | `/financiadores/adicionar`      |

### 4.2 Listagem — `/financiadores`

**Colunas:**

| Coluna             | Tipo  | Exemplo               |
|--------------------|-------|-----------------------|
| NOME               | texto | "Financiador 1"       |
| REPRESENTANTE LEGAL| texto | "Anderson"            |
| CNPJ               | texto | "08.779.584/0001-57"  |
| STATUS             | badge | Ativo / Inativo       |

Total: 5 registros (1 página). Sem painel de filtros.

**Ações no header:** campo Pesquise + botão **"Adicionar Financiadores"** ciano.

### 4.3 Detalhe — `/financiadores/detalhes/:id`

Breadcrumb: **"Financiadores > Detalhes"**
Formulário sem seção nomeada:

| Campo               | Tipo         | Exemplo              |
|---------------------|--------------|----------------------|
| Nome do Financiador | text         | "Financiador 1"      |
| Razão Social        | text         | "Financiador 1"      |
| CNPJ                | text (máscara)| "08.779.584/0001-57"|
| Telefone            | text (máscara)| "(15)99721-3285"   |
| Representante Legal | text         | "Anderson"           |
| Endereço            | text (largo) | "Rua Dionísio, 1"   |

Layout: linha 1 = 4 colunas (Nome, Razão Social, CNPJ, Telefone); linha 2 = 2 campos (Rep. Legal + Endereço largo).

**Botões (Detalhe):** [Voltar] | [Editar]

### 4.4 Editar — `/financiadores/editar/:id`

Mesmos campos, habilitados.

**Botões:** [Desativar] + [Cancelar] + [Salvar]

- [Cancelar] → Modal: *"Ao confirmar essa opção todas as suas alterações serão perdidas."* → [Sim, Descartar alterações] | [Não Descartar alterações]
- [Desativar] → Modal: *"Você está prestes a desativar o financiador [Nome]. Tem certeza que deseja continuar?"* → [Não desativar] ciano | [Sim, tenho certeza] outline

### 4.5 Adicionar — `/financiadores/adicionar`

Breadcrumb: **"Financiadores > Adicionar"**
Mesmo formulário, campos vazios. **Botões:** [Cancelar] | [Adicionar]

---

## 5. Sub-módulo: Estados Parceiros

### 5.1 Rota única: `/estados`

### 5.2 Layout e Comportamento

Dual-panel, sem rotas filhas:

**Painel Esquerdo — "Lista Geral de Estados"**
- Busca: text "Procurar Estado" + ícone lupa azul
- Tabela 2 colunas: **ESTADOS** | **ADD**
- 27 estados ordenados alfabeticamente: Acre → Tocantins
- Estado disponível: botão `+` círculo verde
- Estado já adicionado: texto cinza "Adicionado" (sem botão)

**Painel Direito — "Estados Parceiros Adicionados"**
- Busca: text "Procurar Estado" + ícone lupa azul
- Tabela 2 colunas: **ESTADOS** | **REMOVER**
- Botão `−` círculo vermelho/coral por linha

**Operações (sem botão Salvar — imediatas via API):**
- `+` → adiciona estado, muda para "Adicionado" no painel esquerdo
- `−` → remove estado, restaura `+` no painel esquerdo

Dado observado: 1 estado adicionado (Acre).

---

## 6. Sub-módulo: Municípios Parceiros

### 6.1 Rota única: `/municipios`

### 6.2 Layout e Comportamento

Mesmo padrão dual-panel de Estados, com diferença no painel esquerdo.

**Painel Esquerdo — "Lista Geral de Municípios"**
- **Filtro de UF:** combobox "Selecionar Estado" com autocomplete (digitar filtra as opções). Ao selecionar, aparece botão `×` para limpar. **Obrigatório** para listar municípios.
- Busca: text "Procurar Município" + ícone lupa azul
- Estado sem UF selecionada: mensagem **"Nenhum resultado encontrado"**
- Estado com UF selecionada: lista os municípios daquele estado com botão `+` ou "Adicionado"

**Painel Direito — "Municípios Parceiros Adicionados"**
- Busca: text "Procurar Município" + ícone lupa azul
- Tabela 2 colunas: **MUNICÍPIOS** | **REMOVER**
- Botão `−` círculo vermelho/coral por linha

**Comportamento do filtro de estado:**
- Combobox com autocomplete (pesquisa por digitação)
- Ao selecionar um estado, carrega assincronamente os municípios daquele estado
- Municípios já adicionados em qualquer estado aparecem como "Adicionado" na lista geral (cross-state)
- Botão `×` limpa a seleção e volta ao estado "Nenhum resultado encontrado"

Dados observados: UF Amazonas selecionada → lista: Alvarães, Amaturá, Anamã (Adicionado), Anori, Apuí... | Município adicionado: Anamã (AM).

---

## 7. Modelo de Dados Implícito

```typescript
// ── COLABORADOR ─────────────────────────────────────────────────
interface Colaborador {
  id: number;

  // Pré-cadastro (preenchido pelo admin/ABC)
  representanteLegal: string;
  email: string;
  areaAtuacao: string;              // "EPV" | "PARC" | ...
  funcao: string;                   // "Diretor de Programa" | "Analista de Avaliação" | ...
  inicioContrato: string;           // ISO date
  vinculoEmpregaticio: string;      // "PJ" | "CLT" | ...
  cpf: string;                      // formatado XXX.XXX.XXX-XX

  // Cadastro complementar (preenchido pelo colaborador)
  rg?: string;
  enderecoCompleto?: string;
  dataNascimento?: string;          // ISO date
  celular?: string;
  nomeContatoEmergencia?: string;
  numeroContatoEmergencia?: string;
  identidadeGenero?: string;
  racaCor?: string;
  possuiAlergia?: boolean;
  alergias?: string;                // condicional: possuiAlergia === true
  categoriaAlimentar?: string;
  escolaridade?: string;
  experienciaSetorPublico?: boolean;
  miniBiografia?: string;           // máx. 500 chars

  // Metadata
  status: 'Ativo' | 'Inativo';
  situacaoCadastral: 'Cadastrado' | 'Pré Cadastrado';
}

// ── FORNECEDOR ──────────────────────────────────────────────────
interface Fornecedor {
  id: number;
  nome: string;
  email: string;
  cnpj: string;                     // formatado XX.XXX.XXX/XXXX-XX
  razaoSocial: string;
  nomeFantasia?: string;
  categoriaServico?: CategoriaServico;
  avaliacaoServico?: string;
  comentarioAvaliacao?: string;

  // Dados bancários
  banco?: string;
  agenciaDv?: string;               // "0288-7"
  numeroConta?: string;
  dv?: string;

  // PIX
  tipoChavePix?: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Chave aleatória';
  chavePix?: string;

  // Metadata
  status: 'Ativo' | 'Inativo';
}

type CategoriaServico =
  | 'Água' | 'Alimentação' | 'Ar condicionado' | 'Assessoria'
  | 'Auditoria Externa' | 'Buffet' | 'Compras e suprimentos' | 'Consultoria'
  | 'Contábeis' | 'Material de Consumo' | 'Material de Informática'
  | 'Material de Limpeza' | 'Material Expediente' | 'Obras'
  | 'Organização de eventos' | 'Pintura' | 'Produção'
  | 'Reserva de Hospedagem' | 'Segurança' | 'Serviços Administrativos'
  | 'Transporte' | 'Vidraçaria';

// ── FINANCIADOR ─────────────────────────────────────────────────
interface Financiador {
  id: number;
  nomeFinanciador: string;
  razaoSocial: string;
  cnpj: string;
  telefone?: string;
  representanteLegal: string;
  endereco?: string;
  status: 'Ativo' | 'Inativo';
}

// ── ESTADO PARCEIRO ─────────────────────────────────────────────
interface EstadoParceiro {
  sigla: string;                    // "AC" | "AL" | ... (27 estados)
  nome: string;                     // "Acre" | "Alagoas" | ...
  adicionado: boolean;
}

// ── MUNICÍPIO PARCEIRO ──────────────────────────────────────────
interface MunicipioParceiro {
  id: number;
  nome: string;                     // "Anamã"
  estadoSigla: string;              // "AM"
  adicionado: boolean;
}
```

---

## 8. Comportamentos e Interações

### 8.1 Fluxo CRUD padrão (Colaboradores / Fornecedores / Financiadores)

```
Listagem
  ├── [Adicionar X] → /[entidade]/adicionar
  │     ├── preenche campos
  │     ├── [Cancelar] → volta à listagem (sem modal)
  │     └── [Adicionar] submit → persiste → redireciona à listagem
  │
  └── click na linha (qualquer célula) → /[entidade]/detalhes/:id
        ├── [Voltar] → volta à listagem
        └── [Editar] → /[entidade]/editar/:id
              ├── [Cancelar] → Modal "Descartar alterações?"
              │     ├── [Sim, Descartar] → /[entidade]/detalhes/:id
              │     └── [Não Descartar] → fecha modal, permanece em edição
              ├── [Salvar] submit → persiste → /[entidade]/detalhes/:id
              └── [Desativar] → Modal "Tem certeza?"
                    ├── [Não desativar] → fecha modal
                    └── [Sim, tenho certeza] → desativa → comportamento pós-desativação não confirmado
                                               (provável: volta à listagem com status Inativo)
```

### 8.2 Coluna CONTRATOS/ADITIVOS

A coluna aparece vazia em todos os registros observados. A linha inteira é clicável (não apenas colunas específicas), então clicar em qualquer célula — incluindo esta coluna — navega para o detalhe da entidade. A coluna parece reservada para exibir futuramente uma contagem de contratos vinculados.

### 8.3 Paginação

- Select "Itens por página": 5 | 10 | 25
- Contador "X - Y": X = página atual, Y = total de páginas (ex: "1 - 3" = página 1 de 3)
- Botões `<` e `>`: desabilitados nos extremos (primeira e última página)

### 8.4 Importar CSV/Excel (Colaboradores)

- Botão "Importar CSV/Excel" → dispara `<input type="file" ref_20>` oculto no DOM
- Aceita .csv e .xlsx (inferido pelo label)
- Fluxo pós-upload não explorado

### 8.5 Dual-Panel (Estados / Municípios)

- ADD: ação imediata via API (sem botão Salvar)
- REMOVER: ação imediata via API
- Buscas independentes e reativas nos dois painéis
- Municípios: combobox de estado com autocomplete; campo obrigatório para listar municípios disponíveis; botão `×` limpa seleção

---

## 9. Rotas Mapeadas (Completo)

| Módulo         | Tela       | Rota                                  | Acesso                      |
|----------------|------------|---------------------------------------|-----------------------------|
| Colaboradores  | Listagem   | `/colaboradores`                      | Menu sidebar                |
| Colaboradores  | Detalhe    | `/colaboradores/detalhes/:id`         | Click na linha              |
| Colaboradores  | Editar     | `/colaboradores/editar/:id`           | Botão "Editar"              |
| Colaboradores  | Adicionar  | `/colaboradores/adicionar`            | Botão "Adicionar Colaborador"|
| Fornecedores   | Listagem   | `/fornecedores`                       | Menu sidebar                |
| Fornecedores   | Detalhe    | `/fornecedores/detalhes/:id`          | Click na linha              |
| Fornecedores   | Editar     | `/fornecedores/editar/:id`            | Botão "Editar"              |
| Fornecedores   | Adicionar  | `/fornecedores/adicionar`             | Botão "Adicionar Fornecedores"|
| Financiadores  | Listagem   | `/financiadores`                      | Menu sidebar                |
| Financiadores  | Detalhe    | `/financiadores/detalhes/:id`         | Click na linha              |
| Financiadores  | Editar     | `/financiadores/editar/:id`           | Botão "Editar"              |
| Financiadores  | Adicionar  | `/financiadores/adicionar`            | Botão "Adicionar Financiadores"|
| Estados        | Único      | `/estados`                            | Menu sidebar                |
| Municípios     | Único      | `/municipios`                         | Menu sidebar                |

---

## 10. Breakdown de Componentes (React 19 / TanStack Start)

```
GestaoParceiroModule
│
├── [SHARED — usáveis em todo o módulo]
│   ├── SearchBar                    props: placeholder, onChange
│   ├── FilterToggleButton           props: isOpen, onToggle
│   ├── DataTable                    props: columns, rows, onRowClick
│   │   ├── TableHeader
│   │   ├── TableRow (clickable)
│   │   └── TableCell
│   ├── StatusBadge                  props: status: 'Ativo'|'Inativo'
│
