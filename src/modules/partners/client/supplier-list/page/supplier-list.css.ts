/**
 * Estilo específico do grid de Fornecedores (o restante — screen/header/tabela/paginação — vem da kit
 * "brand" compartilhada). Só a célula de CNPJ (não quebra no '-' / '/').
 */
import { style } from '@vanilla-extract/css'

export const cnpjCell = style({ whiteSpace: 'nowrap' })
