# fornecedores.listagem.dom.txt
# Capturado via read_page em /fornecedores
- button [ref_14] — filtro toggle (funil)
- textbox "Pesquise" [ref_16]
- button "Adicionar Fornecedores" [ref_18]
- table [ref_19]
  cols: NOME · EMAIL · CNPJ · CONTRATOS/ADITIVOS · STATUS
  rows (5 visíveis):
    [ref_25] "Banco Bradesco S.A." · "nicole.ruivo@going2.com.br" · "60.746.948/0001-12" · "Ativo"
    [ref_30] "FORNECEDOR 01" · "fornecedor01@email.com" · "07.191.165/0001-37" · "Inativo"
    [ref_35] "Fornecedor 2705-1" · "nicole-erp@tuamaeaquelaursa.com" · "66.440.091/0001-94" · "Ativo"
    [ref_40] "Fornecedor dashboard" · "fornecedor1@gmail.com" · "36.206.709/0001-95" · "Ativo"
    [ref_45] "Fornecedor de Março" · "forncecedor@email.com" · "49.120.593/0001-19" · "Ativo"
- combobox "5" [ref_51] — itens/página (5, 10, 25)
- button [ref_52] — anterior | button [ref_53] — próximo

# fornecedores.filtros.dom.txt
- combobox "Status de contrato:" [ref_13]
  opções: Possuem contratos · Não possuem contratos · Contratos em vigência
- combobox "Status do fornecedor:" [ref_15]
  opções: Ativo · Inativo
- combobox "Categoria de serviço:" [ref_17]
  opções (22): Água · Alimentação · Ar condicionado · Assessoria · Auditoria Externa
  · Buffet · Compras e suprimentos · Consultoria · Contábeis · Material de Consumo
  · Material de Informática · Material de Limpeza · Material Expediente · Obras
  · Organização de eventos · Pintura · Produção · Reserva de Hospedagem
  · Segurança · Serviços Administrativos · Transporte · Vidraçaria
- button "Filtrar" [ref_19]
- button "Exportar" [ref_20]

# fornecedores.detalhe.dom.txt
# Capturado via read_page em /fornecedores/detalhes/11
- button [ref_56] — BackButton
- form [ref_58]
  Seção 1 "Dados cadastrais do fornecedor:"
    textbox "Nome" [ref_61] — "Banco Bradesco S.A."
    textbox "E-mail" [ref_64] — "nicole.ruivo@going2.com.br"
    textbox "CNPJ" [ref_67] — "60.746.948/0001-12"
    textbox "Razão Social" [ref_70] — "Banco Bradesco S.A."
    textbox "Nome Fantasia" [ref_73] — "Banco Bradesco S.A."
    combobox "Categoria de Serviço" [ref_76]
    combobox "Avaliação De Serviço" [ref_80]
    textbox "Comentário da Avaliação" [ref_84]
  Seção 2 "Dados Bancários:"
    combobox "Banco" [ref_88]
    textbox "Agência - DV" [ref_92] — "0288-7"
    textbox "Número da Conta" [ref_95] — "0476781"
    textbox "DV" [ref_98] — "0"
  Seção 3 "Dados PIX:"
    combobox "Tipo de chave:" [ref_101] — "CPF"
    textbox "Chave PIX" [ref_105] — "472.697.718-04"
  button "Voltar" [ref_107]
  button "Editar" [ref_108]
