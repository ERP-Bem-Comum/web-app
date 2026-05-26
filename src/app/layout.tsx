import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Nunito } from 'next/font/google'
import Providers from '../components/Providers'
import '../styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: 'Erp Financeiro',
  description: 'Erp Financeiro',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${nunito.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
