# financiadores.listagem.dom.txt
# Capturado via read_page em /financiadores
- textbox "Pesquise" [ref_15] — sem botão de filtro (módulo mais simples)
- button "Adicionar Financiadores" [ref_17]
- table [ref_18]
  cols: NOME · REPRESENTANTE LEGAL · CNPJ · STATUS
  rows (5):
    [ref_23] "Financiador 1" · "Anderson" · "08.779.584/0001-57" · "Ativo"
    [ref_28] "Financiador G2-1" · "FG2-1" · "23.823.568/0001-08" · "Ativo"
    [ref_33] "João Silva" · "João Silva" · "49.120.593/0001-19" · "Ativo"
    [ref_38] "Software House 1" · "Antonio Leal" · "50.986.812/0001-26" · "Ativo"
    [ref_43] "Teste 01 v" · "vteste" · "87.671.663/0001-16" · "Inativo"
- combobox "5" [ref_49] — itens/página | button anterior [ref_50] | button próximo [ref_51]

# financiadores.detalhe.dom.txt
# Capturado via read_page em /financiadores/detalhes/1
- button [ref_54] — BackButton
- form [ref_56] (sem seção nomeada)
  textbox "Nome do Financiador" [ref_58] — "Financiador 1"
  textbox "Razão Social" [ref_61] — "Financiador 1"
  textbox "CNPJ" [ref_64] — "08.779.584/0001-57"
  textbox "Telefone" [ref_67] — "(15)99721-3285"
  textbox "Representante Legal" [ref_70] — "Anderson"
  textbox "Endereço" [ref_73] — "Rua Dionísio, 1"
  button "Voltar" [ref_75]
  button "Editar" [ref_76]

# financiadores.editar.dom.txt
# Capturado via read_page em /financiadores/editar/1
# Mesmos campos habilitados +
  button "Desativar" [ref_98] type="button"
  button "Cancelar" [ref_99] type="button"
  button "Salvar" [ref_100] type="submit"
