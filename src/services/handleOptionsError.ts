import axios from 'axios'

const SILENT_STATUS = [401, 403]

export const handleOptionsError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (!status || status === 404 || SILENT_STATUS.includes(status)) {
      return []
    }
  }

  console.error(error)
  return []
}
