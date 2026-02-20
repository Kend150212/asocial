import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Megaphone, PenSquare, Users, BarChart3 } from 'lucide-react'
import { OnboardingChecklist } from '@/components/onboarding-checklist'

export default async function DashboardPage() {
    const session = await auth()

    const stats = [
        { title: 'Total Channels', value: '0', icon: Megaphone, change: 'Setup required' },
        { title: 'Total Posts', value: '0', icon: PenSquare, change: 'No posts yet' },
        { title: 'Team Members', value: '1', icon: Users, change: 'Admin only' },
        { title: 'Engagement', value: '0%', icon: BarChart3, change: 'No data' },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome back, {session?.user?.name || 'Admin'}
                </p>
            </div>

            {/* Onboarding Checklist — client component, only renders when setup is incomplete */}
            <OnboardingChecklist />

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                        </CardContent>
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/20 to-primary/60" />
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Getting Started</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                            <Megaphone className="h-8 w-8 text-primary mb-2" />
                            <h3 className="font-semibold">Create Channel</h3>
                            <p className="text-sm text-muted-foreground">Set up your first social media channel</p>
                        </div>
                        <div className="rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                            <PenSquare className="h-8 w-8 text-primary mb-2" />
                            <h3 className="font-semibold">Create Post</h3>
                            <p className="text-sm text-muted-foreground">Write and schedule your first post</p>
                        </div>
                        <div className="rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                            <Users className="h-8 w-8 text-primary mb-2" />
                            <h3 className="font-semibold">Invite Team</h3>
                            <p className="text-sm text-muted-foreground">Add managers and customers</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
