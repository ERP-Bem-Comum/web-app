export function isAllEmpty<T>(obj: T): boolean {
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      return false
    }
  }
  return true
}

export function isAllFilled<T>(obj: T): boolean {
  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
      return false
    }
  }
  return true
}
