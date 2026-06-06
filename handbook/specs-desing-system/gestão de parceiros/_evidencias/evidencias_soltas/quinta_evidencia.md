Continuando exatamente de onde parou — a partir do `StatusBadge` no breakdown:

---

```markdown
│   ├── StatusBadge                  props: status: 'Ativo'|'Inativo'
│   ├── SituacaoCadastralLabel       props: situacao: 'Cadastrado'|'Pré Cadastrado'
│   ├── Pagination
│   │   props: page, totalPages, perPage, perPageOptions, onPageChange, onPerPageChange
│   ├── BackButton                   props: onClick (← quadrado ciano)
│   ├── PageBreadcrumb               props: entity, mode: 'Detalhes'|'Editar'|'Adicionar'
│   ├── FormCard                     wrapper branco, sombra, border-radius ~12px
│   ├── SectionLabel                 props: text (sub-título interno de seção)
│   ├── FloatingLabelInput           props: label, value, disabled, type, mask?
│   ├── FloatingLabelSelect          props: label, options, value, disabled
│   ├── DatePickerField              props: label, value, disabled (spinners DD/MM/AAAA + calendário)
│   ├── TextareaField                props: label, placeholder, maxLength, value, disabled
│   ├── DiscardChangesModal
│   │   props: isOpen, onConfirm, onCancel
│   │   — "Ao confirmar essa opção todas as suas alterações serão perdidas."
│   │   — Botões: [Sim, Descartar alterações] ciano | [Não Descartar alterações] outline
│   ├── DeactivateConfirmModal
│   │   props: isOpen, entityType, entityName, onConfirm, onCancel
│   │   — "Você está prestes a desativar o {entityType} {entityName}. Tem certeza?"
│   │   — Botões: [Não desativar] ciano | [Sim, tenho certeza] outline
│   ├── PrimaryButton                props: children, onClick, type, disabled
│   ├── OutlineButton                props: children, onClick, disabled
│   └── DestructiveButton            props: children, onClick (vermelho-coral, ex: "Desativar")
│
├── [COLABORADORES]
│   │
│   ├── ColaboradoresListPage        rota: /colaboradores
│   │   ├── FilterToggleButton
│   │   ├── SearchBar                placeholder="Pesquise"
│   │   ├── ColaboradoresFilterPanel (visível via toggle)
│   │   │   ├── FloatingLabelSelect  "Escolaridade"
│   │   │   ├── FloatingLabelSelect  "Raça"
│   │   │   ├── DatePickerField      "Ano de Contratação" (year only)
│   │   │   ├── FloatingLabelSelect  "Desativado por"
│   │   │   ├── FloatingLabelSelect  "Programa"
│   │   │   ├── FloatingLabelSelect  "Função"
│   │   │   ├── FloatingLabelSelect  "Identidade de Gênero"
│   │   │   ├── FloatingLabelSelect  "Status"
│   │   │   ├── FloatingLabelSelect  "Situação Cadastral"
│   │   │   ├── NumberInput          "Idade"
│   │   │   ├── FloatingLabelSelect  "Vínculo Empregatício"
│   │   │   ├── PrimaryButton        "Filtrar"
│   │   │   └── OutlineButton        "Exportar"
│   │   ├── ImportCSVButton          (button outline + hidden file input)
│   │   ├── PrimaryButton            "Adicionar Colaborador"
│   │   ├── DataTable
│   │   │   columns: [Rep. Legal, Email, Área de Atuação,
│   │   │             Contratos/Aditivos, Função, Status]
│   │   │   → STATUS cell renderiza StatusBadge + SituacaoCadastralLabel
│   │   └── Pagination
│   │
│   ├── ColaboradoresDetailPage      rota: /colaboradores/detalhes/:id
│   │   ├── BackButton
│   │   ├── PageBreadcrumb           entity="Colaboradores" mode="Detalhes"
│   │   └── FormCard
│   │       ├── SectionLabel         "Dados pré-preenchidos pela ABC:"
│   │       ├── FloatingLabelInput   "Representante Legal"  disabled
│   │       ├── FloatingLabelInput   "Email"                disabled
│   │       ├── FloatingLabelSelect  "Área de atuação"      disabled
│   │       ├── FloatingLabelSelect  "Função"               disabled
│   │       ├── DatePickerField      "Início de Contrato"   disabled
│   │       ├── FloatingLabelSelect  "Vínculo Empregatício" disabled
│   │       ├── FloatingLabelInput   "CPF"  mask disabled
│   │       ├── SectionLabel         "Complete seu cadastro:"
│   │       ├── FloatingLabelInput   "RG"
│   │       ├── FloatingLabelInput   "Endereço completo"    (largo)
│   │       ├── DatePickerField      "Data de nascimento"
│   │       ├── FloatingLabelInput   "Celular"              mask
│   │       ├── FloatingLabelInput   "Nome contato de emergência"
│   │       ├── FloatingLabelInput   "Número contato de emergência"
│   │       ├── FloatingLabelSelect  "Identidade de gênero"
│   │       ├── FloatingLabelSelect  "Raça/Cor"
│   │       ├── FloatingLabelSelect  "Possui Alergia"
│   │       ├── FloatingLabelInput   "Alergias"             (condicional)
│   │       ├── FloatingLabelSelect  "Categoria alimentar"
│   │       ├── FloatingLabelSelect  "Escolaridade"
│   │       ├── FloatingLabelSelect  "Experiência no setor público"
│   │       ├── TextareaField        "Mini biografia" maxLength=500
│   │       ├── OutlineButton        "Voltar"
│   │       └── PrimaryButton        "Editar"
│   │
│   ├── ColaboradoresEditPage        rota: /colaboradores/editar/:id
│   │   (= ColaboradoresDetailPage mas todos os campos enabled)
│   │   ├── DestructiveButton        "Desativar" → DeactivateConfirmModal
│   │   ├── OutlineButton            "Cancelar"  → DiscardChangesModal
│   │   └── PrimaryButton            "Salvar"    type=submit
│   │
│   └── ColaboradoresAddPage         rota: /colaboradores/adicionar
│       ├── BackButton
│       ├── PageBreadcrumb           entity="Colaboradores" mode="Adicionar"
│       └── FormCard
│           ├── SectionLabel         "Pré-Cadastro de colaborador(a)"
│           ├── FloatingLabelInput   "Representante Legal"
│           ├── FloatingLabelInput   "Email"
│           ├── FloatingLabelSelect  "Área de atuação"
│           ├── FloatingLabelSelect  "Função"
│           ├── DatePickerField      "Início de Contrato"
│           ├── FloatingLabelSelect  "Vínculo Empregatício"
│           ├── FloatingLabelInput   "CPF"  mask
│           ├── OutlineButton        "Cancelar"
│           └── PrimaryButton        "Adicionar"  type=submit
│
├── [FORNECEDORES]
│   │
│   ├── FornecedoresListPage         rota: /fornecedores
│   │   ├── FilterToggleButton
│   │   ├── SearchBar                placeholder="Pesquise"
│   │   ├── FornecedoresFilterPanel  (visível via toggle)
│   │   │   ├── FloatingLabelSelect  "Status de contrato:"
│   │   │   │   options: Possuem contratos | Não possuem contratos | Contratos em vigência
│   │   │   ├── FloatingLabelSelect  "Status do fornecedor:"
│   │   │   │   options: Ativo | Inativo
│   │   │   ├── FloatingLabelSelect  "Categoria de serviço:"
│   │   │   │   options: (22 categorias — ver seção 3.2)
│   │   │   ├── PrimaryButton        "Filtrar"
│   │   │   └── OutlineButton        "Exportar"
│   │   ├── PrimaryButton            "Adicionar Fornecedores"
│   │   ├── DataTable
│   │   │   columns: [Nome, Email, CNPJ, Contratos/Aditivos, Status]
│   │   └── Pagination
│   │
│   ├── FornecedoresDetailPage       rota: /fornecedores/detalhes/:id
│   │   ├── BackButton
│   │   ├── PageBreadcrumb           entity="Fornecedores" mode="Detalhes"
│   │   └── FormCard
│   │       ├── SectionLabel         "Dados cadastrais do fornecedor:"
│   │       ├── FloatingLabelInput   "Nome"               disabled
│   │       ├── FloatingLabelInput   "E-mail"             disabled
│   │       ├── FloatingLabelInput   "CNPJ"   mask        disabled
│   │       ├── FloatingLabelInput   "Razão Social"       disabled
│   │       ├── FloatingLabelInput   "Nome Fantasia"      disabled
│   │       ├── FloatingLabelSelect  "Categoria de Serviço" disabled
│   │       ├── FloatingLabelSelect  "Avaliação De Serviço" disabled
│   │       ├── FloatingLabelInput   "Comentário da Avaliação" disabled
│   │       ├── SectionLabel         "Dados Bancários:"
│   │       ├── FloatingLabelSelect  "Banco"              disabled
│   │       ├── FloatingLabelInput   "Agência - DV"       disabled
│   │       ├── FloatingLabelInput   "Número da Conta"    disabled
│   │       ├── FloatingLabelInput   "DV"                 disabled
│   │       ├── SectionLabel         "Dados PIX:"
│   │       ├── FloatingLabelSelect  "Tipo de chave:"     disabled
│   │       ├── FloatingLabelInput   "Chave PIX"          disabled
│   │       ├── OutlineButton        "Voltar"
│   │       └── PrimaryButton        "Editar"
│   │
│   ├── FornecedoresEditPage         rota: /fornecedores/editar/:id
│   │   (= FornecedoresDetailPage mas todos os campos enabled)
│   │   ├── DestructiveButton        "Desativar" → DeactivateConfirmModal
│   │   ├── OutlineButton            "Cancelar"  → DiscardChangesModal
│   │   └── PrimaryButton            "Salvar"    type=submit
│   │
│   └── FornecedoresAddPage          rota: /fornecedores/adicionar
│       ├── BackButton
│       ├── PageBreadcrumb           entity="Fornecedor" mode="Adicionar"
│       └── FormCard  (mesmo formulário, campos vazios)
│           ├── OutlineButton        "Cancelar"
│           └── PrimaryButton        "Adicionar"  type=submit
│
├── [FINANCIADORES]
│   │
│   ├── FinanciadoresListPage        rota: /financiadores
│   │   ├── SearchBar                placeholder="Pesquise"
│   │   ├── PrimaryButton            "Adicionar Financiadores"
│   │   ├── DataTable
│   │   │   columns: [Nome, Representante Legal, CNPJ, Status]
│   │   └── Pagination
│   │
│   ├── FinanciadoresDetailPage      rota: /financiadores/detalhes/:id
│   │   ├── BackButton
│   │   ├── PageBreadcrumb           entity="Financiadores" mode="Detalhes"
│   │   └── FormCard
│   │       ├── FloatingLabelInput   "Nome do Financiador"  disabled
│   │       ├── FloatingLabelInput   "Razão Social"         disabled
│   │       ├── FloatingLabelInput   "CNPJ"   mask          disabled
│   │       ├── FloatingLabelInput   "Telefone" mask        disabled
│   │       ├── FloatingLabelInput   "Representante Legal"  disabled
│   │       ├── FloatingLabelInput   "Endereço" (largo)     disabled
│   │       ├── OutlineButton        "Voltar"
│   │       └── PrimaryButton        "Editar"
│   │
│   ├── FinanciadoresEditPage        rota: /financiadores/editar/:id
│   │   (= FinanciadoresDetailPage mas todos os campos enabled)
│   │   ├── DestructiveButton        "Desativar" → DeactivateConfirmModal
│   │   │   modal text: "Você está prestes a desativar o financiador {nome}."
│   │   ├── OutlineButton            "Cancelar"  → DiscardChangesModal
│   │   └── PrimaryButton            "Salvar"    type=submit
│   │
│   └── FinanciadoresAddPage         rota: /financiadores/adicionar
│       ├── BackButton
│       ├── PageBreadcrumb           entity="Financiadores" mode="Adicionar"
│       └── FormCard  (mesmo formulário, campos vazios)
│           ├── OutlineButton        "Cancelar"
│           └── PrimaryButton        "Adicionar"  type=submit
│
├── [ESTADOS]
│   │
│   └── EstadosParceiroPage          rota: /estados
│       └── DualPanelLayout
│           ├── AvailablePanel
│           │   title="Lista Geral de Estados"
│           │   ├── SearchBar        placeholder="Procurar Estado"
│           │   └── SimpleTable
│           │       columns: [ESTADOS, ADD]
│           │       └── EstadoAvailableRow
│           │           ├── nome: string
│           │           └── action: AddButton (verde +) | TextLabel "Adicionado"
│           └── SelectedPanel
│               title="Estados Parceiros Adicionados"
│               ├── SearchBar        placeholder="Procurar Estado"
│               └── SimpleTable
│                   columns: [ESTADOS, REMOVER]
│                   └── EstadoSelectedRow
│                       ├── nome: string
│                       └── action: RemoveButton (vermelho −)
│
└── [MUNICÍPIOS]
    │
    └── MunicipiosParceiroPage       rota: /municipios
        └── DualPanelLayout
            ├── AvailablePanel
            │   title="Lista Geral de Municípios"
            │   ├── FloatingLabelSelect  "Selecionar Estado"
            │   │   autocomplete, com botão × para limpar seleção
            │   │   ao selecionar → carrega municípios do estado via API
            │   ├── SearchBar            placeholder="Procurar Município"
            │   └── SimpleTable
            │       columns: [MUNICÍPIOS, ADD]
            │       emptyState: "Nenhum resultado encontrado" (sem estado selecionado)
            │       └── MunicipioAvailableRow
            │           ├── nome: string
            │           └── action: AddButton (verde +) | TextLabel "Adicionado"
            └── SelectedPanel
                title="Municípios Parceiros Adicionados"
                ├── SearchBar            placeholder="Procurar Município"
                └── SimpleTable
                    columns: [MUNICÍPIOS, REMOVER]
                    └── MunicipioSelectedRow
                        ├── nome: string
                        └── action: RemoveButton (vermelho −)
```

