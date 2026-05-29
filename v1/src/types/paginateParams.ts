export interface PaginateParams {
  page: number
  limit: number
  search?: string | null
  active?: number | null
  order?: 'ASC' | 'DESC'
}
