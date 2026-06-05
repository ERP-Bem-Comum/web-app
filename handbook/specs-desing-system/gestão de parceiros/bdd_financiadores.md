# language: pt

Funcionalidade: Gestão e Listagem de Financiadores
  Como um usuário com permissões de gestão
  Eu quero acessar o módulo de financiadores
  Para visualizar a lista de parceiros, consultar detalhes e cadastrar novos registros

  # --- NAVEGAÇÃO E LISTAGEM ---

  Cenário: Visualizar a listagem inicial de financiadores
    Dado que possuo as permissões necessárias de acesso
    E estou na página inicial (Dashboard)
    Quando eu acesso a opção "Financiadores" pelo menu lateral de "Gestão de Parceiros"
    Então o sistema deve exibir a listagem dos financiadores cadastrados
    E devo visualizar as colunas essenciais: Nome, Representante Legal, CNPJ e Status
    E a lista deve carregar respeitando o limite de paginação padrão

  # --- CADASTRO E FLUXO DE CANCELAMENTO ---

  Cenário: Acessar o formulário para adicionar um novo financiador
    Dado que estou na página de listagem de "Financiadores"
    Quando eu aciono a opção "Adicionar Financiadores"
    Então eu devo ser redirecionado para a tela de "Financiadores > Adicionar"
    E devo visualizar os campos em branco para preenchimento dos dados cadastrais

  Cenário: Cancelar a adição de um financiador sem preencher dados
    Dado que estou na tela de adicionar um novo financiador
    E não preenchi nenhum dado no formulário
    Quando eu aciono a opção de "Cancelar"
    Então eu devo retornar imediatamente para a tela de listagem de financiadores
    E nenhum novo registro deve ser criado

  # --- CONSULTA DE DETALHES ---

  Cenário: Consultar os dados detalhados de um financiador específico
    Dado que estou na página de listagem de "Financiadores"
    Quando eu seleciono um financiador específico na tabela (ex: "Financiador 1")
    Então eu devo ser redirecionado para a tela de "Financiadores > Detalhes"
    E devo visualizar as informações do financiador em formato somente leitura
    E a opção de "Editar" deve estar visível e disponível para uso