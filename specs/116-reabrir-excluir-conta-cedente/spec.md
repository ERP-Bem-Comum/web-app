# 116 — Encerrar deixa de ser beco: Reabrir e Excluir conta-cedente

**Tamanho:** M · **Status:** implementada (front) · **Data:** 2026-09-06
**Depende de:** `core-api#995` (B1 reabrir · B3 excluir · B8 convênio editável) — **entregue** nos PRs
`core-api` #997 e #998, na `dev`
**Origem:** incidente em PRODUÇÃO, 06/09/2026

## Problema

Encerrar uma conta-cedente era **terminal e absorvente**: não havia rota para reabrir, e a conta
encerrada **continuava ocupando a chave natural** (banco/agência/conta/dígito). Uma conta encerrada por
engano ficava presa pelos dois lados — não voltava e não podia ser recadastrada.

Aconteceu em produção. A conta migrada do legado veio com dados que o operador não conseguia corrigir,
ele criou contas novas para conseguir gerar remessa, e a tentativa de limpar a bagunça (encerrar a
duplicata e recadastrar) bateu num `409` sem saída. Nas palavras da P.O.:

> _"a conta não foi encerrada pelo banco, ela foi encerrada só no sistema, mas se eu soubesse que
> barraria um novo cadastro eu não teria feito."_

## Regra

| ação                          | transição            | linha na listagem          | chave natural | reversível           |
| :---------------------------- | :------------------- | :------------------------- | :------------ | :------------------- |
| **Encerrar**                  | `Active` → `Closed`  | fica (filtro "Encerradas") | **ocupada**   | **sim**, via Reabrir |
| **Reabrir**                   | `Closed` → `Active`  | volta para as ativas       | ocupada       | —                    |
| **Excluir** (só em encerrada) | `Closed` → `Deleted` | **sai**                    | **liberada**  | não, pela tela       |

Excluir é **soft delete** no backend: remessas, conciliações e extrato apontam para o `id`, e apagar de
verdade quebraria essas referências. O histórico sobrevive.

## Escopo

| #   | Entrega                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cadeia completa de `reopen` e `delete`: io-schemas → porta → cliente core-api → composition → server fns → repositório → binding |
| 2   | **Reabrir age DIRETO**, sem modal (ver a decisão abaixo), com o botão da linha em estado "Reabrindo…"                            |
| 3   | **Excluir com confirmação**, em modal próprio que diz o que muda em relação a ficar encerrada — e que o histórico é preservado   |
| 4   | O erro do reabrir aparece na página: sem modal, é a única evidência que o operador tem                                           |
| 5   | **Convênio destrava na conta encerrada** (B8.1/B8.3), e **limpar** o campo viaja como string vazia (B8.2)                        |
| 6   | Revisão do texto de encerramento — ele passou a mentir no momento em que Reabrir e Excluir existiram                             |

### ⚠️ A assimetria entre as duas ações é deliberada

**Reabrir não pede confirmação.** É o caminho de RECUPERAÇÃO de quem encerrou por engano, e é
trivialmente desfazível: basta encerrar de novo. Uma confirmação ali cobraria mais atenção para
consertar o erro do que para cometê-lo, que é o avesso do que a tela deve fazer.

**Excluir pede.** No backend é soft delete, mas para o operador o efeito é terminal: a conta some da
listagem e não há caminho na tela para trazê-la de volta.

Há teste prendendo as duas metades — se alguém "uniformizar", quebra.

### O convênio e o conflito de NSA

A trava do **#722** existe porque o convênio viaja no **nome** de toda remessa transmitida: reescrevê-lo
numa conta ativa faria as remessas antigas apontarem para um contrato que ela não declara mais.

Em conta **encerrada** não há remessa nova a nomear. Travar ali não protegia nada — só forçava `UPDATE`
direto no banco de produção. É por este campo que o operador **desativa a numeração da linha morta**
(convênio **vazio**) e desfaz o conflito de NSA com a conta irmã, sem depender de ninguém.

⚠️ O sentinela é o **vazio**, não `000000`. `checkCedenteConvenio` aceita `000000` — a conta zerada assim
continuaria no seletor "Conta que paga", e o arquivo sairia com `Contrato: 000000` **depois** do NSA
queimado. O vazio é recusado com `cedente-convenio-missing` **antes** do `allocateNsa`.

⚠️ Duas pontas mudaram juntas: `min(1)` saiu do schema da fronteira (senão o "limpar" morreria no BFF) e
o submit passou a enviar o vazio quando a conta está encerrada (senão a régua antiga o descartaria).

## O texto de encerramento, terceira versão

Ele já esteve errado duas vezes, e as duas ficam registradas no catálogo porque a lição é a mesma:

1. _"Esta ação é irreversível: a conta não poderá ser reaberta."_ — verdadeiro e **insuficiente**: calava
   que a chave continua ocupada, que é o que pegou a P.O.
2. Acrescentou _"NÃO poderá ser cadastrada de novo"_ — e **nasceu com data de validade**, porque a #995
   já estava desenhada. Durou horas.
