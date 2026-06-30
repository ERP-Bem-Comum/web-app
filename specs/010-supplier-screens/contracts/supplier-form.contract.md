# Contrato de Tela — Formulário de Fornecedor (US2 criar / US4 editar)

**Rotas**: `/_authenticated/parceiros/fornecedores/criar` e `/.../$id/editar`. Um só `supplier-form.component.tsx` (burro) + `supplier-form.controller.ts` (estado + Zod), reusado.

## Entradas
- `initialValues?: SupplierFormValues` (edit pré-preenche via `getSupplierFn`; create = vazio).
- `categories: readonly string[]` (de `listServiceCategoriesFn`).
- `command: { running: boolean; errorTag: string | null; execute(values) }` (do binding; create→`createSupplierFn`, edit→`updateSupplierFn`).
- `canEditSensitive: boolean` (= `can(granted, 'supplier:edit-sensitive')`) — gate dos grupos bancário/PIX.

## Comportamento
- Seções: **dados básicos** (nome, razão social, nome fantasia, e-mail, CNPJ, categoria) + **bancário** (opcional) + **PIX** (opcional).
- Validação na borda (controller, Zod): obrigatórios; e-mail; CNPJ com-e-sem-máscara → normaliza 14 dígitos; grupo bancário "tudo ou nada".
- Submit inválido **não** chama o backend (bloqueado no controller).
- `running` → botão salvar ocupado; sem envios duplicados.
- `errorTag` (ex.: cnpj-duplicado) exibido via i18n.
- Sem `supplier:edit-sensitive` → grupos bancário/PIX ocultos/somente-leitura.
- Sucesso → navega (lista ou detalhe).

## Critérios de aceite: US2 (1–6) e US4 (1–4).

## Testes
- `supplier.schemas.test.ts` (node:test): regras de validação (e-mail, CNPJ, grupo "tudo ou nada", obrigatórios).
- `supplier-form.controller.spec.tsx` (Vitest): bloqueia submit inválido; emite input válido; respeita `canEditSensitive`.
