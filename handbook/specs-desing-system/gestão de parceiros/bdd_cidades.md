# language: pt

Funcionalidade: Gestão de Estados Parceiros
  Como um usuário com permissões de gestão
  Eu quero acessar o módulo de Estados
  Para selecionar, buscar e remover estados parceiros da operação do sistema

  # --- VISUALIZAÇÃO E BUSCA ---

  Cenário: Visualizar os painéis de estados disponíveis e adicionados
    Dado que possuo as permissões necessárias
    Quando eu acesso a opção "Estados" pelo menu de "Gestão de Parceiros"
    Então o sistema deve exibir simultaneamente a "Lista Geral de Estados" e a lista de "Estados Parceiros Adicionados"
    E ambas as listas devem possuir campos de busca independentes

  Cenário: Buscar por um estado específico nas listas
    Dado que estou na tela de gestão de "Estados"
    Quando eu pesquiso por um nome de estado válido (ex: "Rio Grande") no campo de busca
    Então a lista correspondente deve ser filtrada
    E deve exibir apenas os estados que contêm o termo pesquisado

  Cenário: Buscar por um estado inexistente na lista de adicionados
    Dado que estou na tela de gestão de "Estados"
    Quando eu pesquiso por um estado que não está na lista de "Estados Parceiros Adicionados"
    Então a lista de adicionados deve ficar vazia
    E o sistema deve exibir a mensagem "Nenhum resultado encontrado"

  # --- ADIÇÃO DE ESTADO ---

  Cenário: Adicionar um novo estado parceiro com sucesso
    Dado que o estado "Rio Grande do Sul" está disponível na "Lista Geral de Estados"
    Quando eu aciono a ação de adicionar este estado
    Então o estado "Rio Grande do Sul" deve ser movido para a lista de "Estados Parceiros Adicionados"
    E o botão de adição na lista geral deve ter seu status alterado para "Adicionado" (bloqueado)

  # --- REMOÇÃO E PROTEÇÃO DE DADOS ---

  Cenário: Desistir da remoção de um estado parceiro (Proteção)
    Dado que o estado "Rio Grande do Sul" está na lista de "Estados Parceiros Adicionados"
    Quando eu aciono a ação de remover este estado
    Então o sistema deve exibir um alerta de atenção sobre a existência de orçamentos criados
    E quando eu escolho a opção "Descartar alterações"
    Então o estado deve permanecer na lista de adicionados sem alterações

  Cenário: Confirmar a remoção de um estado parceiro com sucesso
    Dado que o estado "Rio Grande do Sul" está na lista de "Estados Parceiros Adicionados"
    E eu aciono a ação de remover este estado
    E o sistema exibe o alerta de atenção sobre orçamentos
    Quando eu escolho a opção "Sim, salvar alterações"
    Então o sistema deve exibir uma mensagem de "Estado removido com sucesso!"
    E o estado deve desaparecer da lista de adicionados
    E deve voltar a ficar disponível para adição na "Lista Geral de Estados"