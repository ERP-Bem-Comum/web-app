# Relatório de Melhorias — Sistema de Gestão (ERP Bem Comum)

**Proposta de 3 melhorias funcionais** · Elaborado pela Gestão de Produto · Julho/2026

---

## Apresentação

Durante a evolução do sistema, identificamos **três oportunidades de melhoria** que agregam **agilidade, controle e precisão** aos fluxos do dia a dia — nas áreas de **aprovação de pagamentos**, **conciliação bancária** e **cadastro de colaboradores**.

As três foram **avaliadas tecnicamente** e são **viáveis**: aproveitam a base já construída no sistema, o que **reduz o risco e o tempo de implementação**. Nenhuma delas envolve movimentação bancária — os efeitos são de organização, controle e visibilidade da informação.

Este relatório descreve, para cada melhoria, **o que ela é, o desafio que resolve, como funciona e os benefícios** que gera.

---

## Melhoria 1 — Aprovação de pagamentos por e-mail

### O que é

Permitir que os responsáveis (diretoria/aprovadores) **aprovem os pagamentos diretamente pelo e-mail**, sem precisar entrar no sistema — ideal para quem aprova **pelo celular, em movimento**. Além disso, o sistema passa a exibir **quem aprovou cada pagamento e quando**.

### Desafio atual

Hoje, aprovar um pagamento exige acessar o sistema e navegar até a tela de contas a pagar. Para a diretoria, que muitas vezes decide **fora do escritório e pelo celular**, isso gera **atraso e fricção** no fluxo. Também não há uma forma simples de visualizar **quem** aprovou e **quando**.

### Como funciona

- A equipe seleciona os títulos de um período e clica em **"Enviar para Aprovação"**, escolhendo o aprovador.
- O aprovador recebe um **e-mail com a lista de títulos** e aprova com **poucos toques, direto do celular**.
- A aprovação é **registrada automaticamente** no sistema — com o **nome do aprovador, a data** e a indicação de que foi feita por e-mail.

### Benefícios

- **Agilidade** na liberação de pagamentos (menos gargalo aguardando aprovação).
- **Conforto para a diretoria** — aprova de onde estiver, sem depender de acesso ao sistema.
- **Rastreabilidade total** — fica registrado quem aprovou, quando e por qual canal.
- **Controle e auditoria** reforçados.

### Segurança

Cada link de aprovação é **único, pessoal e temporário**. A ação **não movimenta dinheiro** — apenas registra a aprovação do título — e é **reversível**.

---

## Melhoria 2 — Ajuste de classificação contábil durante a conciliação

### O que é

Permitir **corrigir a classificação de uma despesa** (centro de custo, categoria e subcategoria) **no momento da conciliação bancária**, mantendo o mesmo título — sem precisar criar um lançamento duplicado.

### Desafio atual

Quando é necessário **reclassificar uma despesa** durante a conciliação, hoje cria-se um **lançamento manual paralelo**. Isso gera um título "duplicado" e deixa o original **sem conciliar**, o que **polui os relatórios e a execução orçamentária** e exige retrabalho.

### Como funciona

- Ao conciliar, o usuário pode **editar a classificação do próprio título**.
- O título é **conciliado normalmente** e a **nova classificação passa a valer** para os relatórios e o acompanhamento orçamentário.
- **Sem duplicações** e **sem afetar** outros lançamentos relacionados.

### Benefícios

- **Relatórios e orçamento mais fiéis à realidade** — refletem o gasto onde ele realmente ocorreu.
- **Fim das duplicidades** e dos títulos "presos".
- **Processo de conciliação mais limpo e confiável.**
- **Histórico da reclassificação** preservado (rastreabilidade).

### Impacto

Dados financeiros **mais confiáveis para a tomada de decisão** e um **orçamento que reflete o gasto real**, com menos retrabalho para a equipe.

---

## Melhoria 3 — Reenvio de convite no cadastro de colaboradores

### O que é

No cadastro de colaboradores, **mostrar a data em que o convite foi enviado** (o e-mail para o colaborador concluir o próprio cadastro) e permitir **reenviá-lo** quando necessário.

### Desafio atual

O novo colaborador recebe um e-mail para concluir o cadastro. Se ele **demora**, hoje **não há como reenviar** o convite facilmente, nem saber **quando foi enviado** — e o cadastro fica **parado**.

### Como funciona

- No painel de colaboradores, uma **coluna mostra a data do último envio**.
- Um **botão permite reenviar** o convite quantas vezes for preciso.
- Quando o colaborador **conclui o cadastro**, o botão se **desativa automaticamente**.

### Benefícios

- **Agilidade no onboarding** de novos colaboradores.
- **Menos cadastros parados** por falta de acompanhamento.
- **Visibilidade do status** de cada convite.
- **Autonomia** para a equipe de gestão/RH, sem depender de suporte técnico.

---

## Resumo dos ganhos

| Melhoria                            | Principal ganho                                        | Beneficiários                     |
| ----------------------------------- | ------------------------------------------------------ | --------------------------------- |
| **1. Aprovação por e-mail**         | Agilidade e mobilidade na aprovação + rastreabilidade  | Diretoria, Financeiro, Auditoria  |
| **2. Classificação na conciliação** | Relatórios e orçamento mais precisos, sem duplicidades | Financeiro, Contabilidade, Gestão |
| **3. Reenvio de convite**           | Onboarding mais rápido e autônomo                      | RH/Gestão de Pessoas              |

**Ganhos transversais:** mais **agilidade** nos processos, mais **controle e rastreabilidade**, dados mais **precisos** para decisão e mais **autonomia** para as equipes.

---

## Considerações finais

- As três melhorias estão **além do escopo inicial** do projeto e foram **validadas quanto à viabilidade técnica**.
- Aproveitam a **infraestrutura já existente** no sistema — o que **reduz o risco e acelera a entrega**.
- **Baixo risco operacional:** nenhuma envolve transação bancária; os efeitos são de organização e visibilidade da informação, e são **reversíveis**.
- Podem ser implementadas de forma **priorizada e em paralelo**, conforme a necessidade e o cronograma acordados.

---

_Documento elaborado pela Gestão de Produto para apreciação do cliente. Detalhes de implementação, cronograma e proposta comercial disponíveis mediante solicitação._
