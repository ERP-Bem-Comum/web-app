# language: pt

Funcionalidade: Gestão e Listagem de Fornecedores
  Como um usuário com permissões gerenciais
  Eu quero acessar o módulo de fornecedores
  Para visualizar, filtrar, consultar detalhes e cadastrar novos parceiros

  # --- LISTAGEM E PAGINAÇÃO ---

  Cenário: Visualizar a listagem inicial de fornecedores
    Dado que possuo as permissões necessárias
    E estou na página inicial (Dashboard)
    Quando eu acesso a opção "Fornecedores" pelo menu de Gestão de Parceiros
    Então o sistema deve exibir a listagem dos fornecedores cadastrados
    E devo visualizar as informações essenciais (Nome, E-mail, CNPJ e Status)
    E a lista deve ser paginada corretamente

  # --- FILTROS DE BUSCA ---

  Cenário: Filtrar fornecedores com sucesso
    Dado que estou na página de listagem de "Fornecedores"
    Quando eu aplico um filtro por "Status do fornecedor" (ex: "Inativo")
    E executo a busca
    Então a tabela deve ser atualizada
    E deve exibir apenas os fornecedores que correspondem ao filtro selecionado

  Cenário: Filtrar fornecedores sem resultados correspondentes (Estado Vazio)
    Dado que estou na página de listagem de "Fornecedores"
    Quando eu aplico múltiplos filtros restritivos (ex: Status "Inativo" e Categoria "Buffet")
    E executo a busca
    Então a tabela de resultados deve ficar vazia
    E o sistema deve exibir a mensagem "Nenhum resultado encontrado" para orientar o usuário

  # --- DETALHES E CADASTRO ---

  Cenário: Consultar os detalhes de um fornecedor cadastrado
    Dado que estou na página de listagem de "Fornecedores"
    Quando eu seleciono um fornecedor específico na tabela
    Então eu devo ser redirecionado para a tela de "Detalhes" do fornecedor
    E devo visualizar seus dados cadastrais e bancários bloqueados para edição
    E a opção de "Editar" deve estar disponível na tela

  Cenário: Cancelar a inclusão de um novo fornecedor com proteção de dados
    Dado que iniciei o processo em "Adicionar Fornecedores"
    E preenchi dados parciais no formulário de cadastro
    Quando eu aciono a opção de "Cancelar"
    Então o sistema deve interromper o cancelamento
    E deve exibir um alerta pedindo a confirmação para descartar as alterações
    E ao confirmar o descarte, devo retornar à tela anterior sem salvar os dados