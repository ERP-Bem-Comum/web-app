# 118 — Número do contrato informável na criação

**Tamanho:** M · **Status:** spec (aguardando backend) · **Data:** 2026-10-01
**Depende de:** `core-api#1024` (número aceito no `POST /contracts`, normalizado, gerador pula ocupados)
**Origem:** pedido da P.O., porque o cliente tem contratos vigentes com numeração própria
**Emenda:** `specs/019-contract-number-program` (FR-002, FR-006 e a entidade "intenção de criação")

## Problema

Em Contratos > Novo Contrato a usuária **não informa o número**: o backend sempre gera o próximo número
do ano. O cliente tem **contratos vigentes com numeração própria**, e eles precisam entrar no ERP com
esse número.

Hoje o topo do formulário mostra "CT 0001/AAAA". Esse texto é fixo (`contract-form.component.tsx:226-228`):
não é o próximo número real, e o número gerado nunca aparece nesta tela.

## Regra

- O número do contrato passa a ser **informável** na criação.
- **Vazio** mantém o comportamento de hoje: o sistema gera o próximo número livre do ano.
- **Preenchido:** o contrato é criado com esse número, de **qualquer ano** (um vigente de 2024 mantém
  `0123/2024`).
- O campo é **opcional** e **não tem trava por data**. Em 2026 a usuária vai informar o número em todos
  os cadastros. Em 2027 o sequencial volta a ser o caminho normal e começa em `0001/2027`: o backend
  conta por ano e pula os números já informados à mão.
- **Depois de criado, o número não muda.** O core-api trata o número como imutável e a edição continua
  sem ele. Um número digitado errado se corrige excluindo e recriando o contrato.

| Entrada                        | Resultado                                                    |
| :----------------------------- | :----------------------------------------------------------- |
| vazio                          | número gerado pelo sistema, como hoje                        |
| `0123/2024`                    | criado como `0123/2024`                                      |
| `123/2024`                     | criado como `0123/2024` (o backend normaliza para 4 dígitos) |
| `12/2024`, `ABC`, `12345/2026` | recusado na tela: formato inválido                           |
| número já existente            | recusado pelo backend (409), com mensagem própria            |

## Escopo

| #   | Entrega                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------- |
| 1   | Campo **"Número do contrato"** no Novo Contrato, com a ajuda "Deixe vazio para gerar automaticamente"          |
| 2   | O "CT 0001/AAAA" fixo do topo sai. O prefixo (CT/OS) continua vindo da classificação                           |
| 3   | Validação de formato `NNN/AAAA` ou `NNNN/AAAA` no schema do form, no io-schema do BFF e no tipo de domínio     |
| 4   | O adapter envia `sequentialNumber` **só quando preenchido**                                                    |
| 5   | Erros: o 409 de número repetido ganha mensagem própria e o 422 de formato cai no `invalid-code`, que já existe |
| 6   | Docs: emenda da spec 019 e esclarecimento do ADR-0013                                                          |

## Desenho da tela

```
 Novo Contrato                                    CT · número a definir
 Dados Básicos
 Classificação *                Número do contrato
 (●) Contrato  ( ) OS           [ 0123/2024        ]
                                Deixe vazio para gerar automaticamente
```

- **Máscara:** só dígitos e a barra. A barra entra sozinha antes dos 4 últimos dígitos, e o campo aceita
  até `NNNN/AAAA`.
- **Topo:** com o campo preenchido, mostra o número informado com o prefixo da classificação (`CT 0123/2024`).
  Vazio, mostra o prefixo e "número a definir": o número real só existe depois de salvar, e um número
  provisório seria inventado no front (ADR-0013).

## Contrato com o backend (core-api#1024)

- **Entrada:** `sequentialNumber?: string` no `POST /api/v2/contracts`, nos dois modos. O front manda o
  valor sem prefixo (`0123/2024`) e omite o campo quando vazio.
