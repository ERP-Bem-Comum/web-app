# 114 — O erro do formulário diz QUAL regra caiu, começando por banco e PIX

> Fecha a **web-app#359**. Decisão da P.O. (02/09/2026): mensagem **por regra**, não por campo, e a
> primeira leva é **banco e PIX** — os campos que já custaram diagnóstico errado.

## Problema

Qualquer violação de schema nos cadastros de parceiros exibe sempre a mesma frase:

> Verifique este campo.

O custo não é de usabilidade. É de **diagnóstico**: ao popular a base, o `max(20)` do campo Banco
produziu duas hipóteses de causa erradas — "o campo rejeita acentos" e "rejeita dígitos" — que só
morreram quando alguém abriu o código-fonte. Uma mensagem que engana quem conhece o sistema é pior
que nenhuma mensagem.

## A causa real — e ela não é a que a issue descreve

A #359 propõe dar `error:` nomeado a cada regra dos schemas. Isso é **metade** do conserto, e a
metade que não resolve nada sozinha. O erro morre antes, no controller:

```ts
// 1. o Zod produz path E motivo
const parsed = SupplierFormSchema.safeParse(candidate)

// 2. o controller DESCARTA o motivo e guarda só "falhou"
const next: Record<string, boolean> = {}
for (const issue of parsed.error.issues) next[issue.path.join('.')] = true

// 3. a view rende uma constante
c.errors[key] === true ? t('partners.suppliers.form.invalid') : null
```

O estado de erro é `Record<string, boolean>` — **um booleano por campo**. O motivo nunca sai do laço.

**Prova de que o transporte é o gargalo:** `cnpj-invalid` já existe como erro nomeado em **três**
models (`supplier`, `financier`, `act`) desde sempre — e **ninguém o consome**. Não há tradução no
catálogo, não há leitor. É um erro nomeado que nunca chegou a uma tela. Nomear mais regras sem mexer
no transporte só produziria mais código morto.

## Regra

1. Cada regra dos schemas de **banco** e **PIX** ganha um erro nomeado, em `kebab-case` EN.
2. O controller passa a **carregar o slug**, não um booleano.
3. A view traduz o slug pelo catálogo PT-BR; slug desconhecido **cai na frase genérica de hoje**.

O ponto 3 é o que torna a entrega incremental: as regras ainda não nomeadas seguem exibindo
"Verifique este campo.", sem regressão e sem exigir nomear tudo de uma vez.

## Escopo

| #   | Item                                                                                        |
| --- | ------------------------------------------------------------------------------------------- |
| 1   | `BankAccountFormSchema` e `PixKeyFormSchema`: erro nomeado em cada regra                    |
| 2   | `act.model.ts` deixa de **duplicar** os dois schemas e passa a importá-los do Fornecedor    |
| 3   | Os 4 controllers de parceiro: `Record<string, boolean>` → `Record<string, string>` (o slug) |
| 4   | Fonte única slug → tag i18n, em `partners/client/shared/`                                   |
| 5   | As 7 views (criar + detalhe) traduzem o slug, com a frase genérica como fallback            |
| 6   | Catálogo PT-BR: uma frase por regra nomeada — e o `cnpj-invalid`, que enfim chega à tela    |
| 7   | Teste de governança: slug nomeado num schema **tem** de ter tradução                        |

### Por que o ACT entra pelo item 2

`collaborator.model.ts` e `financier.model.ts` **já importam** os dois schemas do Fornecedor — é o
reuso registrado na #40. O `act.model.ts` mantém uma **cópia literal**. Nomear as regras nas duas
cópias criaria dois lugares para editar a mesma frase, que é exatamente como a divergência começa.
Importar alinha o ACT ao que os outros três já fazem.

## Fora de escopo, e declarado

- **`programs` e `users`** têm controllers com o mesmo padrão e seguem com a frase genérica. Entram
  quando alguém pedir — a #359 pediu banco e PIX.
- **O teto de 140 da chave PIX não muda aqui.** O arquivo CNAB tem 99 posições (`G101`, 128-226) e o
  cadastro aceita 140, então uma chave entre 100 e 140 é aceita no cadastro e recusada na remessa.
  É defeito real, é da **#360**, e mexer no limite dentro desta fatia mudaria comportamento de
  cadastro sob o disfarce de mensagem de erro.
- **O `max(20)` do campo Banco não muda.** Ficou inofensivo desde que o campo virou seletor de código
  (#358, fechada) — mas a mensagem passa a dizer o que ele é, para o caso legado.

## Critérios de aceite

- [ ] **CA1** — Dado um cadastro com o campo Banco vazio, Quando o formulário é submetido, Então a
      mensagem diz **que o banco é obrigatório**, e não "Verifique este campo."
- [ ] **CA2** — Dado uma agência acima de 20 caracteres, Então a mensagem nomeia **o limite**.
- [ ] **CA3** — Dado uma chave PIX vazia com o bloco PIX preenchido, Então a mensagem nomeia **a
      chave**, não o campo genérico.
- [ ] **CA4** — Dado um CNPJ inválido, Então a tela exibe a mensagem de CNPJ — hoje o slug existe e
      morre no controller.
- [ ] **CA5** — Dado uma regra **ainda não nomeada** (ex.: `name`, `email`), Então a tela continua
      exibindo "Verifique este campo." — sem slug cru vazando para o usuário.
- [ ] **CA6** — Dado os quatro tipos de parceiro, Então **todos** exibem a mesma frase para a mesma
      regra: a fonte do texto é única.
- [ ] **CA7** — Governança: um slug nomeado num schema **sem** tradução no catálogo quebra o teste.
