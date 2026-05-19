'use client'
import axios from 'axios'
import { destroyCookie, parseCookies } from 'nookies'

const baseURL = process.env.NEXT_PUBLIC_API_URL

const ApiClientShared = () => {
  const defaultOptions = {
    baseURL,
  }

  const instance = axios.create(defaultOptions)

  instance.interceptors.request.use(async (request) => {
    const cookies = parseCookies()
    if (cookies) {
      request.headers.Authorization =
        'Basic ' + btoa(cookies?.shareUsername + ':' + cookies?.sharePassword)
    }
    return request
  })

  instance.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      if (error?.response?.status === 401 && error?.response?.data?.message === 'Unauthorized') {
        destroyCookie(null, 'shareBudgetId')
        destroyCookie(null, 'shareUsername')
        destroyCookie(null, 'sharePassword')
        console.log('password expired')
      }
      return Promise.reject(error)
    },
  )

  return instance
}

export default ApiClientShared()
