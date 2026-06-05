/**
 * Barrel do design system (`#shared/ui`) — porta única de consumo pelas features (tipo
 * `shared-ui` no boundaries, importável por `client-ui`). Reexporta os tokens e, conforme
 * nascem, os átomos/moléculas (T017). Ver specs/005-design-system-atoms (research R4).
 */
export { vars } from './tokens/index.ts'
export * from './atoms/index.ts'
export * from './molecules/index.ts'