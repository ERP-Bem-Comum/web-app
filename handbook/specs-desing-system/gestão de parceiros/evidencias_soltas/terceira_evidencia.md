Coleta completa! Aqui está o `reconstructed-spec.md` do módulo inteiro:

---

```markdown
# reconstructed-spec.md — Módulo: Gestão de Parceiros

> Gerado via reverse-specs a partir de screenshots + read_page (DOM).
> Data da captura: 2026-06-05
> Base URL: https://erp-financeiro-frontend-558775345474.us-central1.run.app

---

## 0. Visão Geral do Módulo

"Gestão de Parceiros" é o módulo de cadastro e gerenciamento das entidades
que se relacionam com a organização. Agrupa 5 sub-módulos, acessados pelo
menu lateral (sidebar) com accordion:

| Sub-módulo | Rota raiz | Descrição |
|---|---|---|
| Colaboradores | `/colaboradores` | Pessoas físicas vinculadas a programas; cadastro em 2 etapas (pré + complemento) |
| Fornecedores | `/fornecedores` | Pessoas jurídicas prestadoras de serviço; inclui dados bancários e PIX |
| Financiadores | `/financiadores` | Entidades financiadoras de programas; CNPJ + representante legal |
| Estados | `/estados` | Seleção de estados brasileiros parceiros (dual-panel) |
| Municípios | `/municipios` | Seleção de municípios parceiros por estado (dual-panel com filtro de UF) |

---

## 1. Padrões de UI Compartilhados pelo Módulo

### 1.1 Shell / Layout (herdado do app)

Sidebar colapsada (só ícones) → hover/click expande. Item "Gestão de Parceiros"
é um accordion que, ao expandir, exibe os 5 sub-itens. O item ativo fica
destacado em azul ciano (#00BCD4).

### 1.2 Padrão "Tela de Listagem" (usado em Colaboradores, Fornecedores, Financiadores)

```
┌────────────────────────────────────────────────────────────────┐
│ [Título da Tela]                                               │
│                                                                │
│ [🔽 Filtros?] [🔍 Pesquise___________________]  [Ações CTA]   │
│ (filtros expansíveis conforme o módulo)                        │
│                                                                │
│ COL1      COL2      COL3      ...     STATUS                   │
│ ──────────────────────────────────────────────                 │
│ linha 1                                                        │
│ linha 2                                                        │
│ ...                                                            │
│                                                                │
│            Itens por página: [5▾]    X - Y    [<] [>]         │
└────────────────────────────────────────────────────────────────┘
```

**Componentes da listagem:**
- Campo de busca: `<input type="text">` com ícone de lupa, label flutuante "Pesquise"
- Botão filtro (funil): toggle que expande/colapsa painel de filtros avançados
- CTA primário: botão azul ciano, canto superior direito ("Adicionar X")
- Tabela: cabeçalhos em ciano/teal maiúsculo, sem borda externa, divisórias horizontais entre linhas
- Click na linha: navega para `/[entidade]/detalhes/[id]`
- Paginação: select "Itens por página" (opções: 5, 10, 25) + contador "X - Y" + botões < >
- Status badge: pill com borda (Ativo = borda verde/sem fill especial, texto "Ativo") ou pill cinza sólido (Inativo)

### 1.3 Padrão "Tela de Detalhe/Formulário"

```
┌────────────────────────────────────────────────────────────────┐
│ [← ]  [Entidade] > [Detalhes | Editar | Adicionar]            │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │  Seção (opcional)                                        │  │
│ │  [Campo label]  [Campo label]  [Campo label]  [Campo]    │  │
│ │  [Campo label]  [Campo label (largo)]                    │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│         [Desativar?]        [Cancelar/Voltar]  [Salvar/Editar] │
└────────────────────────────────────────────────────────────────┘
```

- Botão voltar: `←` quadrado com border-radius, azul claro/ciano no canto superior esquerdo
- Breadcrumb no título: "Entidade > Modo" (modo = Detalhes | Editar | Adicionar)
- Campos: Material-style com label flutuante acima da borda
- Grid: 4 colunas na linha principal, campo largo (Endereço, etc.) ocupa 2 ou 4 colunas
- Botões de ação no rodapé do card:
  - **Modo Detalhe**: [Voltar] outline + [Editar] ciano
  - **Modo Editar**: [Desativar] vermelho-coral (esquerda) + [Cancelar] outline + [Salvar] ciano (submit)
  - **Modo Adicionar**: [Cancelar] outline + [Adicionar] ciano

### 1.4 Modal de Confirmação de Descarte

Aparece ao clicar "Cancelar" no modo edição:

```
┌──────────────────────────────────────────┐
│          ℹ️ (ícone info ciano)           │
│                                          │
│  Ao confirmar essa opção todas           │
│  as suas alterações serão perdidas.      │
│                                          │
│  [Sim, Descartar alterações]  ← ciano   │
│  [Não Descartar alterações]   ← outline │
└──────────────────────────────────────────┘
```

### 1.5 Status Badge

| Status | Aparência |
|---|---|
| Ativo | Pill com borda fina, fundo branco, texto "Ativo" |
| Inativo | Pill cinza escuro sólido, texto "Inativo" branco |

### 1.6 Loading State

Spinner circular ciano centralizado na área de conteúdo (substituindo a tabela).
Barra de paginação e campo de busca já visíveis durante o loading.

### 1.7 Padrão "Dual-Panel" (usado em Estados e Municípios)

```
┌──────────────────────┬──────────────────────────────────┐
│ Lista Geral de X     │ X Parceiros Adicionados          │
│                      │                                  │
│ [🔍 Procurar X]      │ [🔍 Procurar X]                  │
│                      │                                  │
│ ITEM        ADD      │ ITEM             REMOVER         │
│ ─────────────────    │ ──────────────────────────────   │
│ Item 1    [+] verde  │ Item A           [-] vermelho    │
│ Item 2    [+] verde  │                                  │
│ Item 3  "Adicionado" │                                  │  ← já adicionado
│ ...                  │                                  │
└──────────────────────┴──────────────────────────────────┘
```

- Painel esquerdo: lista-fonte (todos os itens disponíveis), scrollável
- Painel direito: lista de selecionados
- Botão ADD: ícone `+` em círculo verde → ao clicar, move item para painel direito e muda para texto "Adicionado" (cinza, sem botão)
- Botão REMOVER: ícone `-` em círculo vermelho/coral → remove do painel direito e restaura `+` no esquerdo
- Ambos os painéis têm buscas independentes (text + ícone lupa azul)

---

## 2. Sub-módulo: Colaboradores

### 2.1 Rota
`/colaboradores`

### 2.2 Tela de Listagem

**Colunas da tabela:**

| Coluna | Tipo | Notas |
|---|---|---|
| REPRESENTANTE LEGAL | texto | Nome completo do colaborador |
| EMAIL | texto | e-mail pessoal/institucional |
| ÁREA DE ATUAÇÃO | texto | Código do programa (ex: "EPV", "PARC") |
| CONTRATOS/ADITIVOS | — | Aparece vazia em todos os registros visíveis (link para contratos?) |
| FUNÇÃO | texto | Ex: "Diretor de Programa", "Analista de Avaliação" |
| STATUS | badge + texto | Dois valores independentes: **badge** (Ativo/Inativo) + **texto** abaixo (Cadastrado / Pré Cadastrado) |

**Total de registros:** 41 (paginação: 1-41, 5 por página → 9 páginas)

**Ações no header da listagem:**
- 🔽 Botão funil (ícone): abre/fecha painel de filtros avançados
- Campo "Pesquise" (busca livre)
- Botão "Importar CSV/Excel" — outline, abre `<input type="file">` oculto
- Botão "Adicionar Colaborador" — ciano, navega para `/colaboradores/adicionar`

**Painel de Filtros Avançados (toggle):**

| Campo | Tipo | Opções conhecidas |
|---|---|---|
| Escolaridade | combobox/select | — |
| Raça | combobox | — |
| Ano de Contratação | date picker (spinner Year + calendário) | — |
| Desativado por | combobox | — |
| Programa | combobox | — |
| Função | combobox | — |
| Identidade de Gênero | combobox | — |
| Status | combobox | Ativo / Inativo |
| Situação Cadastral | combobox | Cadastrado / Pré Cadastrado |
| Idade | number input | — |
| Vínculo Empregatício | combobox | PJ, CLT (inferido) |
| [Filtrar] | button ciano | aplica filtros |
| [Exportar] | button outline | exporta resultado |

### 2.3 Tela de Detalhe — `/colaboradores/detalhes/:id`

Breadcrumb: "Colaboradores > Detalhes"

**Seção 1 — "Dados pré-preenchidos pela ABC:"** (somente leitura no modo detalhe)

| Campo | Tipo | Exemplo |
|---|---|---|
| Representante Legal | text | "Agatha Francisco" |
| Email | text | "agatha-francisco@tuamaeaquelaursa.com" |
| Área de atuação | select/combobox | "EPV" |
| Função | select/combobox | "Analista de Avaliação" |
| Início de Contrato | date picker (DD/MM/AAAA + ícone calendário) | "01/01/2024" |
| Vínculo Empregatício | select/combobox | "PJ" |
| CPF | text (com máscara) | "030.700.460-02" |

**Seção 2 — "Complete seu cadastro:"** (campos complementares, preenchíveis pelo colaborador)

| Campo | Tipo | Notas |
|---|---|---|
| RG | text | — |
| Endereço completo | text | campo largo (ocupa ~metade da linha) |
| Data de nascimento | date picker | — |
| Celular | text | com máscara de telefone |
| Nome contato de emergência | text | — |
| Número contato de emergência | text | — |
| Identidade de gênero | select/combobox | — |
| Raça/Cor | select/combobox | — |
| Possui Alergia | select/combobox | "Sim" / "Não" |
| Alergias | text | habilitado condicionalmente quando "Possui Alergia = Sim" |
| Categoria alimentar | select/combobox | — |
| Escolaridade | select/combobox | — |
| Experiência no setor público | select/combobox | "Sim" / "Não" |
| Mini biografia | textarea | placeholder "Digite aqui …", máx. 500 caracteres |

**Botões do rodapé (modo Detalhe):**
- [Voltar] outline → volta à listagem
- [Editar] ciano → navega para `/colaboradores/editar/:id`

### 2.4 Tela de Edição — `/colaboradores/editar/:id`

Mesmo formulário do Detalhe, mas campos habilitados para edição.

**Botões do rodapé (modo Editar):**
- [Desativar] vermelho-coral (esquerda) → provavelmente abre modal de confirmação
- [Cancelar] outline → abre modal "Descartar alterações?"
- [Salvar] ciano (submit) → persiste edição e retorna ao detalhe

### 2.5 Tela de Adição — `/colaboradores/adicionar`

Breadcrumb: "Colaboradores > Adicionar"

Formulário reduzido: apenas o pré-cadastro (Seção 1).
Título interno da seção: **"Pré-Cadastro de colaborador(a)"**

| Campo | Tipo |
|---|---|
| Representante Legal | text |
| Email | text |
| Área de atuação | select/combobox |
| Função | select/combobox |
| Início de Contrato | date picker |
| Vínculo Empregatício | select/combobox |
| CPF | text |

**Botões:** [Cancelar] outline + [Adicionar] ciano (submit)

---

## 3. Sub-módulo: Fornecedores

### 3.1 Rota
`/fornecedores`

### 3.2 Tela de Listagem

**Colunas da tabela:**

| Coluna | Tipo | Notas |
|---|---|---|
| NOME | texto | Razão social ou nome fantasia |
| EMAIL | texto | — |
| CNPJ | texto | Formatado XX.XXX.XXX/XXXX-XX |
| CONTRATOS/ADITIVOS | — | Aparece vazia (link para contratos vinculados) |
| STATUS | badge | Ativo / Inativo |

**Total de registros visíveis:** 5 por página, paginação 1-3 (entre 11 e 15 registros)

**Ações no header:**
- 🔽 Botão funil (ícone filtro)
- Campo "Pesquise"
- Botão "Adicionar Fornecedores" ciano → `/fornecedores/adicionar`

**Sem painel de filtros avançados visível** (funil presente mas filtros não explorados — estrutura mais simples que Colaboradores)

### 3.3 Tela de Detalhe — `/fornecedores/detalhes/:id`

Breadcrumb: "Fornecedores > Detalhes"
Formulário dividido em 3 seções:

**Seção 1 — "Dados cadastrais do fornecedor:"**

| Campo | Tipo | Exemplo |
|---|---|---|
| Nome | text | "Banco Bradesco S.A." |
| E-mail | text | "nicole.ruivo@going2.com.br" |
| CNPJ | text (máscara) | "60.746.948/0001-12" |
| Razão Social | text | "Banco Bradesco S.A." |
| Nome Fantasia | text | "Banco Bradesco S.A." |
| Categoria de Serviço | select/combobox | — |
| Avaliação De Serviço | select/combobox | — |
| Comentário da Avaliação | text | — |

**Seção 2 — "Dados Bancários:"**

| Campo | Tipo | Exemplo |
|---|---|---|
| Banco | select/combobox | — (ícone Bradesco exibido) |
| Agência - DV | text | "0288-7" |
| Número da Conta | text | "0476781" |
| DV | text | "0" |

**Seção 3 — "Dados PIX:"**

| Campo | Tipo | Exemplo |
|---|---|---|
| Tipo de chave | select/combobox | "CPF" (opções: CPF, CNPJ, Email, Telefone, Chave aleatória — inferido) |
| Chave PIX | text | "472.697.718-04" |

**Botões (modo Detalhe):** [Voltar] + [Editar]

### 3.4 Tela de Edição — `/fornecedores/editar/:id`

Mesmo formulário com campos habilitados.
**Botões:** [Desativar] + [Cancelar] + [Salvar]

### 3.5 Tela de Adição — `/fornecedores/adicionar`

Breadcrumb: "Fornecedor > Adicionar" *(note: singular, diferente da listagem)*

Mesmo formulário completo (3 seções), campos vazios.
**Botões:** [Cancelar] + [Adicionar]

---

## 4. Sub-módulo: Financiadores

### 4.1 Rota
`/financiadores`

### 4.2 Tela de Listagem

**Colunas da tabela:**

| Coluna | Tipo | Exemplo |
|---|---|---|
| NOME | texto | "Financiador 1" |
| REPRESENTANTE LEGAL | texto | "Anderson" |
| CNPJ | texto (formatado) | "08.779.584/0001-57" |
| STATUS | badge | Ativo / Inativo |

**Total:** 5 registros (paginação: 1-1, todos na primeira página)

**Ações no header:**
- Campo "Pesquise"
- Botão "Adicionar Financiadores" ciano → `/financiadores/adicionar`

**Sem botão de filtro** (módulo mais simples)

### 4.3 Tela de Detalhe — `/financiadores/detalhes/:id`

Breadcrumb: "Financiadores > Detalhes"
**Formulário (1 seção, sem título interno):**

| Campo | Tipo | Exemplo |
|---|---|---|
| Nome do Financiador | text | "Financiador 1" |
| Razão Social | text | "Financiador 1" |
| CNPJ | text (máscara) | "08.779.584/0001-57" |
| Telefone | text (máscara) | "(15)99721-3285" |
| Representante Legal | text | "Anderson" |
| Endereço | text (largo, 2a linha) | "Rua Dionísio, 1" |

Layout: linha 1 = 4 colunas (Nome, Razão Social, CNPJ, Telefone); linha 2 = 2 campos (Representante Legal + Endereço largo)

**Botões (modo Detalhe):** [Voltar] + [Editar]

### 4.4 Tela de Edição — `/financiadores/editar/:id`

Mesmo formulário com campos habilitados.
**Botões:** [Desativar] vermelho-coral + [Cancelar] + [Salvar]
Modal de cancelamento: "Ao confirmar essa opção todas as suas alterações serão perdidas."

### 4.5 Tela de Adição — `/financiadores/adicionar`

Breadcrumb: "Financiadores > Adicionar"
Mesmo formulário, campos vazios (sem labels flutuantes ativas).
**Botões:** [Cancelar] + [Adicionar]

---

## 5. Sub-módulo: Estados Parceiros

### 5.1 Rota
`/estados`

### 5.2 Tela (única)

Layout dual-panel side-by-side (sem paginação, sem rota de detalhe).

**Painel Esquerdo — "Lista Geral de Estados"**
- Busca: `<input type="text">` "Procurar Estado" + ícone lupa azul
- Tabela 2 colunas: ESTADOS | ADD
- 27 estados brasileiros listados em ordem alfabética (Acre → Tocantins)
- Estado ainda não adicionado: botão `+` círculo verde
- Estado já adicionado: texto cinza "Adicionado" (sem botão interativo)

**Painel Direito — "Estados Parceiros Adicionados"**
- Busca: "Procurar Estado" + ícone lupa azul
- Tabela 2 colunas: ESTADOS | REMOVER
- Cada item: nome do estado + botão `-` círculo vermelho/coral

**Comportamento:**
- Clicar `+` em estado disponível → move para painel direito, muda para "Adicionado"
- Clicar `-` em estado adicionado → remove do painel direito, restaura `+` no esquerdo
- Ambas as buscas filtram independentemente seus respectivos painéis
- Não há botão de "Salvar" explícito → operações provavelmente são imediatas (optimistic UI ou auto-save via API)

**Dados observados:** 1 estado adicionado (Acre)

---

## 6. Sub-módulo: Municípios Parceiros

### 6.1 Rota
`/municipios`

### 6.2 Tela (única)

Mesmo padrão dual-panel de Estados, com diferença no painel esquerdo.

**Painel Esquerdo — "Lista Geral de Municípios"**
- Filtro de UF: combobox "Selecionar Estado" (select com seta) — **pré-requisito** para listar municípios
- Busca: "Procurar Município" + ícone lupa azul
- Estado inicial: "Nenhum resultado encontrado" (até selecionar um estado)
- Após selecionar estado: lista municípios daquele estado com botão `+`

**Painel Direito — "Municípios Parceiros Adicionados"**
- Busca: "Procurar Município" + ícone lupa azul
- Tabela: MUNICÍPIOS | REMOVER
- Botão `-` círculo vermelho por linha

**Dados observados:** 1 município adicionado (Anamã — município do Amazonas)

**Diferença chave vs Estados:** o filtro de estado é obrigatório para ver municípios disponíveis (a lista é dependente do estado selecionado).

---

## 7. Modelo de Dados Implícito

```typescript
// ── COLABORADOR ────────────────────────────────────────────────
interface Colaborador {
  id: number;

