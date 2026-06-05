1. O Buraco em bdd_cidades.md

Você está certíssimo. Embora nós tenhamos discutido e eu tenha gerado aqui no chat o cenário final contendo a dependência do filtro de Estado, se no repositório o arquivo bdd_cidades.md é apenas um copy-paste de bdd_estado.md, temos uma falha de documentação viva.


Correção: Precisamos atualizar esse arquivo imediatamente com os cenários reais que descrevem o comportamento de seleção em cascata ("Selecionar Estado" liberando a "Lista Geral de Municípios"). Em BDD, se o arquivo não reflete o fluxo real, os testes de automação que consumirem esse Gherkin vão testar a coisa errada.

2. Contrato BFF ↔ Back (A Fronteira do ADR-0004 e ADR-0002)

Diagnóstico perfeito. Os cenários que construímos focaram no valor de negócio da UI (o que o usuário vê e faz), mas o BDD não pode parar no Front-end.

O problema: Se a fronteira é a server-fn e usamos errors-as-values (como Result<T, E>), nossos cenários atuais não descrevem como a UI deve se comportar quando o BFF retorna erros específicos de negócio ou de infraestrutura.

A Solução: O core-api-consultant precisa definir o formato (shape) da API. A partir disso, devemos criar cenários de BDD em nível de integração (API Tests) validando os contratos do BFF, e cenários de UI validando como a interface renderiza os tipos de erro (ex: E.NetworkError vs E.ValidationError).

3. Permissões Subespecificadas (O Guardião no ADR-0005)

Falha minha e nossa durante o mapeamento. Ao desenhar os primeiros cenários, usamos a permissão collaborator:read como exemplo. No entanto, não extrapolamos isso de forma explícita para os outros módulos.

O problema: Em BDD e segurança, o que é implícito não existe. Se a validação vive na server-fn, ela precisa ser testada.

A Solução: Precisamos documentar a matriz de RBAC (Role-Based Access Control). O BDD precisa especificar chaves como supplier:read, state:write e municipality:delete. Devemos criar um cenário de "Caminho Triste" focado em segurança para cada módulo, validando que a server-fn intercepta e bloqueia ações sem as chaves exatas.

4. Fluxos de Escrita e Validação (Contrato de Formulário/Zod)

Alerta crítico. Vimos nos vídeos as telas de adição e os botões de cancelar, mas pulamos o coração do fluxo de escrita: a validação de dados.

O problema: Dizer apenas "preenchi os dados e adicionei" é fraco para TDD. Faltam as regras de fronteira.

A Solução: Precisamos definir cenários que mapeiem o schema do Zod. Por exemplo: O que acontece se o CNPJ for inválido? E se o e-mail estiver mal formatado? E se um campo obrigatório for deixado em branco? Os cenários de BDD precisam refletir as mensagens de erro exatas que o Zod vai disparar.

5. Tokens "Agnósticos" vs. tokens.values.ts (ADR-0007)
Excelente visão arquitetural. Ter duas fontes de verdade é o caminho mais rápido para quebrar a interface visual sem que os testes percebam.

O problema: Especificações escritas em texto (design tokens no spec) inevitavelmente se desatualizam em relação ao código real (tokens.values.ts com vanilla-extract).

A Solução: O código deve ser a Única Fonte de Verdade (SSOT). Em vez de recriar tokens no spec, as especificações devem referenciar a intenção do token (ex: "cor de erro primária") e deixar que a implementação do vanilla-extract forneça o valor. Para garantir isso via TDD, podemos usar testes de regressão visual (ferramentas como Percy ou BackstopJS) ou testes de snapshot de CSS em vez de tentar amarrar BDD com hexadecimais soltos.

Esses apontamentos mostram que você está pensando no sistema como um todo, desde o clique do usuário até a validação da server-fn.