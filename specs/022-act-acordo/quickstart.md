# Quickstart: validar o Acordo de Cooperação Técnica (ACT reescrito)

Pré-requisitos: stack local (`../ERP-INFRA/local/up.sh` → `https://app.localhost`), core-api `dev` (#32). Login: **admin.full@bemcomum.dev / DevPassw0rd!2024**. Menu: Parceiros → Atos/Acordos.

## US1 — Cadastrar Acordo (P1 / SC-001, SC-002)

1. Novo Acordo → preencher nº do instrumento, objeto/nome, e-mail, CNPJ válido, razão social, nome fantasia, área (PARC/DDI/DCE/EPV), representante legal, vigência (fim **posterior** ao início), **sem** repasse → salvar → aparece na lista/detalhe.
2. Repetir **com repasse financeiro ligado** + conta bancária (ou PIX) → salva com os dados de repasse.

## Bloqueios (SC-002)

3. Repasse ligado **sem** conta nem PIX → bloqueado, mensagem clara (`act-payment-target-required`).
4. **CNPJ inválido** → mensagem amigável de CNPJ inválido.
5. **Vigência** fim **igual/anterior** ao início → bloqueado com mensagem (fim deve ser posterior).
6. **Nº do instrumento duplicado** → mensagem amigável de número já usado (409), permanece na tela.

## US2 — Editar (P1 / SC-003)
7. Abrir um Acordo em edição → campos pré-carregados (incl. conta/PIX se houver); alterar e salvar → reflete no detalhe; ligar/desligar repasse respeita a regra.

## US3 — Listar/filtrar + detalhe + ativar/desativar (P2 / SC-003)
8. Lista com busca + filtros (ativo/inativo, com/sem repasse, área) → resultados coerentes.
9. Detalhe mostra os campos do Acordo (instituição/CNPJ/razão social/fantasia, área, representante, vigência, repasse com conta/PIX, ativo/inativo).
10. Desativar/reativar muda a situação.

## SC-004 — sem resquício de pessoa-física
11. Conferir que **não** aparece CPF/cargo/data de início de contrato/vínculo/"completar cadastro" em nenhuma tela do Acordo.

## SC-005 — sem regressão (a regra de ouro)
12. **Fornecedor, Colaborador, Financiador**: cadastrar/editar/listar/detalhe continuam funcionando normalmente.
13. Grid de contratos e demais telas inalterados.

## Gates — antes de concluir
```bash
pnpm verify     # typecheck + lint + node:test (vs baseline)
pnpm test:dom   # vitest jsdom
```
Reportar números vs. baseline. **Não commitar** (a usuária commita após revisar).
