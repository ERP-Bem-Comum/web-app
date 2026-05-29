import { AxiosResponseHeaders } from 'axios'

export type BlobResponse = {
  blob: Blob
  filename: string
}

export const getFileNameFromHeader = ({ headers, data }: { headers: unknown; data: Blob }) => {
  let filename = 'download.pdf'

  const castedHeader = headers as AxiosResponseHeaders
  const contentDisposition = castedHeader['content-disposition']

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1]
    }
  }

  return {
    blob: data,
    filename,
  } as BlobResponse
}
