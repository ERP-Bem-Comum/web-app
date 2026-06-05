/**
 * API pública dos design tokens (T008) — ponto de consumo do `shared-ui` pelas features.
 *
 * Exporta apenas `vars` (contrato tipado). Os VALORES crus (`tokens.values.ts`) NÃO são
 * reexportados: componentes referenciam `vars.*` (resolvido em CSS vars no build), nunca os
 * literais. Os side-effects (theme + fonts) são registrados no boot (src/app/router.tsx),
 * não aqui — manter este módulo livre de efeito colateral.
 *
 * Uso: `import { vars } from '#shared/ui/tokens'`
 */
export { vars } from './contract.css.ts'