  // Pré-cadastro (preenchido pelo admin/ABC)
  representanteLegal: string;
  email: string;
  areaAtuacao: string;         // "EPV" | "PARC" | ...
  funcao: string;              // "Diretor de Programa" | "Analista de Avaliação" | ...
  iniciContrato: string;       // ISO date
  vinculoEmpregaticio: string; // "PJ" | "CLT" | ...
  cpf: string;                 // formatado XXX.XXX.XXX-XX

  // Cadastro complementar (preenchido pelo colaborador)
  rg?: string;
  enderecoCompleto?: string;
  dataNascimento?: string;
  celular?: string;
  nomeContatoEmergencia?: string;
  numeroContatoEmergencia?: string;
  identidadeGenero?: string;
  racaCor?: string;
  possuiAlergia?: boolean;
  alergias?: string;
  categoriaAlimentar?: string;
  escolaridade?: string;
  experienciaSetorPublico?: boolean;
  miniBiografia?: string;      // máx. 500 chars

  // Metadata
  status: 'Ativo' | 'Inativo';
  situacaoCadastral: 'Cadastrado' | 'Pré Cadastrado';
}

// ── FORNECEDOR ─────────────────────────────────────────────────
interface Fornecedor {
  id: number;
  nome: string;
  email: string;
  cnpj: string;               // formatado XX.XXX.XXX/XXXX-XX
  razaoSocial: string;
  nomeFantasia?: string;
  categoriaServico?: string;
  avaliacaoServico?: string;
  comentarioAvaliacao?: string;