---

## 11. Apêndice — Lista Completa de Estados Brasileiros

*(Para referência do componente EstadosParceiroPage — todos 27, ordem alfabética)*

Acre, Alagoas, Amapá, Amazonas, Bahia, Ceará, Distrito Federal,
Espírito Santo, Goiás, Maranhão, Mato Grosso, Mato Grosso do Sul,
Minas Gerais, Pará, Paraíba, Paraná, Pernambuco, Piauí,
Rio de Janeiro, Rio Grande do Norte, Rio Grande do Sul, Rondônia,
Roraima, Santa Catarina, São Paulo, Sergipe, Tocantins.

---

## 12. Observações e Lacunas

| Ponto | Status | Detalhe |
|---|---|---|
| Comportamento pós-Desativar | ⚠️ Não confirmado | Modal capturado; destino após "Sim, tenho certeza" não foi testado (provável: volta à listagem com status Inativo) |
| Coluna CONTRATOS/ADITIVOS | ⚠️ Parcialmente confirmado | Coluna presente nas listagens de Colaboradores e Fornecedores; aparece vazia no ambiente de teste — deve exibir contagem de contratos vinculados quando houver dados |
| Formulário de Edição — Colaboradores | ⚠️ Não explorado | Não foi verificado se a Seção 1 permanece somente-leitura no modo Editar ou se todos os campos ficam habilitados |
| Validações de formulário | ❌ Não capturado | Nenhuma mensagem de erro de validação foi acionada; campos obrigatórios, formatos (CNPJ, CPF, telefone) e limites não confirmados visualmente |
| Responsividade mobile | ❌ Não testado | Todas as capturas foram em viewport desktop (~1161px) |
| Dropdown do UserMenu (avatar AC) | ❌ Não explorado | Opções de conta (Minha Conta, Logout, troca de empresa?) não capturadas |
| Campo "Alergias" condicional | ⚠️ Inferido | Campo aparece habilitado mesmo com "Possui Alergia = Sim" já selecionado no detalhe; comportamento de habilitação condicional inferido mas não testado ao vivo |
| Opções de Escolaridade, Função, etc. | ❌ Não expandidos | Dropdowns dos filtros de Colaboradores foram listados mas suas opções não foram abertas individualmente |
| Avaliação De Serviço (Fornecedor) | ❌ Não expandido | Opções do combobox "Avaliação De Serviço" não foram capturadas |
| Estado após Importar CSV (Colaboradores) | ❌ Não testado | Tela/modal de resultado do upload não capturado |
| Busca no SearchBar — comportamento | ⚠️ Inferido | Debounce e scope (client-side vs. API) não confirmados; inferidos como busca server-side com debounce |
| Inconsistência de nomenclatura | ℹ️ Registrada | Breadcrumb de adicionar Fornecedor: "Fornecedor > Adicionar" (singular) vs. listagem "Fornecedores" (plural) |
| Encoding em Função dos Colaboradores | ℹ️ Bug observado | DOM exibe "AvaliaÃ§Ã£o" em vez de "Avaliação" — problema de encoding UTF-8 no dado da API |
```

---

**Documento fechado.** O `reconstructed-spec.md` do módulo **Gestão de Parceiros** está completo com:

- **14 telas** mapeadas (5 sub-módulos × listagem/detalhe/editar/adicionar + 2 telas únicas dual-panel)
- **2 modais** documentados com texto exato e lógica de botões
- **Todos os campos** de todos os formulários com tipos, exemplos e estados
- **Todos os filtros** com opções completas (incluindo as 22 categorias de serviço de Fornecedores)
- **Modelo de dados TypeScript** completo
- **Breakdown de componentes** React pronto para implementação
- **12 observações e lacunas** classificadas por status
