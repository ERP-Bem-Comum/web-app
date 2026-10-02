[← Voltar para ADRs](./README.md)

# ADR-0022: Número do contrato informado pela usuária na criação não é "número inventado no front"

- **Status:** Accepted
- **Date:** 2026-10-02
- **Deciders:** Alessandra Castro (P.O. / Frontend) + assistente IA
- **Supersedes (parcial):** [ADR-0013](./0013-id-format-convention.md), só a regra 2 e a célula "nunca gerado/inventado no
  front ou no BFF" da linha **Número de negócio**. O resto do ADR-0013 segue em vigor.
- **Feature:** [`specs/118-numero-contrato-manual/`](../../specs/118-numero-contrato-manual/spec.md) · backend
  `core-api#1024`

---

## Contexto

O ADR-0013 fixou que o número de negócio (`contract.sequentialNumber`, `NNNN/AAAA`) vem **sempre do backend** e
**nunca é gerado/inventado no front ou no BFF**. A regra existe para impedir números **fabricados** fora do dono do
dado: hashtable no BFF, `Math.random`, provisório calculado no client. Esses números são efêmeros, colidem e
promovem detalhe de processo a contrato de API.

O cliente tem **contratos vigentes com numeração própria** (`NNNN/AAAA`, de qualquer ano), e eles precisam entrar
no ERP com esse número. A P.O. decidiu em 01/10 (spec 118):

- O número passa a ser **informável** na criação. Vazio, o sistema gera o próximo número livre do ano, como antes.
- O campo é **opcional sempre** e vale para **qualquer ano**.
- Depois de criado, o número é **imutável** (R2 do core-api).

Lido ao pé da letra, o ADR-0013 proibiria o front de **enviar** um número. Mas um número **digitado pela usuária**
não é inventado. É um **dado de entrada**, como o título ou o valor. Quem valida o formato, normaliza
(`123/2024` → `0123/2024`), garante unicidade e **grava** continua sendo o core-api (`POST /contracts`, #1024).

## Decisão

1. O front **pode enviar** `sequentialNumber` no `POST /contracts` quando, e só quando, a **usuária o digitou**.
   Ausente, o core-api gera o número.
2. O front **continua proibido** de **gerar, calcular ou presumir** um número: nada de "próximo número" provisório,
   sequência local ou número de exibição antes de salvar. O topo do Novo Contrato mostra "número a definir" até o
   backend devolver o número real. Isso substitui o antigo "CT 0001/AAAA" fixo, que era exatamente um número
   inventado.
3. A validação de formato no front (`/^\d{3,4}\/\d{4}$/`, espelho do domínio do core-api) é **validação de borda**,
   para a usuária não esperar o 422. A **fonte da verdade** do formato, da normalização e da unicidade é o
   core-api. Um 409 (`contract-sequential-number-duplicated`) ou 422 (`ContractSequentialNumberInvalidFormat`) do
   backend sempre vence.
4. O número segue **fora da identidade**: referência, rota e FK continuam pelo **UUID** (regra 1 do ADR-0013,
   inalterada).

## Consequências

- **Positivas:** os contratos vigentes entram com o número real do cliente. A regra do ADR-0013 fica mais
  precisa: proíbe **fabricar** número, não **transportar** o que a pessoa informou. O topo da tela deixa de
  exibir um número falso.
- **Negativas / custo:** o regex de formato passa a existir em dois lugares (front e core-api). Se o backend
  mudar o formato, a borda do front precisa acompanhar. Mitigação: o backend vence, e um formato que o front
  aceite e o backend recuse cai no `invalid-code` com mensagem clara.
- **Dependência de entrega:** sem a core-api#1024, o core-api **descarta o campo em silêncio** (schema não-`strict`)
  e o contrato sai com o número gerado. Por isso o front só vai para a `develop` depois da #1024 na `dev`.
- **Ponto de troca:** o envio vive só no adapter `core-api-contracts.ts` (`create`), e a validação nos schemas de
  borda. Reverter é remover o campo da tela e do corpo.

## Alternativas consideradas

| Alternativa                                                           | Por que rejeitada                                                                                                                         |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Editar o ADR-0013                                                     | É `Accepted`, e a regra do handbook proíbe mudar a decisão de um ADR aceito no lugar.                                                     |
| Importar os vigentes só por carga do backend (ETL), sem campo na tela | A P.O. quer cadastrar pela tela durante 2026. O caso de uso de import do core-api já aceita o número, mas não cobre o fluxo do dia a dia. |
| Mostrar no topo o "próximo número" calculado no front                 | É o número inventado que o ADR-0013 proíbe: seria falso sempre que alguém criasse um contrato antes.                                      |
| Campo obrigatório até 31/12/2026                                      | Decisão da P.O.: opcional sempre, sem trava por data.                                                                                     |

## Referências

- [ADR-0013](./0013-id-format-convention.md): convenção de IDs (UUID para identidade, número de negócio para
  exibição).
- `specs/118-numero-contrato-manual/spec.md` e `plan.md`.
- core-api#1024 (número aceito no `POST /contracts`, normalização, gerador pula ocupados).
- Citação canônica (`skills_citar`): **pendente**. O servidor `acdg-skills` estava indisponível em 2026-10-02.
