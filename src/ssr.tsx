import {
  createRequestHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { getRouter } from './router'

const requestHandler = createRequestHandler({
  createRouter: getRouter,
})

export default requestHandler(defaultStreamHandler)
