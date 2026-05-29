import { Options } from '@/types/global'

type tENUM = {
  [s: number | string]: string
}

const useLoadLocalOptions = (e: tENUM, type: 'k' | 'v' = 'v') => {
  return Object.entries(e).flatMap<Options>(([key, value]) => {
    return type === 'k' ? { id: key, name: value } : { id: value, name: value }
  })
}

export default useLoadLocalOptions
