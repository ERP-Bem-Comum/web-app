import { Session } from 'next-auth'

export const AUTH_BYPASS_ENABLED = true

export const authBypassSession: Session = {
  expires: '2099-12-31T23:59:59.999Z',
  user: {
    id: 1,
    name: 'Desenvolvimento',
    email: 'dev@local',
    cpf: '',
    telephone: '',
    imageUrl: '',
    token: 'dev-bypass-token',
    massApprovalPermission: true,
  },
}