3. Agora: encerrar **é** reversível, e a chave só é liberada pelo excluir. O texto diz **onde estão as
   duas saídas**, que é o que o operador precisa saber antes de decidir.

## ⚠️ O Excluir foi ESCONDIDO na promoção para produção (06/09/2026)

A cadeia do front está completa, correta e testada. O que impede o ciclo de fechar é do **core-api**:
o `save()` do `cedente-account-store.drizzle.ts` monta o upsert com `naturalKeySlot` na lista do
`INSERT` mas **não** na do `onDuplicateKeyUpdate`. Excluir uma conta que já existe cai sempre no
caminho do `UPDATE`, então o `status` vira `Deleted` com o slot ainda em `'LIVE'`, violando o `CHECK`
que a própria #995 criou:

```sql
(status <> 'Deleted') OR (natural_key_slot = id)
```

Medido no ambiente local, com `ROLLBACK`:

```
UPDATE ... SET status='Deleted'                      → ERROR 3819:
    Check constraint 'fin_cedente_accounts_status_deleted_chk' is violated
UPDATE ... SET status='Deleted', natural_key_slot=id → OK
```

**Decisão da P.O.:** esconder o botão em vez de entregá-lo quebrado. Botão visível que nunca funciona
ensina o operador a desconfiar da tela, e esse custo sobrevive ao conserto. As outras saídas do
encerramento — **Reabrir** e o **convênio editável** — funcionam e foram promovidas.

**Como é feito:** o grid recebe `canDelete: boolean`; a página passa o literal `false`. Não é código
morto — é uma chave, e há teste cobrindo os dois estados (`accounts-grid.spec.tsx`).

**Para repor:** `naturalKeySlot: row.naturalKeySlot` no `set:` do upsert do core-api, e o literal da
página vira `true`. Nada mais — nem a cadeia, nem os textos, nem os testes.

## Saldo de abertura editável (core-api#999)

Entrou junto porque é a **origem operacional** das duplicatas que a #995 trata: a conta migrada do
legado veio com o saldo congelado, e não poder corrigi-lo foi o que levou o operador a criar contas
novas para conseguir gerar remessa. O backend liberou; o front não tinha tela.

Duas regras do contrato governam a implementação, e nenhuma é opcional:

- **FR-006 — o par é coeso.** Saldo sem data (ou o contrário) volta `opening-balance-requires-date`.
  Validado na tela, com mensagem própria, em vez de virar um 4xx genérico.
- **FR-008 — mexer no saldo entra na trava do DADO BANCÁRIO.** Conta com extrato importado recusa com
  `cedente-account-bank-data-locked`, porque o saldo de abertura é a premissa de todo saldo calculado
  depois.

### ⚠️ Por isso o submit só envia o par quando ele MUDOU

O backend decide a trava por **presença**, não por valor: reenviar o mesmo saldo já dispara o
`bank-data-locked`. Os campos abrem pré-preenchidos com o que está gravado (para corrigir, não
redigitar), e o submit compara com o `target` antes de mandar.

Sem essa comparação, abrir a edição e salvar **qualquer** campo — o apelido, por exemplo — passaria a
falhar em toda conta com histórico.

### A semeadura da data fatia a string, nunca `new Date(iso)`

`new Date('2026-09-01')` é interpretado como UTC e, no fuso de Brasília, volta 31/08. A data andaria um
dia para trás a cada abertura da edição, e o operador salvaria o retrocesso sem perceber. Há teste.

### O texto dos imutáveis mudou junto

Dizia _"CNPJ e saldo de abertura não podem ser alterados"_. Com os campos editáveis logo acima, a frase
passaria a contradizer a tela. Sobrou o CNPJ, que segue imutável de verdade.

## Fora de escopo

- **A conta excluída no seletor "Alterar conta".** O desenho da #995 (B5) previa que ela continuasse
  alcançável ali, para o histórico. O `list` do core-api **sempre** exclui `Deleted`, então ela só
  resolve por `GET /:id`. Divergência anotada; é ajuste do backend, não da tela.
- **Chave natural canônica** (bloco A da #995) — é o que impede a duplicata de entrar por outra grafia
  (`'7' ≠ '007'`), e é backend.

## Testes

- `reopen-delete-account.binding.spec.tsx` (novo, 9) — a assimetria (reabrir sem confirmação × excluir
  com), o `reopeningId` marcando a linha, invalidação do grid, falha virando tag sem invalidar, o modal
  do excluir permanecendo aberto no erro, e `confirm` sem alvo como no-op.
- `accounts-grid.spec.tsx` (+2) — o Excluir ausente com `canDelete` falso (e o Reabrir presente), e
  de volta com `canDelete` verdadeiro, mandando a linha certa. É o que prova que esconder é uma chave.
- `edit-account.binding.spec.tsx` (+10) — o saldo pré-preenchido, a data **não** recuando um dia, o par
  não viajando quando nada mudou, o par inteiro viajando quando o saldo muda, e o FR-006 recusado na
  tela; mais convênio travado na ativa e destravado na encerrada, o setter
  no-op quando travado, o **vazio viajando** na encerrada, e o vazio **não** viajando na ativa.
