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
    grupo: 'Gestão de Parceiros',
    ARE_NOME: 'GEST_PAR',
    icon: <MdOutlineHandshake size={20} color={'#FFF'} />,
    items: [
      {
        name: 'Colaboradores',
        ARE_NOME: 'COLAB',
        path: '/colaboradores',
        subPages: [],
      },
      {
        name: 'Fornecedores',
        ARE_NOME: 'FORN',
        path: '/fornecedores',
        subPages: [],
      },
      {
        name: 'Financiadores',
        ARE_NOME: 'FINAN',
        path: '/financiadores',
        subPages: [],
      },
      {
        name: 'Estados',
        ARE_NOME: 'EST',
        path: '/estados',
        subPages: [],
      },
      {
        name: 'Municípios',
        ARE_NOME: 'MUN',
        path: '/municipios',
        subPages: [],
      },
    ],
  },
  {
    grupo: 'Gestão de Programas',
    ARE_NOME: 'GEST_PROG',
    icon: <MdOutlineGroupWork size={20} color={'#FFF'} />,
    items: [
      {
        name: 'Programas',
        ARE_NOME: 'PROG',
        path: '/programas',
        subPages: [],
      },
    ],
  },
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
  {
    grupo: 'Plano Orçamentário',
    ARE_NOME: 'PLAN_ORC',
    icon: <MdOutlineCalendarToday size={20} color={'#FFF'} />,
    items: [
      {
        name: 'Planejamento',
        ARE_NOME: 'PLAN',
        path: '/planejamento',
        subPages: [],
      },
      {
        name: 'Consolidado ABC',
        ARE_NOME: 'CONS',
        path: '/consolidado',
        subPages: [],
      },
    ],
  },
  {
    grupo: 'Relatórios',
    ARE_NOME: 'REPORTS',
    icon: <MdInsights size={20} color={'#FFF'} />,
    items: [
      {
        name: 'Fluxo de caixa',
        ARE_NOME: 'CASH_FLOW',
        path: '/fluxocaixa',
        subPages: [],
      },
      {
        name: 'Equipe ABC ',
        ARE_NOME: 'EQU_ABC',
        path: '/equipe',
        subPages: [],
      },
      {
        name: 'Posição Pagamentos',
        ARE_NOME: 'POS_PAG',
        path: '/posicao/pagamentos',
        subPages: [],
      },
      {
        name: 'Posição Recebiveis',
        ARE_NOME: 'POS_REC',
        path: '/posicao/recebiveis',
        subPages: [],
      },
      {
        name: 'Fornecedores sem contrato',
        ARE_NOME: 'FOR_CONT',
        path: '/semcontratos',
        subPages: [],
      },
      {
        name: 'Análise de Pagamentos',
        ARE_NOME: 'ANA_PAG',
        path: '/analise/pagamentos',
        subPages: [],
      },
      {
        name: 'Análise de Recebimentos',
        ARE_NOME: 'ANA_REC',
        path: '/analise/recebimentos',
        subPages: [],
      },
      {
        name: 'Realizado x Planejado',
        ARE_NOME: 'REA_PLA',
        path: '/realizado',
        subPages: [],
      },
      {
        name: 'Relatório Geral',
        ARE_NOME: 'REL_GER',
        path: '/geral',
        subPages: [],
      },
    ].sort((a, b) => a.name.localeCompare(b.name)),
  },
  {
    grupo: 'Financeiro',
    ARE_NOME: 'FINANC',
    icon: <MdOutlineTableRows size={20} color={'#FFF'} />,
    items: [
      {
        name: 'Contas a Pagar',
        ARE_NOME: 'CONT_PAG',
        path: '/contas-pagar',
        subPages: [
          {
            name: 'Listar Contas',
            ARE_NOME: 'CONT_PAG_LIST',
            path: '/contas-pagar',
          },
          {
            name: 'Lançar Despesas',
            ARE_NOME: 'LANC_DESP',
            path: '/contas-pagar/lancar-despesas',
          },
        ],
      },
      {
        name: 'Contas a Receber',
        ARE_NOME: 'CONT_REC',
        path: '/contas-receber',
        subPages: [],
      },
      {
        name: 'Contas Bancárias',
        ARE_NOME: 'CONT_BAN',
        path: '/contas-bancarias',
        subPages: [],
      } /* ,
      {
        name: 'Cartão de crédito',
        ARE_NOME: 'CRED_CARD',
        path: '/cartao',
        subPages: [],
      }, */,
    ].sort((a, b) => a.name.localeCompare(b.name)),
  },
  {
    grupo: 'Gestão de Usuários',
    ARE_NOME: 'GEST_USU',
    icon: <MdOutlineGroup size={20} color={'#FFF'} />,
    items: [
      {
        name: 'Usuários',
        ARE_NOME: 'USU',
        path: '/usuarios',
        subPages: [],
      },
      {
        name: 'Minha Conta',
        ARE_NOME: 'MIN_CON',
        path: '/minha-conta',
        subPages: [],
      },
    ],
  },
]
