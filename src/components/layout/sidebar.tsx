'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NextImage from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    LayoutDashboard,
    Megaphone,
    PenSquare,
    CalendarDays,
    Image,
    Mail,
    BarChart3,
    Users,
    Settings,
    Shield,
    Plug,
    Activity,
    Bell,
    LogOut,
    ChevronLeft,
    Menu,
    Zap,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    badge?: string
    roles?: string[]
}

const mainNav: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Channels', href: '/dashboard/channels', icon: Megaphone },
    { title: 'Posts', href: '/dashboard/posts', icon: PenSquare },
    { title: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays },
    { title: 'Media', href: '/dashboard/media', icon: Image },
    { title: 'Email', href: '/dashboard/email', icon: Mail },
    { title: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
]

const adminNav: NavItem[] = [
    { title: 'Users', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
    { title: 'Channels', href: '/admin/channels', icon: Shield, roles: ['ADMIN'] },
    { title: 'API Hub', href: '/admin/integrations', icon: Plug, roles: ['ADMIN'] },
    { title: 'Activity', href: '/admin/activity', icon: Activity, roles: ['ADMIN'] },
    { title: 'Automation', href: '/admin/automation', icon: Zap, roles: ['ADMIN'] },
    { title: 'Settings', href: '/admin/settings', icon: Settings, roles: ['ADMIN'] },
]

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [collapsed, setCollapsed] = useState(false)
    const isAdmin = session?.user?.role === 'ADMIN'

    const initials = session?.user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'

    return (
        <aside
            className={cn(
                'flex h-screen flex-col border-r bg-card transition-all duration-300',
                collapsed ? 'w-[68px]' : 'w-[260px]'
            )}
        >
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <NextImage src="/logo.png" alt="ASocial" width={32} height={32} className="rounded-lg" />
                        <span className="text-lg font-bold tracking-tight">ASocial</span>
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <Separator />

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <nav className="space-y-1 px-3">
                    {mainNav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                'hover:bg-accent hover:text-accent-foreground',
                                pathname === item.href || pathname?.startsWith(item.href + '/')
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground',
                                collapsed && 'justify-center px-2'
                            )}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span>{item.title}</span>}
                            {!collapsed && item.badge && (
                                <Badge variant="secondary" className="ml-auto text-xs">
                                    {item.badge}
                                </Badge>
                            )}
                        </Link>
                    ))}
                </nav>

                {isAdmin && (
                    <>
                        <Separator className="my-4" />
                        <div className="px-3">
                            {!collapsed && (
                                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Administration
                                </p>
                            )}
                            <nav className="space-y-1">
                                {adminNav.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                            'hover:bg-accent hover:text-accent-foreground',
                                            pathname === item.href || pathname?.startsWith(item.href + '/')
                                                ? 'bg-accent text-accent-foreground'
                                                : 'text-muted-foreground',
                                            collapsed && 'justify-center px-2'
                                        )}
                                    >
                                        <item.icon className="h-4 w-4 shrink-0" />
                                        {!collapsed && <span>{item.title}</span>}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </>
                )}
            </ScrollArea>

            <Separator />

            {/* Footer */}
            <div className={cn('p-3', collapsed && 'flex flex-col items-center gap-2')}>
                <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                        <Bell className="h-4 w-4" />
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
                    </Button>
                </div>

                <Separator className="my-2" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent',
                                collapsed && 'justify-center p-1'
                            )}
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-xs font-medium">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {!collapsed && (
                                <div className="flex-1 truncate">
                                    <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5">
                            <p className="text-sm font-medium">{session?.user?.name}</p>
                            <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                            <Badge className="mt-1" variant="outline">
                                {session?.user?.role}
                            </Badge>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    )
}
