import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'NeeFlow Setup Wizard',
    description: 'Configure your NeeFlow instance',
}

export default function SetupLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
            {children}
        </div>
    )
}
