import {
  MdOutlineCalendarToday,
  MdOutlineGroup,
  MdOutlineGroupWork,
  MdOutlineHandshake,
  MdOutlineTableRows,
  MdRedeem,
  MdInsights,
} from 'react-icons/md'

export const PAGES = [
  {
    grupo: 'Gestão de Contratos',
    ARE_NOME: 'CONTR',
    icon: <MdRedeem size={20} color={'#FFF'} />,
    items: [
      {
        name: 'Contratos',
        ARE_NOME: 'CONTR',
        path: '/contratos',
        subPages: [],
      },
    ],
  },
]
