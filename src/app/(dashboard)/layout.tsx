import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { WorkspaceProvider } from '@/lib/workspace-context'
import { DashboardMain } from '@/components/layout/dashboard-main'

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
            <WorkspaceProvider>
                <Sidebar session={session} />
                <DashboardMain>
                    {children}
                </DashboardMain>
            </WorkspaceProvider>
            <Toaster richColors position="top-right" />
        </div>
    )
}


