# 112 — O seletor de banco alcança Colaborador, Financiador e ACT

> Extensão da **specs/108**, que levou o seletor FEBRABAN ao Fornecedor e à conta-cedente. Mesma
> regra, mesmo componente, mesmas telas de sempre — o que muda é a cobertura.

## Problema

A 108 trocou o banco de texto livre por seleção **só no Fornecedor**. Os outros três tipos de
favorecido continuaram com `<input>`:

|                   | Fornecedor | Colaborador | Financiador | ACT         |
| ----------------- | ---------- | ----------- | ----------- | ----------- |
| Antes desta fatia | seletor    | texto livre | texto livre | texto livre |
| Depois            | seletor    | **seletor** | **seletor** | **seletor** |

Isso não é assimetria cosmética. O CNAB 240 é **posicional** e exige o código de compensação. Um
input aceita `Bradesco`, `bradesco`, `237-2`, `Banco Bradesco S.A.` — tudo grava, nada falha na tela,
e a recusa aparece no banco, depois de a remessa ter sido transmitida. O favorecido de uma remessa
pode ser qualquer um dos quatro tipos; proteger um só deixava três portas abertas para o mesmo
defeito.

## Regra

Idêntica à 108, sem exceção nova: o banco é escolhido na tabela FEBRABAN (dois grupos — "Mais
usados" e "Todos os bancos"); o cadastro legado é **preservado** como opção própria, prefixada por
"Não reconhecido:", e acompanhado do aviso de que a transferência será recusada sem o código.

## Escopo

| #   | Item                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------- |
| 1   | **ACT: criar e detalhe** passam a usar o seletor — `act-edit` reusa o form de criar, então vem junto |
| 2   | **Financiador: criar e detalhe** — idem, `financier-edit` reusa                                      |
| 3   | **Colaborador: criar** (só ele — ver abaixo)                                                         |
| 4   | Rótulos e chaves i18n do seletor passam a ter **fonte única**, sem o tipo de parceiro no caminho     |
| 5   | Teste de governança que barra o retorno ao input livre                                               |

### Por que o Colaborador só ganha o CRIAR

`collaborator.model.ts` registra em duas linhas: `bankAccount` é **create-only** (#40) e _"a borda de
update faz strip"_. O detalhe já exibia o banco com `readOnly: true` por causa disso.

Pôr um seletor editável ali produziria o pior tipo de controle: aceita a troca, mostra o valor novo, e
o descarta no salvamento sem dizer nada. É o oposto da régua da specs/108 — que existe justamente para
o erro aparecer na tela, e não no banco. Banco editável no colaborador é mudança de contrato no
core-api, não de front, e está registrada como guarda de intenção no teste.

### Por que as chaves i18n perderam o tipo de parceiro

As cinco chaves do seletor (`bankPlaceholder`, `bankFrequent`, `bankAll`, `bankUnknown`,
`bankUnknownHint`) existiam como `partners.suppliers.form.*`. Com cinco telas consumindo, replicá-las
por tipo daria **20 chaves com texto idêntico** — vinte lugares para a redação divergir.

Passaram a `partners.form.bank*`, com as strings **inalteradas** (o texto validado no Fornecedor
continua palavra por palavra). O motivo do aviso é do arquivo CNAB, não de quem recebe o pagamento.
O **rótulo do campo** ("Banco") segue por tipo de propósito: ele acompanha a seção de cada formulário.

Os rótulos vivem em `partners/client/shared/bank-select-labels.ts`, e não junto do componente, porque
`src/shared/ui/**` não importa `#shared/i18n` em lugar nenhum — o átomo visual é burro por decisão
(ADR-0007/0008, §X), e a tradução é de quem monta a tela.

## O que este trabalho NÃO faz

- **Não valida o código no backend.** Segue valendo o da 108: o core-api aceita string livre em
  `bank_account_bank`. A régua é da tela; um cliente de API grava o que quiser. É o #708.
- **Não migra dados existentes.** Cadastro antigo só converte quando alguém abre a tela e escolhe.
- **Não adiciona o DV da agência do favorecido** — depende de campo novo no core-api (specs/107,
  core-api#859).
- **Não mexe na Conciliação.** Os modais de conta-cedente (`add-account-modal`, `edit-account-modal`)
  montam os `optgroup` inline, com chaves `financial.recon.add.*`, em vez de usar o `BankSelect`.
  É um terceiro padrão vivo, fora do pedido — anotado, não corrigido aqui.

## Fora de escopo

- **Campo de busca no seletor** — segue como na 108: componente novo no design system, entrega própria.
- **`collaborator-autocadastro`** — não tem campos bancários.

## Testes

- `tests/modules/partners/bank-select-adoption.test.ts` (5) — governança por scan de fonte: as sete
  telas com banco editável usam `<BankSelect>`; nenhuma mantém `setField('bank', e.target.value)` em
  paralelo; o aviso de cadastro legado acompanha todas; as chaves compartilhadas existem e não foram
  re-tipadas; e o detalhe do colaborador **não** tem seletor (guarda do #40).
- Herdados da 108, intactos: `febraban-banks.test.ts` (18) e `bank-select.spec.tsx` (7).

## Gate

`pnpm verify` 1875/1875 · `pnpm test:dom` 725/725.
