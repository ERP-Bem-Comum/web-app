import { CategorizationComponent } from '@/components/layout/financeiro/CategorizationComponent'
import SearchButtons from './searchButtons'
import SearchContainer from './searchContainer'
import ModalSearchAppointmentRoot from './searchRoot'
import SearchTableBody from './searchTableBody'
import SearchTableHeader from './searchTableHeader'

const SearchModalComponents = {
  Root: ModalSearchAppointmentRoot,
  Container: SearchContainer,
  Header: SearchTableHeader,
  Body: SearchTableBody,
  Buttons: SearchButtons,
  Categorization: CategorizationComponent,
}

export default SearchModalComponents
