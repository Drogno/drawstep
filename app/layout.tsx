import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'
import ConsentBanner from '@/components/ConsentBanner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DRAWSTEP - Lorcana Tools & Training',
  description: 'Professional training tools for Disney Lorcana TCG players',
  keywords: ['Lorcana', 'TCG', 'Mulligan', 'Training', 'Disney'],
}

const RootLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <ConsentBanner />
      </body>
    </html>
  )
}

export default RootLayout