import {
  createRequestHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { getRouter } from './router'

export default async function handler(request: Request) {
  const requestHandler = createRequestHandler({
    createRouter: getRouter,
    request,
  })
  return requestHandler(defaultStreamHandler)
}
