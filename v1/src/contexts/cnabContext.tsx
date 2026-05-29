import { createContext, ReactNode } from 'react'

interface CNABContextProps {
  teste: () => 1
}

export const payablesContext = createContext<CNABContextProps | null>(null)

export const PayablesProvider = ({ children }: { children: ReactNode }) => {
  return <payablesContext.Provider value={{ teste: () => 1 }}>{children}</payablesContext.Provider>
}
