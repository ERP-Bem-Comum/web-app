# 124 — Dados pessoais imutáveis depois do cadastro

**Tamanho:** S · **Status:** front implementado · **Data:** 2026-10-12
**Relacionada:** `core-api#438` (edição dos dados pessoais pós-cadastro — reescopada com esta regra)

## Problema

No detalhe de um colaborador **já cadastrado**, o modo Editar liberava os campos pessoais. O backend não tem
rota que os altere depois do cadastro (o `completeRegistration` recusa colaborador já completo), então o
front deixa de enviá-los: a pessoa alterava, recebia "salvo" e o valor era **descartado em silêncio**.

## Regra (P.O., 12/10)

| Depois do cadastro   | Campos                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| **Não muda** (trava) | CPF, data de nascimento, RG, raça/cor                                                              |
| **Pode mudar**       | endereço, telefone, escolaridade, estado civil, identidade de gênero, experiência no setor público |

O CPF já estava travado no detalhe desde 05/10, em qualquer situação. "Depois do cadastro" = situação
**Cadastrado**. No **pré-cadastro**, nascimento, RG e raça/cor seguem editáveis, porque é ali que o operador
completa o cadastro.

## Escopo (front)

| #   | Entrega                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `CollaboratorDetailContent` ganha `registrationComplete` (opcional, default `false`); a página passa `registration === 'complete'`                                   |
| 2   | Data de nascimento, RG e raça/cor: desativados no modo Editar de quem está cadastrado, com o aviso "Não pode ser alterado depois do cadastro." (mesmo padrão do CPF) |
| 3   | `sel` passa a aceitar `lockedHint`, como o `txt`                                                                                                                     |

## Fora do escopo (depende do backend)

Os campos que **podem mudar** continuam com o comportamento atual em quem já está cadastrado: a tela libera,
mas o backend ainda não os grava. Isso é a `core-api#438`, reescopada para cobrir só esses campos.

## Testes

`collaborator-personal-immutable.spec.tsx`: cadastrado + Editar trava os três com o aviso e deixa endereço e
escolaridade livres; pré-cadastro deixa os três editáveis; fora do Editar, sem aviso.
