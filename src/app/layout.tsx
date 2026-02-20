import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { getBrandingServer } from '@/lib/use-branding'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
})

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandingServer()
  return {
    title: `${brand.appName} - ${brand.tagline}`,
    description: `${brand.appName} — AI-powered Social Media & Email Marketing Management Platform`,
    icons: {
      icon: brand.faviconUrl || '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    verification: {
      google: 'SeCWhzMMwoYXe4EHwX_-xvZbLQRBOThtMNlCssrtqQo',
    },
    other: {
      'facebook-domain-verification': '067n6haeldnqrdj5tizunolln4pzoe',
    },
  }
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

