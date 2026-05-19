import { CategorizationComponent } from '@/components/layout/financeiro/CategorizationComponent'
import SearchButtons from '../modalComponents/searchButtons'
import SearchTableBody from '../modalComponents/searchTableBody'
import { EditRoot } from './editRoot'

export const EditModalComponents = {
  Root: EditRoot,
  Body: SearchTableBody,
  Buttons: SearchButtons,
  Categorization: CategorizationComponent,
}
