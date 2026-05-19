import { PixData } from '@/components/layout/pixData'
import { ContractBancaryData } from './ContractBancaryData'
import { ContractsChildList } from './ContractChildList'
import { ContractCollaboratorInfo } from './ContractColaboratorInfo'
import { ContractFileInput } from './ContractFileInput'
import { ContractFinancierInfo } from './ContractFinnancierInfo'
import { ContractFooter } from './ContractFooter'
import { ContractInfo } from './ContractInfo'
import { ContractRoot } from './ContractRoot'
import { ContractSupplierInfo } from './ContractSupplierInfo'
import { ContractVigency } from './ContractVigency'

export const Contracts = {
  BancaryData: ContractBancaryData,
  PixData,
  Collaborator: ContractCollaboratorInfo,
  Supplier: ContractSupplierInfo,
  Finnancier: ContractFinancierInfo,
  Info: ContractInfo,
  Vigency: ContractVigency,
  Files: ContractFileInput,
  Footer: ContractFooter,
  ChildsList: ContractsChildList,
  Root: ContractRoot,
}
