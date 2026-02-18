import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar session={session} />
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-3 py-4 sm:p-6">
                    {children}
                </div>
            </main>
            <Toaster richColors position="top-right" />
        </div>
    )
}
