# Spec — Desbloquear campos de perfil do Colaborador (US2 "perfil completo")

> Feature: `036-collaborator-profile-fields` · Tamanho: **L** (vertical client→BFF→core-api) · Branch: `feat/collaborator-profile-fields-unblock`

## Problema

A "segunda parte do cadastro" do Colaborador (perfil detalhado) tem campos renderizados **gated**
(visíveis porém `disabled`, sem estado nem envio) no `collaborator-detail-content.component.tsx`.
O backend (core-api, módulo partners) **já suporta** todos eles em READ (`collaboratorDetailSchema`)
e WRITE (`completeRegistrationBodySchema`, "Perfil completo US2"). O gating do front estava só defasado.

## Campos a ligar (todos `nullable`/`default(null)` no core-api — verificado)

| Campo                            | Tipo domínio core-api                                                | Bloco UI                             |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------ |
| `sex`                            | `'F' \| 'M'`                                                         | Dados Pessoais                       |
| `maritalStatus`                  | `'single' \| 'married' \| 'divorced' \| 'widowed' \| 'stable_union'` | Dados Pessoais                       |
| `publicSectorExperienceDuration` | string                                                               | Dados Pessoais ("Por quanto tempo?") |
| `hasChildren`                    | boolean                                                              | Informações Familiares               |
| `childrenCount`                  | int ≥ 0                                                              | Informações Familiares               |
| `childrenAges`                   | int[] ≥ 0                                                            | Informações Familiares               |
| `isPwd`                          | boolean                                                              | Saúde e Acessibilidade               |
| `pwdDescription`                 | string                                                               | Saúde e Acessibilidade               |
| `isOnLeave`                      | boolean                                                              | Informações Contratuais              |
| `leaveDuration`                  | string                                                               | Informações Contratuais              |
| `leaveRenewable`                 | boolean                                                              | Informações Contratuais              |
| `leaveRenewalDuration`           | string                                                               | Informações Contratuais              |

`sex` é INDEPENDENTE de `genderIdentity` (sexo biológico ≠ identidade de gênero — decisão de PO no
core-api). Os valores do front (`F`/`M`, `single`/…/`stable_union`) batem 1:1 com o domínio do backend.

## Critérios de aceite

- FR-001: cada campo acima é editável quando `editing`, hidrata a partir do detalhe e é enviado no
  PATCH `complete-registration` quando preenchido (omitido quando vazio — semântica "não informado").
- FR-002: booleans usam o select `sim/não` (vazio → `undefined`), espelhando `experienceInThePublicSector`.
- FR-003: `childrenAges` é entrada de texto livre ("5 anos, 12 anos") → `int[]` ([5,12]); na hidratação
  `int[]` → "5, 12". Helper puro testável.
- FR-004: a leitura (mapper API→Model) traz os novos campos (null/'' → undefined/'' conforme padrão).
- FR-005: seções totalmente desbloqueadas perdem o `<p gatedNote>`; helpers `gatedSel`/`gatedTxt` e
  constantes órfãs (`MARITAL`/`hint`) são removidos se ficarem sem uso (lint cobra).

## Fora de escopo

Seção bancária/PIX e território (read-only de propósito — #40/#42). Não tocar.

## Verificação de prontidão do backend (feita ANTES de codar)

- `core-api/src/modules/partners/adapters/http/schemas.ts`: `completeRegistrationBodySchema` (~247-275) e
  `collaboratorDetailSchema` (~150-190) contêm TODOS os campos. ✅
- `core-api/.../domain/collaborator/sex.ts` → `'F'|'M'`; `civil-status.ts` → 5 literais. ✅
