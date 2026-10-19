# 122 — Identidade de Gênero no lugar de "Sexo" (Colaborador)

**Tamanho:** S · **Status:** implementado (front), com o texto livre de "Outra" (16/10) · **Data:** 2026-10-12
**Depende de:** nada para as opções fechadas · `core-api#1054` para o texto livre de "Outra"
**Origem:** pedido do cliente via P.O. — o campo com Feminino/Masculino vira **Identidade de Gênero**.

## Problema

O cadastro completo do colaborador (detalhe, seção Dados Pessoais) e o Autocadastro perguntavam
**"Sexo"** com Feminino/Masculino (`sex`). O cliente quer **Identidade de Gênero** com a lista abaixo.
O `genderIdentity` já existia de ponta a ponta (enum do core-api, `complete-registration`, autocadastro,
estado do form), mas **não havia seletor em tela**.

## Regra (P.O., 12/10)

- "Sexo" **sai** das duas telas; entra **Identidade de Gênero**, com as opções na ordem e na redação do
  cliente: Mulher cisgênero · Homem cisgênero · Mulher transgênero · Homem transgênero · Pessoa não
  binária · Outra identidade de gênero · Prefiro não responder.
- **Travesti fora do seletor.** A P.O. informou que o legado não oferecia a opção, logo não há registro.
- **"Outra identidade de gênero"** com campo `______`: texto livre `genderIdentityDescription` (`core-api#1054`,
  código no core-api#1068; molde `foodCategory` + `foodCategoryDescription`). O campo **"Qual identidade de
  gênero?"** só aparece com "Outra", é opcional (até 120 caracteres) e só vai no corpo junto de `OUTRO`:
  o core-api **recusa com 422** (`gender-identity-description-requires-other`) a descrição com outra
  identidade — regra confirmada pela P.O. em 16/10. Trocar de "Outra" para outra opção esconde o campo e
  descarta o texto no envio.
- **Layout (P.O., 16/10, após validar no local):** Identidade de Gênero é o **último** campo de Dados Pessoais
  (detalhe e Autocadastro), para que o texto de "Outra" entre na vaga ao lado **sem empurrar** nenhum campo.
  Ao aparecer, o campo ganha um **halo tintado que some sozinho em ~3s** (`fieldHighlight`, só cor, sem
  movimento; encurta com `prefers-reduced-motion`).

## Escopo (front)

| #   | Entrega                                                                                      |
| --- | -------------------------------------------------------------------------------------------- |
| 1   | `GENDER_IDENTITY_OPTIONS` (model): as 7 opções do seletor, na ordem do cliente, sem TRAVESTI |
| 2   | Detalhe (Cadastro completo): `sel('sex')` → `sel('genderIdentity')`                          |
| 3   | Autocadastro: idem                                                                           |
| 4   | Rótulo `partners.collaborators.detail.field.genderIdentity` = "Identidade de Gênero"         |

## O que NÃO muda

- `GENDER_IDENTITIES` (espelho do enum do core-api, 8 valores) continua com TRAVESTI: é a lista usada por
  filtros/relatórios para **exibir e contar** o que estiver gravado. Tirar daqui sem tirar do backend
  abriria a classe de bug "categoria desconhecida some do gráfico".
- O dado `sex` já gravado fica no banco (não há conversão possível: sexo ≠ identidade de gênero). O campo
  só deixa de ser coletado.
- Reedição do perfil já completo segue bloqueada (`completeRegistration` não é idempotente) — limitação
  conhecida, fora deste escopo.

## ⚠️ Evidência sobre TRAVESTI no legado

O **banco** do legado aceitava o valor: `ERP-BACKEND/src/database/migrations/1747420877429-InitialMigration.ts`
cria `genderIdentity enum (..., 'TRAVESTI', ...)` e `src/modules/collaborators/enum/index.ts:24` declara
`TRAVESTI`. Se a **tela** do legado não oferecia a opção, não deve haver registro — mas a confirmação
definitiva é uma contagem na base migrada antes de tirar o valor do enum do core-api:
`SELECT COUNT(*) FROM par_collaborators WHERE gender_identity = 'TRAVESTI';`

## Testes

- `tests/modules/partners/client/collaborator-detail/collaborator-gender-identity.spec.tsx` — detalhe e
  Autocadastro: 7 opções na ordem do cliente, sem Travesti, sem "Sexo"; a escolha vai para `genderIdentity`.
