export function pickProps<T, K extends keyof T>(obj: T, keys: K[]) {
  if (!obj) return {} as T
  return keys.reduce(
    (acc, key) => {
      acc[key] = obj[key]
      return acc
    },
    {} as Pick<T, K>,
  )
}

export function excludeProps<T, K extends keyof T>(obj: T, keys: K[]) {
  if (!obj) return {} as T
  return Object.keys(obj).reduce(
    (acc, key) => {
      if (!keys.includes(key as K)) {
        acc[key as K] = obj[key as K]
      }
      return acc
    },
    {} as Pick<T, K>,
  )
}
