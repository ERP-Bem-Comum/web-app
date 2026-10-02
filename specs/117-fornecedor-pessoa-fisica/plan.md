# Implementation Plan: 117 — Fornecedor pessoa física (CPF/CNPJ)

**Branch**: `feat/117-fornecedor-pessoa-fisica` | **Date**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

**Backend**: `core-api#1025` (implementa a #1022) **mergeado na `dev` em 2026-10-01**. Contrato lido do
código mergeado (`supplier-schemas.ts`, `supplier-dto.ts`, `supplier-plugin.ts`), não só da issue.

## Summary

O Fornecedor passa a aceitar CPF. O front ganha a chave "Pessoa Jurídica | Pessoa Física" no cadastro, a
cadeia BFF passa a enviar `document` (CPF ou CNPJ) e a ler `personType`, e as telas que mostram o
documento (lista, detalhe, Contratos, Lançar Documento) passam a ler PF/PJ **pelo documento**.

## O que o contrato real mudou em relação à spec

| Ponto                                 | Spec (30/09)       | Código mergeado                                                                                        | Efeito no front                                                                                                                                                            |
| ------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Razão Social/Fantasia na PF           | `null` na resposta | `null` (confirmado)                                                                                    | **O BFF de hoje quebra**: `corporateName: z.string()` recusa `null` e a lista inteira cai em erro. Entra nesta entrega.                                                    |
| `personType` no agregador `/partners` | —                  | **não vem** (só `document`)                                                                            | Contratos e Lançar Documento derivam PF/PJ pelo **tamanho do documento** (11 dígitos = CPF). Continua dentro da regra: o tipo sai do documento, nunca do tipo de parceiro. |
| Campos da PF na tela                  | **somem**          | Gabriel escreveu "desativados"                                                                         | **Somem** — decisão da P.O. em 2026-10-02. Para o backend tanto faz: `""` conta como ausente.                                                                              |
| Erros                                 | 4 slugs            | `invalid-supplier-document` (422), `*-document-duplicate` (409), `supplier-*-not-allowed-for-pf` (422) | Mapeados para mensagens PT.                                                                                                                                                |
| PJ sem Razão Social                   | —                  | 422 (antes 400)                                                                                        | Sem efeito: a UI não olha status (§V).                                                                                                                                     |

## Desenho técnico

### BFF (`partners/server`)

- `supplier.schema.ts` (response core-api): `document` + `personType`, `corporateName`/`fantasyName`
  **nullable**. Leitura tolerante: sem `document` usa o alias `cnpj`; sem `personType` deriva do tamanho
  (o alias some em um ciclo e o front não pode depender dele).
- `supplier.io-schemas.ts` / `supplier.io.ts`: `cnpj` → `document` (11 a 18 caracteres, aceita máscara),
  nomes da empresa `nullable`. Guards `AssertEqual` seguem travando o drift.
- `supplier.use-cases.ts`: valida o documento como CPF **ou** CNPJ (VOs existentes; o VO de CNPJ não muda).
- `core-api-suppliers.ts`: o corpo de escrita envia `document` (nunca `cnpj`); novos slugs → `PartnersError`.

### Client (`partners/client`)

- `supplier.model.ts`: `PersonType = 'PJ' | 'PF'`; itens com `document` + `personType`; o schema do
  formulário decide pelo `personType` (PJ: CNPJ + Razão Social + Nome Fantasia; PF: CPF, nomes `null`).
- `supplier-form.controller.ts`: `personType` no estado; `switchPersonType` **puro** (limpa o documento,
  guarda Razão Social/Fantasia na tela, alinha o tipo da chave Pix CPF↔CNPJ).
- Formulário (criar/editar) e detalhe (edição no lugar): chave segmentada no padrão `brand-filters`;
  bloqueada sem `supplier:edit-sensitive`, **com aparência de bloqueada e o motivo escrito**.
- Lista: coluna "CPF/CNPJ" mascarada por tamanho + etiqueta PF/PJ; o export/print usa a mesma máscara.

### Outros módulos (leitura)

- `contracts/client/data/repository/partners.repository.ts`: CPF × CNPJ pelo tamanho do documento.
- `financial/client/document-create/document-form.view.ts`: `isPartnerPF` pelo documento.

## Constitution Check

| Princípio             | Aderência | Nota                                                                                       |
| --------------------- | --------- | ------------------------------------------------------------------------------------------ |
| I/III Boundaries      | ✓         | nada novo cruza módulo; Contratos/Financeiro só leem o `document` que já recebiam          |
| II Erros como valores | ✓         | novos slugs entram na união `PartnersError` + `switch` exaustivo                           |
| IV Estados ilegais    | ✓         | `personType` só existe como leitura do documento; PF não carrega nomes da empresa (`null`) |
| V Cadeia de erro      | ✓         | a UI recebe tag i18n, nunca status                                                         |
| VI Zod na borda       | ✓         | response core-api, input da server fn e formulário                                         |
| X Só tokens           | ✓         | chave segmentada reusa `brand-filters.css.ts`; estilo de bloqueio só com `brand.*`         |
| XI MVVM               | ✓         | regra da troca de tipo é função pura no controller; view só apresenta                      |

## Testes

- **node:test**: schema do formulário (CPF válido, DV errado, 12/13 caracteres, PF sem Razão Social, PJ sem
  Razão Social); `switchPersonType`; BFF (io-schema com 11 caracteres, use-case CPF/CNPJ, `toWriteBody`
  com `document` e nomes `null`, leitura de PF com nomes `null`, slugs novos); `partners.repository`
  (fornecedor PF → `cpf`); `isPartnerPF` pelo documento.
- **Vitest/jsdom**: o formulário esconde Razão Social/Fantasia na PF e a chave aparece bloqueada sem
  permissão.

## Ajuste pós-merge (2026-10-02): o alias `cnpj` vai junto

O front e o core-api deployam por **esteiras separadas**: a homologação do front sai da `develop` do
web-app, e o backend de homologação sai de uma pipeline própria na AWS. Na primeira versão, o corpo de
escrita mandava **só** `document`. Um core-api **anterior à #1025** só lê `cnpj` e recusaria esse corpo
com 400, o que **quebraria o cadastro e a edição de qualquer fornecedor, inclusive PJ**, enquanto o
backend estivesse atrasado.

Agora o `toWriteBody` envia `document` **e** `cnpj` com o **mesmo valor**:

- O core-api com a #1025 aceita os dois quando são iguais (`superRefine` do `createSupplierBodySchema`).
- O core-api anterior lê o `cnpj` e segue funcionando para PJ. PF continua dependendo da #1025.

É temporário: sai quando o core-api retirar o alias (combinado na core-api#1022).
