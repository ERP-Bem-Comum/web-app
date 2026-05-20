import { Loader2 } from 'lucide-react'

export function LoadingTable() {
  return (
    <div
      className="flex justify-center items-center py-5"
      style={{ margin: 'auto', width: '100%' }}
    >
      <Loader2 className="animate-spin" color="#32C6F4" size={30} />
    </div>
  )
}