  // Dados bancários
  banco?: string;
  agenciaDv?: string;         // ex: "0288-7"
  numeroConta?: string;
  dv?: string;

  // PIX
  tipoChavePix?: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Chave aleatória';
  chavePix?: string;

  // Metadata
  status: 'Ativo' | 'Inativo';
  contratosAditivos?: ContractRef[];   // coluna visível, dados não explorados
}

// ── FINANCIADOR ────────────────────────────────────────────────
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

// ── ESTADO PARCEIRO ────────────────────────────────────────────
interface EstadoParceiro {
  sigla: string;              // "AC" | "AL" | ...
  nome: string;               // "Acre" | "Alagoas" | ...
  adicionado: boolean;
}

// ── MUNICÍPIO PARCEIRO ─────────────────────────────────────────
interface MunicipioParceiro {
  id: number;
  nome: string;               // "Anamã"
  estadoSigla: string;        // "AM"
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
  │     ├── [Cancelar] → volta à listagem
  │     └── [Adicionar/submit] → persiste → volta à listagem
  │
  └── [click na linha] → /[entidade]/detalhes/:id
        ├── [Voltar] → volta à listagem
        └── [Editar] → /[entidade]/editar/:id
              ├── [Cancelar] → modal "Descartar?"
              │     ├── [Sim] → /[entidade]/detalhes/:id
              │     └── [Não] → permanece em edição
              ├── [Salvar] → persiste → /[entidade]/detalhes/:id
              └── [Desativar] → (comportamento não confirmado: modal? direto?)
```

### 8.2 Busca na listagem

- Busca livre em tempo real (debounce provável) sobre os campos visíveis
- Não recarrega a página; filtra via API ou client-side

### 8.3 Paginação

- Select "Itens por página": 5 | 10 | 25
- Navegação: botões < (anterior) e > (próximo), desabilitados nos extremos
- Contador: formato "X - Y" onde X = página atual (número de páginas?), Y = total de páginas

### 8.4 Filtros avançados (Colaboradores)

- Toggle via botão funil; expande painel abaixo da barra de busca
- [Filtrar] aplica todos os filtros selecionados
- [Exportar] exporta o resultado atual (formato não confirmado: provavelmente .xlsx)

### 8.5 Importar CSV/Excel (Colaboradores)

- Botão "Importar CSV/Excel" → dispara `<input type="file">` oculto
- Formato esperado: CSV ou Excel (.xlsx)
- Fluxo pós-upload não explorado

### 8.6 Dual-Panel (Estados / Municípios)

- ADD: ação imediata (sem botão "Salvar") → presume-se chamada API na hora
- REMOVER: ação imediata
- Buscas independentes e reativas em cada painel
- Municípios: painel esquerdo fica vazio até selecionar um estado no combobox

### 8.7 Modal de Cancelamento de Edição

Disparado por [Cancelar] no modo Editar:
- Backdrop escuro (overlay semi-transparente)
- Card branco centralizado com ícone ℹ️ ciano
- Dois botões: "Sim, Descartar alterações" (ciano, confirma) e "Não Descartar alterações" (outline, fecha modal)

---

## 9. Rotas Mapeadas

| Tela | Rota | Método de acesso |
|---|---|---|
| Colaboradores — Listagem | `/colaboradores` | Menu sidebar |
| Colaboradores — Detalhe | `/colaboradores/detalhes/:id` | Click na linha |
| Colaboradores — Editar | `/colaboradores/editar/:id` | Botão "Editar" no detalhe |
| Colaboradores — Adicionar | `/colaboradores/adicionar` | Botão "Adicionar Colaborador" |
| Fornecedores — Listagem | `/fornecedores` | Menu sidebar |
| Fornecedores — Detalhe | `/fornecedores/detalhes/:id` | Click na linha |
| Fornecedores — Editar | `/fornecedores/editar/:id` | Botão "Editar" no detalhe |
| Fornecedores — Adicionar | `/fornecedores/adicionar` | Botão "Adicionar Fornecedores" |
| Financiadores — Listagem | `/financiadores` | Menu sidebar |
| Financiadores — Detalhe | `/financiadores/detalhes/:id` | Click na linha |
| Financiadores — Editar | `/financiadores/editar/:id` | Botão "Editar" no detalhe |
| Financiadores — Adicionar | `/financiadores/adicionar` | Botão "Adicionar Financiadores" |
| Estados Parceiros | `/estados` | Menu sidebar |
| Municípios Parceiros | `/municipios` | Menu sidebar |

---

## 10. Breakdown de Componentes

```
GestaoParceiroModule
│
├── GestaoParceiroLayout (wrapper com sidebar ativo no módulo)
│
├── [SHARED COMPONENTS]
│   ├── SearchBar (label flutuante + ícone lupa)
│   ├── FilterToggleButton (ícone funil → toggle)
│   ├── DataTable
│   │   ├── TableHeader (colunas com label ciano maiúsculo)
│   │   ├── TableRow (clickable → navega para detalhe)
│   │   └── TableCell
│   ├── StatusBadge (variant: "ativo" | "inativo")
│   ├── SituacaoCadastralLabel (texto: "Cadastrado" | "Pré Cadastrado")
│   ├── Pagination (select itens/pág + contador + botões < >)
│   ├── BackButton (← quadrado ciano)
│   ├── PageBreadcrumb ("Entidade > Modo")
│   ├── FormCard (container branco com sombra, padding, border-radius)
│   ├── SectionLabel (sub-título de seção dentro do formulário)
│   ├── FloatingLabelInput (Material-style text input)
│   ├── FloatingLabelSelect (combobox com label flutuante)
│   ├── DatePickerField (spinners DD/MM/AAAA + ícone calendário)
│   ├── TextareaField (com contador de caracteres)
│   ├── DiscardChangesModal (modal de confirmação de cancelamento)
│   ├── PrimaryButton (ciano)
│   ├── OutlineButton (borda, fundo branco)
│   └── DestructiveButton (vermelho-coral, ex: "Desativar")
│
├── [COLABORADORES]
│   ├── ColaboradoresListPage
│   │   ├── FilterToggleButton
│   │   ├── SearchBar
│   │   ├── ColaboradoresFilterPanel
│   │   │   ├── FloatingLabelSelect (Escolaridade, Raça, Programa, Função,
│   │   │   │   Identidade de Gênero, Status, Situação Cadastral,
│   │   │   │   Vínculo Empregatício, Desativado por)
│   │   │   ├── DatePickerField (Ano de Contratação)
│   │   │   ├── NumberInput (Idade)
│   │   │   ├── PrimaryButton (Filtrar)
│   │   │   └── OutlineButton (Exportar)
│   │   ├── ImportCSVButton (+ hidden file input)
│   │   ├── PrimaryButton (Adicionar Colaborador)
│   │   ├── DataTable (cols: Rep. Legal, Email, Área, Contratos, Função, Status)
│   │   └── Pagination
│   │
│   ├── ColaboradoresDetailPage
│   │   ├── BackButton + PageBreadcrumb
│   │   └── FormCard
│   │       ├── SectionLabel ("Dados pré-preenchidos pela ABC:")
│   │       ├── [FloatingLabelInput, FloatingLabelSelect, DatePickerField] × 7
│   │       ├── SectionLabel ("Complete seu cadastro:")
│   │       ├── [FloatingLabelInput, FloatingLabelSelect, DatePickerField,
│   │       │    TextareaField] × 14
│   │       ├── OutlineButton (Voltar)
│   │       └── PrimaryButton (Editar)
│   │
│   ├── ColaboradoresEditPage (mesmo formulário + botões de edição)
│   │   └── DiscardChangesModal
│   │
│   └── ColaboradoresAddPage
│       ├── BackButton + PageBreadcrumb
│       └── FormCard
│           ├── SectionLabel ("Pré-Cadastro de colaborador(a)")
│           ├── [FloatingLabelInput, FloatingLabelSelect, DatePickerField] × 7
│           ├── OutlineButton (Cancelar)
│           └── PrimaryButton (Adicionar)
│
├── [FORNECEDORES]
│   ├── FornecedoresListPage
│   │   ├── FilterToggleButton
│   │   ├── SearchBar
│   │   ├── PrimaryButton (Adicionar Fornecedores)
│   │   ├── DataTable (cols: Nome, Email, CNPJ, Contratos, Status)
│   │   └── Pagination
│   │
│   ├── FornecedoresDetailPage / EditPage / AddPage
│   │   └── FormCard
│   │       ├── SectionLabel ("Dados cadastrais do fornecedor:")
│   │       ├── [FloatingLabelInput × 5, FloatingLabelSelect × 2, FloatingLabelInput] × 8
│   │       ├── SectionLabel ("Dados Bancários:")
│   │       ├── [FloatingLabelSelect (Banco), FloatingLabelInput × 3] × 4
│   │       ├── SectionLabel ("Dados PIX:")
│   │       └── [FloatingLabelSelect (Tipo chave), FloatingLabelInput (Chave)] × 2
│
├── [FINANCIADORES]
│   ├── FinanciadoresListPage
│   │   ├── SearchBar
│   │   ├── PrimaryButton (Adicionar Financiadores)
│   │   ├── DataTable (cols: Nome, Rep. Legal, CNPJ, Status)
│   │   └── Pagination
│   │
│   └── FinanciadoresDetailPage / EditPage / AddPage
│       └── FormCard
│           └── [FloatingLabelInput × 6] (Nome, Razão Social, CNPJ, Telefone,
│               Rep. Legal, Endereço)
│
├── [ESTADOS]
│   └── EstadosParceiroPage
│       └── DualPanelLayout
│           ├── AvailablePanel ("Lista Geral de Estados")
│           │   ├── SearchBar ("Procurar Estado")
│           │   └── SimpleTable
│           │       └── EstadoRow (nome + AddButton | "Adicionado")
│           └── SelectedPanel ("Estados Parceiros Adicionados")
│               ├── SearchBar ("Procurar Estado")
│               └── SimpleTable
│                   └── EstadoRow (nome + RemoveButton)
│
└── [MUNICÍPIOS]
    └── MunicipiosParceiroPage
        └── DualPanelLayout
            ├── AvailablePanel ("Lista Geral de Municípios")
            │   ├── FloatingLabelSelect (Selecionar Estado
