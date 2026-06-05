# language: pt

Funcionalidade: Acesso e Listagem de Colaboradores
  Como um usuário do sistema
  Eu quero acessar a área de colaboradores
  Para poder visualizar a equipe, respeitando as regras de segurança e dados

  # --- REGRA 1: Permissões e Acesso ---

  Cenário: Tentativa de acesso ao módulo sem permissões adequadas
    Dado que estou logado no sistema
    Mas não possuo a permissão "collaborator:read"
    Quando eu tento acessar o módulo de "Colaboradores" pelo menu
    Então o sistema não deve exibir os dados do módulo
    E deve exibir uma mensagem clara informando que o acesso foi bloqueado por falta de permissões
    E deve orientar a busca pelas pessoas competentes para liberação

  Cenário: Tentativa de acesso direto por URL sem permissões adequadas
    Dado que estou logado no sistema
    Mas não possuo a permissão "collaborator:read"
    Quando eu tento navegar diretamente para a URL da lista de colaboradores
    Então o sistema deve bloquear o acesso à página
    E deve exibir a mesma mensagem clara sobre a falta de permissão e próximos passos

  # --- REGRA 2: Estado dos Dados ---

  Cenário: Acesso a uma lista de colaboradores sem dados cadastrados
    Dado que possuo a permissão "collaborator:read"
    E não existe nenhum colaborador cadastrado no banco de dados
    Quando eu acesso a tela de "Colaboradores"
    Então eu não devo ver uma tabela vazia
    E devo ver uma mensagem clara informando que não existem colaboradores cadastrados

  Cenário: Navegação em uma lista com grande volume de colaboradores (Paginação)
    Dado que possuo a permissão "collaborator:read"
    E o sistema possui 15 colaboradores cadastrados
    Quando eu acesso a tela de "Colaboradores"
    Então eu devo ver apenas os 10 primeiros registros na listagem
    E devo visualizar o controle de paginação para acessar os demais registros

  # --- REGRA 3: Resiliência (Com a ressalva de UX) ---

  Cenário: Falha de comunicação com o servidor de colaboradores
    Dado que possuo a permissão "collaborator:read"
    E o serviço de listagem de colaboradores está indisponível ou lento
    Quando eu acesso a tela de "Colaboradores"
    Então o sistema deve manter o indicador de carregamento (loading) na tela