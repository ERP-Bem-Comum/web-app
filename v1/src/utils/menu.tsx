import {
  MdOutlineCalendarToday,
  MdOutlineGroup,
  MdOutlineGroupWork,
  MdOutlineHandshake,
  MdOutlineTableRows,
  MdRedeem,
  MdInsights,
} from 'react-icons/md'

export type SubPage = { ARE_NOME: string; path: string; name: string }

export type MenuItem = {
  name: string
  ARE_NOME: string
  path: string
  subPages: SubPage[]
}

export type MenuPage = {
  grupo: string
  ARE_NOME: string
  icon: React.ReactNode
  items: MenuItem[]
}

export const PAGES: MenuPage[] = [
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
