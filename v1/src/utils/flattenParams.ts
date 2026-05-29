export function flattenParams<T>(params: T, resultObjectReference?: T) {
  const resultObject: Record<string, unknown> = resultObjectReference ?? {}
  for (const key in params) {
    const value = params[key]
    if (
      value !== null &&
      value !== undefined &&
      typeof params[key] === 'object' &&
      !Array.isArray(value)
    ) {
      for (const nestedKey in value) {
        resultObject[nestedKey] = value[nestedKey]
      }
    } else if (value !== null && value !== undefined) {
      resultObject[key] = value
    }
  }

  return resultObject
}
