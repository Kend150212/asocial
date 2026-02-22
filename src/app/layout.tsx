import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { getBrandingServer } from '@/lib/use-branding-server'

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
    // Standard link rels — Google OAuth verification bot reads these
    alternates: {
      types: {
        'text/html': 'https://neeflow.com',
      },
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
      <head>
        {/* Standard link rels — Google OAuth & search bots read these to find privacy/terms */}
        <link rel="privacy-policy" href="https://neeflow.com/privacy" />
        <link rel="terms-of-service" href="https://neeflow.com/terms" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

