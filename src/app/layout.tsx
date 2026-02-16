import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'ASocial - Social Media Management',
  description: 'AI-powered Social Media & Email Marketing Management Platform',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'facebook-domain-verification': '067n6haeldnqrdj5tizunolln4pzoe',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

