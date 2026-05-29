import { AxiosRequestTransformer } from 'axios'

/**
 * If contentType is multipart/form-data, then transforms the request data and headers for uploading files using Axios.
 * @param data - The request data.
 * @param headers - The request headers.
 * @returns The transformed data for uploading files or the original data if not applicable.
 */
const formDataAxiosTransformer: AxiosRequestTransformer = (data, headers) => {
  const contentType = headers['Content-Type']

  if (!contentType) return data

  const isMultiPartFormData =
    typeof contentType === 'string' && contentType.startsWith('multipart/form-data')

  if (!isMultiPartFormData) return data

  const form = new FormData()
  for (const key in data) {
    const value = data[key]
    if (Array.isArray(value)) {
      const arrayKey = `${key}[]`
      value.forEach((v) => {
        if (v instanceof File) {
          form.append(key, v)
        } else if (typeof v === 'object') {
          form.append(arrayKey, JSON.stringify(v))
        } else {
          form.append(arrayKey, v)
        }
      })
    } else {
      form.append(key, value)
    }
  }
  return form
}

export default formDataAxiosTransformer
