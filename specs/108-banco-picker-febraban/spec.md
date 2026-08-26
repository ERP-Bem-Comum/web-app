# 108 — O banco vira seleção, com a tabela FEBRABAN completa

**Tamanho:** M · **Status:** implementada (front) · **Data:** 2026-08-26
**Pedido por:** P.O. — "no cadastro de fornecedores o campo banco está aberto e aceita apenas o código
do banco, vamos alterar para que exiba as opções do banco em dropdown com a lista dos bancos da
FEBRABAN para que o usuário possa selecionar, coloque a lista mais atual; no cadastro de contas na
conciliação está assim, mas não sei se a lista está atualizada pela FEBRABAN"
**Depende de:** core-api#708 (aptidão do cadastro bancário ao CNAB 240)
**Fecha:** o item (5) do #708 do lado do FORMATO — _"corrigir o formato no front (picker banco
código→nome)"_, com a ressalva de que a **migração dos dados** continua sendo do backend.

## Problema

Dois cadastros, duas réguas, e nenhuma das duas certa:

|                 | Fornecedor (Parceiros)   | Conta-cedente (Conciliação)           |
| --------------- | ------------------------ | ------------------------------------- |
| Controle        | `<input>` de texto livre | `<select>` "código · nome"            |
| Lista           | nenhuma                  | **12 bancos escolhidos à mão** (#206) |
| O que era salvo | o que a pessoa digitasse | o código                              |

O favorecido é o lado que **morde no CNAB 240**: o arquivo grava o código de compensação em posição
fixa de 3 dígitos, e o cadastro entregava uma string livre. "Bradesco", "banco 237" e "0237" eram todos
aceitos e nenhum deles é o que o arquivo precisa. É o desencaixe estrutural que a core-api#708
documentou — aqui resolvido no ponto onde o dado nasce.

A lista da Conciliação, por sua vez, não era da FEBRABAN: eram 12 bancos comuns. Qualquer instituição
fora do topo do mercado obrigava a cair em "Outro" e digitar o nome — perdendo o código.

## Regra

> O banco é **escolhido numa lista**, e o que se guarda é o **código de compensação de 3 dígitos**.
> O nome é derivado da tabela na hora de exibir, nunca digitado.

A tabela é **única no produto** (`src/shared/banking/febraban-banks.ts`) e serve os dois cadastros.

## Escopo

| #   | Entrega                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------- |
| 1   | `src/shared/banking/febraban-banks.ts` — **471 instituições** com código de compensação, GERADO da fonte |
| 2   | `scripts/gen-febraban-banks.mjs` — regerador versionado, para a lista não envelhecer sem quem a atualize |
| 3   | `BankSelect` (`#shared/ui/brand`) — seletor "brand" com dois grupos e tratamento de valor legado         |
| 4   | Fornecedor: **criar, editar e detalhe** passam a usar o seletor (é o mesmo controller nos três)          |
| 5   | Conciliação: cadastro e edição de conta passam a ver a tabela completa, **mantendo o "Outro"**           |

### A fonte, e por que não é o CSV do Bacen

O CSV histórico do Bacen (`bcb.gov.br/pom/spb/estatistica/port/ParticipantesSTRport.csv`) responde 200 e
parece atual — mas o `last-modified` dele é **24/04/2023**. Usá-lo entregaria uma lista com três anos de
atraso, sem nenhum sinal de que está velha. A tabela vem da BrasilAPI (`/api/banks/v1`), que sincroniza
com o Bacen; a sincronização usada aqui é de **26/08/2026**.

O de-para fica **versionado no repo**, e não numa tabela no banco — a decisão de DoD que estava aberta
no #708. O motivo é simples: o seletor precisa da lista para _renderizar_, e trocar um arquivo de 25 KB
por uma dependência de rede num campo de formulário piora o cadastro em vez de melhorá-lo.

### Dois grupos, e não uma lista de 471

O seletor abre com **"Mais usados"** (os 12 que já eram a lista curada da Conciliação) e depois **"Todos
os bancos"**, ordenados por código. Os 12 repetem nos dois grupos de propósito: o rótulo é idêntico nos
dois lugares, então tanto faz por onde a pessoa escolhe — o campo mostra a mesma coisa depois.

A ordenação por código não é estética: como o rótulo **começa** pelo código (`237 · Bradesco`), o
type-ahead nativo do `<select>` faz "237" saltar direto para o Bradesco.

Para esses 12, o nome exibido é o **comercial** ("Nubank"), não o reduzido do Bacen
("NU PAGAMENTOS - IP") — é como o operador procura. Os nomes vieram da lista que já estava em produção.

## ⚠️ Cadastro legado: preservar, nunca apagar

Os fornecedores já cadastrados têm texto livre nesse campo. Ao abrir o formulário:

- **reconhecível sem ambiguidade** → convertido em silêncio (`0237`, `237 - Bradesco` → `237`);
- **irreconhecível** → **mantido**, entrando como opção própria no topo, marcada "Não reconhecido: …",
  com aviso em vermelho explicando o que fazer.

O que **não** acontece é adivinhar por nome. "Banco Santander" × "Santander" × "Santander Brasil"
resolveriam por heurística, e errar o banco aqui é pagamento recusado — o custo de acertar por sorte não
paga o de errar.

**A pendência não bloqueia o Salvar.** Alinhado à decisão (c) do #708 (a correção é do usuário): travar
a edição inteira por causa de um banco antigo impediria de corrigir o e-mail do fornecedor. O aviso
aparece toda vez que o cadastro for aberto, e o pré-voo da remessa continua sendo a última barreira.

## O que este trabalho NÃO faz

- **Não valida o código no backend.** O core-api segue aceitando string livre em `bank_account_bank`.
  A régua é da tela; um cliente de API ainda grava o que quiser.
- **Não migra os dados existentes.** Cadastro antigo só é convertido quando alguém abre a tela. O
  backfill em massa é a migração do #708, e continua com o backend.
- **Não adiciona o DV da agência do FAVORECIDO.** Continua havendo um só DV (o da conta). É o outro
  item do #708, e depende de campo novo no core-api — o mesmo impasse da specs/107 para o cedente
  (core-api#859).
- **Não implementa a invariante "banco OU PIX"** nem o alerta vermelho por título na tela do CNAB.

## Fora de escopo

- **Campo de busca no seletor.** Com 471 opções um combobox com filtro seria melhor que o `<select>`
  nativo, mas é componente novo no design system. O grupo "Mais usados" + o type-ahead por código
  cobrem o caso do dia a dia; se a busca fizer falta, vira entrega própria.
- **Remover o "Outro" da Conciliação.** Decisão da P.O. (26/08): conta de cartão corporativo pode não
  ter instituição com código, e é o "Outro" que libera o nome manual (#206).

## Testes

- `tests/shared/banking/febraban-banks.test.ts` (18) — os 12 códigos antigos continuam resolvendo
  (regressão de conta-cedente já cadastrada), todo código com 3 dígitos e único, ordenação, e o
  `toBankCode` **não** adivinhando por nome nem confundindo número de conta com banco.
- `tests/shared/ui/brand/bank-select.spec.tsx` (7) — os dois grupos, o código conhecido, o **valor
  legado preservado e sinalizado**, o retorno só do código e o modo desabilitado da tela de detalhe.
- `supplier-form.controller.spec.tsx` (+3) — normalização ao abrir e a preservação do irreconhecível.
