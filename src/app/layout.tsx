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
  const name = brand.appName || 'NeeFlow'
  const tagline = brand.tagline || 'Social Media Management'
  const description = `${name} — AI-powered Social Media & Email Marketing Management Platform. Schedule posts, generate content with AI, and manage all your social accounts in one place.`
  const url = process.env.NEXTAUTH_URL || 'https://neeflow.com'

  return {
    title: {
      default: `${name} — ${tagline}`,
      template: `%s | ${name}`,
    },
    description,
    keywords: ['social media management', 'AI content generation', 'schedule posts', 'TikTok', 'Instagram', 'Facebook', 'YouTube', 'LinkedIn', 'marketing automation'],
    authors: [{ name }],
    creator: name,
    metadataBase: new URL(url),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: name,
      title: `${name} — ${tagline}`,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — ${tagline}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
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

