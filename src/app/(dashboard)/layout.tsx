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
            <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="px-3 py-4 sm:p-6 max-w-full overflow-hidden">
                    {children}
                </div>
            </main>
            <Toaster richColors position="top-right" />
        </div>
    )
}
