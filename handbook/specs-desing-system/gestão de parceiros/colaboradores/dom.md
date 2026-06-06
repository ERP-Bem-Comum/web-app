# colaboradores.listagem.dom.txt
# Capturado via read_page em /colaboradores
# Estado: listagem preenchida, filtros fechados

Elementos interativos:
- button [ref_14] — filtro toggle (funil)
- textbox "Pesquise" [ref_16] — busca livre
- button "Importar CSV/Excel" [ref_18] — dispara input file oculto
- button [ref_20] type="file" — input oculto para CSV/Excel
- button "Adicionar Colaborador" [ref_19]
- table [ref_21]
  cols: REPRESENTANTE LEGAL · EMAIL · ÁREA DE ATUAÇÃO · CONTRATOS/ADITIVOS · FUNÇÃO · STATUS
  rows (5 visíveis):
    [ref_28] "123" · "teste@num.com" · "PARC" · "Diretor de Programa" · "Pré Cadastrado" · "Inativo"
    [ref_35] "Agatha Francisco" · "agatha-francisco@tuamaeaquelaursa.com" · "EPV" · "Analista de Avaliação*" · "Cadastrado" · "Ativo"
    [ref_42] "Alessandra Castro - Teste" · "alessandracastro922@gmail.com" · "EPV" · "Diretor de Programa Adjunto" · "Cadastrado" · "Ativo"
    [ref_49] "Amanda Apollo" · "amanda-appolinario@tuamaeaquelaursa.com" · "PARC" · "Diretor de Programa" · "Cadastrado" · "Ativo"
    [ref_56] "Ana Jhulia Mascarelo" · "ana-julia-mascarelo@tuamaeaquelaursa.com" · "EPV" · "Analista de Avaliação*" · "Cadastrado" · "Ativo"
  * encoding bug no DOM: "AvaliaÃ§Ã£o" em vez de "Avaliação"
- combobox "5" [ref_64] — itens por página (opções: 5, 10, 25)
- button [ref_65] — página anterior (desabilitado na pág 1)
- button [ref_66] — próxima página

# colaboradores.filtros.dom.txt
# Estado: painel de filtros aberto
- combobox "Escolaridade" [ref_69]
- combobox "Raça" [ref_71]
- spinbutton "Year" [ref_73] + button "Choose date" [ref_74] — Ano de Contratação
- combobox "Desativado por" [ref_75]
- combobox "Programa" [ref_77]
- combobox "Função" [ref_79]
- combobox "Identidade de Gênero" [ref_81]
- combobox "Status" [ref_83]
- combobox "Situação Cadastral" [ref_85]
- textbox "Idade" [ref_87] type="number"
- combobox "Status" [ref_88] — Vínculo Empregatício (label truncado na UI)
- button "Filtrar" [ref_90]
- button "Exportar" [ref_91]

# colaboradores.detalhe.dom.txt
# Capturado via read_page em /colaboradores/detalhes/22
- button [ref_92] — BackButton (←)
- form [ref_94]
  Seção 1 "Dados pré-preenchidos pela ABC:"
    textbox "Representante Legal" [ref_97] — value: "Agatha Francisco"
    textbox "Email" [ref_100] — value: "agatha-francisco@tuamaeaquelaursa.com"
    combobox "Área de atuação" [ref_103] — value: "EPV"
    combobox "Função" [ref_107] — value: "Analista de Avaliação"
    datepicker "Início de Contrato" [ref_110-118] — value: "01/01/2024"
    combobox "Vínculo Empregatício" [ref_120] — value: "PJ"
    textbox "CPF" [ref_124] — value: "030.700.460-02"
  Seção 2 "Complete seu cadastro:"
    textbox "RG" [ref_128]
    textbox "Endereço completo" [ref_130]
    datepicker "Data de nascimento" [ref_132-140]
    textbox "Celular" [ref_142]
    textbox "Nome contato de emergência" [ref_145]
    textbox "Número contato de emergência" [ref_148]
    combobox "Identidade de gênero" [ref_151]
    combobox "Raça/Cor" [ref_155]
    combobox "Possui Alergia" [ref_159] — value: "Sim"
    textbox "Alergias" [ref_163]
    combobox "Categoria alimentar" [ref_166]
    combobox "Escolaridade" [ref_170]
    combobox "Experiência no setor público" [ref_174] — value: "Não"
    textarea "Mini biografia" [ref_178] — placeholder: "Digite aqui ...", maxLength: 500
  button "Voltar" [ref_181]
  button "Editar" [ref_182]

# colaboradores.editar.dom.txt
# Capturado via read_page em /colaboradores/editar/22
# Mesmos campos do detalhe, todos enabled +
  button "Desativar" [ref_98] — vermelho-coral, abre modal com select "Motivo"
  button "Cancelar" [ref_99] — abre modal DiscardChanges
  button "Salvar" [ref_100] type="submit"
