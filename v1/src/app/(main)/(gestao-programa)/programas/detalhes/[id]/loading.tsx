import { LoadingScreen } from '@/components/layout/LoadingScreen'

export default function Loading() {
  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-56px)]">
      <LoadingScreen />
    </div>
  )
}
