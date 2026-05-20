export type BlobResponse = {
  blob: Blob
  filename: string
}

export const getFileNameFromHeader = ({
  headers,
  data,
}: {
  headers: Record<string, string> | Headers | unknown
  data: Blob
}) => {
  let filename = 'download.pdf'

  const contentDisposition =
    headers instanceof Headers
      ? headers.get('content-disposition')
      : (headers as Record<string, string> | undefined)?.['content-disposition']

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
