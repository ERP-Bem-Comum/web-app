import axios from 'axios'

export type ILogin = {
  email?: string
  password?: string
}

export async function Login(data: ILogin) {
  const response = await axios
    .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, data)
    .then((response) => {
      return response
    })
    .catch((error) => {
      console.error('error: ', error.response.data.message)
      return {
        status: 400,
        data: {
          message: error.response.data.message,
        },
      }
    })
  return response
}

export async function RecoveryPassword(email: string) {
  return await axios
    .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password/`, {
      email,
    })
    .then((response) => {
      console.log('response: ', response)
    })
    .catch((error) => {
      console.error('error: ', error)
    })
}

export async function newPasswordRequest(token: string | undefined, password: string) {
  const response = await axios
    .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
      token,
      password,
    })
    .then((response) => {
      return response
    })
    .catch((error) => {
      console.error('error: ', error)
      return {
        status: 401,
        data: {
          message: 'Link de redefinição de senha expirado. Por favor, solicite outro.',
        },
      }
    })
  return response
}
