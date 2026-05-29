export type ICostCenterSubCategory = {
  id: number
  name: string
  costCenterCategoryId: number
  type: 'REDE' | 'INSTITUCIONAL'
  releaseType: 'IPCA' | 'CAED' | 'DESPESAS_PESSOAIS' | 'DESPESAS_LOGISTICAS'
}

export type ICreateCostCenterSubCategory = {
  name: string
  type: string
  releaseType: string
  costCenterCategoryId: number | undefined
}

export type IEditCostCenterSubCategory = {
  id: number
  name: string
  type: string
  releaseType: string
  costCenterCategoryId: number
  active?: boolean
}
