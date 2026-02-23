import { type Metadata } from 'next'
import { getBrandingServer } from '@/lib/use-branding-server'

export async function generateMetadata(): Promise<Metadata> {
    const brand = await getBrandingServer()
    return {
        title: `Sign In`,
        description: `Sign in to ${brand.appName || 'NeeFlow'} — ${brand.tagline || 'Social Media Management'}`,
    }
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
