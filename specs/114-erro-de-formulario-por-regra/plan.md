# 114 — Plano

## Ordem, e por que ela é essa

O conserto tem duas metades e **só funciona nesta ordem**: nomear sem transportar reconstrói o código
morto que a fatia existe para remover (o `cnpj-invalid` provou isso por anos).

| #   | Passo                                         | Arquivos                                                      |
| --- | --------------------------------------------- | ------------------------------------------------------------- |
| 1   | Nomear cada regra de banco e PIX              | `data/model/supplier.model.ts`                                |
| 2   | ACT deixa de duplicar os schemas              | `data/model/act.model.ts`                                     |
| 3   | Fonte única slug → tag, com fallback genérico | `client/shared/form-error-labels.ts` _(novo)_                 |
| 4   | Controllers passam a carregar o slug          | os 4 `*-form.controller.ts`                                   |
| 5   | Views traduzem o slug                         | as 7 `*.component.tsx` (criar + detalhe)                      |
| 6   | Frases PT-BR                                  | `shared/i18n/catalog.pt-BR.ts`                                |
| 7   | Testes de comportamento + governança          | `tests/modules/partners/form-error-per-rule.test.ts` _(novo)_ |

## O que o passo 4 quebrou de propósito

`Readonly<Record<string, boolean>>` → `Readonly<Record<string, string>>` é mudança de contrato, e o
compilador cobrou: 3 comparações `=== true` em views e **6 testes existentes** que assertavam
`toBe(true)`. Todos atualizados — e os do ACT ficaram **mais fortes**, porque agora assertam o slug
(`'transfer-target-required'`, `'end-date-not-after-start'`) em vez de "algo falhou".

Regra ainda sem nome próprio passou a assertar `toBeDefined()`: é exatamente o que a tela faz com
ela — cai na frase genérica.

## Achado durante a execução

O **CA7 encontrou um segundo erro morto**: `cpf-invalid`, no Colaborador, nomeado e sem tradução,
pela mesma razão do `cnpj-invalid`. Ganhou frase junto. É a prova de que a governança precisava
varrer os models em vez de conferir uma lista escrita à mão — a lista não teria esse item.

## Duas regras do ACT entraram, e a distinção importa

- `transfer-target-required` — **dentro do escopo**: é regra de banco/PIX (falta um dos dois).
- `end-date-not-after-start` — **de carona**: a mudança de tipo já obrigava a tocar a linha, e
  deixá-la muda faria a vigência ser a única regra do ACT sem frase. Uma linha no catálogo.

⚠️ A mensagem do repasse diz **o que falta**; ela **não** muda **onde** o erro aparece — segue
ancorado no checkbox, que é o defeito da **#362**. Trocar o alvo aqui seria mudar a fatia sem dizer.

## Gate

`pnpm verify` — typecheck + lint (0 erros) + **1.896 testes, 0 falhas**.
`pnpm test:dom` — **729 testes, 0 falhas** (o `verify` não o inclui).

O único warning nos arquivos novos é `security/detect-non-literal-fs-filename`, o mesmo que o
`bank-select-adoption.test.ts` já carrega: é scan de fonte em teste de governança, por desenho.

## Fora, e declarado

`programs` e `users` têm o mesmo padrão de controller e seguem na frase genérica — a #359 pediu
banco e PIX. O teto de 140 da chave PIX **não** mudou: é da #360, e o arquivo CNAB aceita 99.
