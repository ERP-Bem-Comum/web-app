/**
 * contractListViewModel — ViewModel AGNÓSTICO (objeto puro, zero React).
 * Define query options + derivações puras.
 */
import { contractListQueryOptions } from './contract-list.query.ts'

export const contractListViewModel = {
  query: contractListQueryOptions,
}