- **Resposta:** inalterada (`sequentialNumber` já vem no item).
- **Erros:**
  - `contract-sequential-number-duplicated` (409) vira o erro novo `contract-number-duplicated`, com a
    mensagem "Já existe um contrato com este número."
  - `ContractSequentialNumberInvalidFormat` (422) passa a cair em `invalid-code` ("Código do contrato
    inválido."). Hoje os dois caem em `server` ("Algo deu errado").

**Ordem de entrega:** o front só vai para `develop` depois que a #1024 estiver na `dev` do core-api. Até
lá o core-api **descarta o campo em silêncio** (o schema não é `.strict()`), e o contrato sairia com o
número gerado, não com o informado.

## Onde mexe

| Camada          | Arquivo                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| View            | `contract-create/components/contract-form.component.tsx` (campo + topo, `:226-228`)                                       |
| Controller      | `contract-create/components/contract-form.controller.ts` (estado inicial e `submit()`)                                    |
| Model (client)  | `contracts/client/data/model/contracts.model.ts:169` (`CreateContractInputSchema`)                                        |
| io-schema (BFF) | `contracts/server/adapters/contracts.schemas.ts:142`. O drift guard `:258` obriga a mudar junto o domínio                 |
| Domínio (BFF)   | `contracts/server/domain/contracts.types.ts:171` (`CreateContractInput`) e `:15-40` (união de erros)                      |
| Adapter         | `contracts/server/adapters/core-api/core-api-contracts.ts:585-641` (corpo e comentário `:586`) e `SLUG_TO_ERROR` `:35-77` |
| Erro → tag      | `contracts/client/data/helpers/contracts-error-tag.ts`                                                                    |
| i18n            | `catalog.pt-BR.ts`: rótulo, ajuda, "número a definir" e a mensagem do 409                                                 |

## Pontos de atenção

- **O regex do formato vive no backend** (`/^\d{3,4}\/\d{4}$/`). No front ele entra só como validação de
  borda, para a usuária não esperar o 422. A fonte da verdade continua sendo o core-api.
- **O slug do 422 de formato precisa ser conferido** na resposta real do core-api antes de mapear. O
  core-api às vezes colapsa o slug num `code` genérico. O 409 de duplicata já está no `SLUG_TO_ERROR`
  (`:42`), então esse slug chega.
- **O CSV da lista ignora a classificação** (`contract-list.view-model.ts:193`): toda linha sai "CT".
  Isso já acontece hoje, mas fica mais visível com números próprios. O conserto entra junto, porque é
  uma linha.
- **ADR-0013** diz que o número de negócio vem "sempre do backend… nunca gerado/inventado no front".
  Um número **digitado pela usuária** não é inventado, e o backend continua sendo quem grava e valida.
  O ADR está `Accepted`, então o esclarecimento sai num ADR novo com `supersedes` parcial (skill
  `adr-author`), não numa edição.

## Fora de escopo

- **Editar o número depois de criado.** O core-api trata o número como imutável (R2).
- **Prefixo próprio do cliente** (`CT-045/2023` e similares). A P.O. confirmou que a numeração dos
  vigentes é `NNNN/AAAA`.
- **Trava por data** ("obrigatório até 31/12/2026"). A P.O. decidiu pelo campo opcional sempre.

## Decisões da P.O. (01/10)

- **Formato:** a numeração própria dos vigentes cabe em `NNNN/AAAA` (ex.: `0123/2024`). O formato do
  domínio não muda.
- **Ano:** qualquer ano.
- **Obrigatoriedade:** opcional sempre, sem trava por data.
- **Imutável depois de criado** (R2). Um número digitado errado se corrige excluindo e recriando o contrato.

## Testes (planejados)

- **Schema do form:** vazio passa; `0123/2024` e `123/2024` passam; `12/2024`, `ABC`, `12345/2026` e
  `0123/24` são recusados.
- **Controller:** `submit()` omite `sequentialNumber` quando vazio e envia o valor aparado quando
  preenchido.
- **Adapter:** o corpo do `POST` leva `sequentialNumber` só quando presente.
  - `contract-sequential-number-duplicated` vira `contract-number-duplicated`.
  - `ContractSequentialNumberInvalidFormat` vira `invalid-code`.
- **Tag de erro:** `contract-number-duplicated` vira `contracts.error.number-duplicated`.
- **View:** o topo mostra "número a definir" com o campo vazio, e `CT 0123/2024`/`OS 0123/2024` com ele
  preenchido.
- **CSV:** OS sai com prefixo "OS".
