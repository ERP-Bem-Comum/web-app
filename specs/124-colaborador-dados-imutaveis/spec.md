# 124 — Dados pessoais imutáveis depois de registrados

**Tamanho:** S · **Status:** front implementado · **Data:** 2026-10-12 (revisada em 2026-10-19)
**Backend:** `core-api#1070` (PUT preenche RG/nascimento/raça vazios) · **Relacionada:** `core-api#438`

## Problema

No detalhe de um colaborador **já cadastrado**, o modo Editar liberava os campos pessoais. O backend não tinha
rota que os alterasse depois do cadastro (o `completeRegistration` recusa colaborador já completo, e o PUT
preservava todos os pessoais), então a pessoa alterava, recebia "salvo" e o valor era **descartado em silêncio**.

## Regra (P.O., 12/10 + correção de 19/10)

| Campo                             | Regra                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------- |
| CPF                               | sempre travado (é obrigatório no pré-cadastro, nunca chega vazio)                 |
| Data de nascimento, RG, raça/cor  | **travam só se já registrados**; o que falta segue editável e é gravado ao salvar |
| Endereço, telefone, escolaridade… | podem mudar — dependem da `core-api#438`                                          |

**Correção de 19/10:** a 1ª versão travava os três por **situação** (todo colaborador Cadastrado). A P.O.
validou no local um colaborador cadastrado com raça e nascimento em branco: os campos travados impediam o
registro. A trava passou a ser **por campo**, olhando o valor **gravado** (nunca o do form, senão o campo
travaria ao digitar).

## Contrato do backend (`core-api#1070`)

`PUT /collaborators/:id` aceita `rg`, `dateOfBirth`, `race`: ausente/`null`/branco mantém; com o campo vazio
grava; igual ao gravado mantém (o PUT é total); diferente do gravado → **409**
`collaborator-personal-data-immutable`. Os três entram no histórico de alterações.

## Escopo (front)

| #   | Entrega                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `lockedPersonalFrom(detail)` (puro, no controller) → `{ rg, dateOfBirth, race }`; a página passa ao `CollaboratorDetailContent` |
| 2   | Campo registrado: desativado no modo Editar com o aviso "Já registrado — não pode ser alterado." (mesmo padrão do CPF)          |
| 3   | `buildPre` leva os três no PUT (`CollaboratorUpdateInput`); vazio vai ausente                                                   |
| 4   | 409 `collaborator-personal-data-immutable` ganha mensagem própria (não o genérico "Já existe um registro")                      |
| 5   | `sel` aceita `lockedHint`, como o `txt`                                                                                         |

## Ordem de entrada

O front só vai para a `develop` **depois** da `core-api#1070` na `dev`. Antes disso o core-api descarta os
três campos no PUT (o Zod dele remove chave desconhecida) — o campo destravado voltaria a "salvar" sem gravar.

## Testes

`collaborator-personal-immutable.spec.tsx`: os três registrados travam com o aviso; cadastrado sem os três deixa
os três livres; só o RG registrado trava só o RG; digitar num campo vazio não trava; pré-cadastro livre; fora
do Editar sem aviso; `buildPre` leva o preenchido e omite o vazio.
