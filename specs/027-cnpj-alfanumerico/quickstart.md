# Quickstart — Validar a feature CNPJ alfanumérico

**Feature**: 027-cnpj-alfanumerico · **Branch**: `integration/cnpj-alfanumerico-027`

## Gates (devem ficar verdes)

```bash
pnpm typecheck      # tsc --noEmit
pnpm lint           # 0 erros (warnings pré-existentes OK)
pnpm test           # node:test — inclui tests/shared/document/cnpj.test.ts + VOs de parceiro
pnpm test:dom       # vitest — sem regressão de UI
```

Rodar um único teste do helper:

```bash
node --experimental-strip-types --test tests/shared/document/cnpj.test.ts
```

## Fixtures (do contrato do core-api)

- **Válidos**: `11222333000181` (numérico legado), `12ABC34501DE35`, `A1B2C3D4E5F668`,
  `12.ABC.345/01DE-35` (com máscara), `12abc34501de35` (minúsculo → normaliza p/ maiúsculo).
- **Inválidos de formato (front pega)**: `12ABC34501DEAB` (2 últimos não-numéricos), `00000000000000`
  (degenerado), `123` (length), `112223330001810` (15 chars).
- **Inválido só por DV (backend pega)**: `12ABC34501DE34` (formato OK, DV errado).

## Validação manual (stack local)

Pré-req: stack de pé via `../ERP-INFRA/local/up.sh` → `https://app.localhost` (login
`admin@bemcomum.dev` / `DevPassw0rd!2027`). Rebuild do web se necessário.

1. **Cadastrar fornecedor** com CNPJ `12abc34501de35` → o campo exibe `12.ABC.345/01DE-35`, validação OK,
   salva com sucesso (BFF envia 14 chars maiúsculos).
2. **DV inválido**: cadastrar com `12ABC34501DE34` → backend retorna `invalid-cnpj` → mensagem exibida.
3. **Retrocompat**: cadastrar/editar com CNPJ numérico `11.222.333/0001-81` → funciona como antes.
4. **Exibição**: abrir Contratos (listagem + detalhe) e o grid de Contas a Pagar com um parceiro de CNPJ
   alfanumérico → documento aparece com a máscara correta, sem letras perdidas.
5. **Busca**: no Lançar Documento, filtrar o picker de fornecedor por trecho alfanumérico do CNPJ.

## Done quando

- [ ] Helper `src/shared/document/cnpj.ts` criado e testado (fixtures verdes).
- [ ] VO de CNPJ aceita alfanumérico mantendo DV (numérico idêntico).
- [ ] Máscara DS + schemas + adapters + exibição (Contratos/Financeiro) consomem o helper.
- [ ] i18n para `invalid-cnpj`.
- [ ] 4 gates verdes; suítes existentes sem regressão.
