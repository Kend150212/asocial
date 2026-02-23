import { type Metadata } from 'next'
import { getBrandingServer } from '@/lib/use-branding-server'

export async function generateMetadata(): Promise<Metadata> {
    const brand = await getBrandingServer()
    return {
        title: `Create Account`,
        description: `Get started with ${brand.appName} — ${brand.tagline}`,
    }
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
