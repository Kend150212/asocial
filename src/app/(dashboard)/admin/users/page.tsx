'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'
import {
    UserPlus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Shield,
    Users,
    Eye,
    EyeOff,
    ChevronDown,
    Check,
    X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// ─── Types ───────────────────────────────────────────
interface UserRow {
    id: string
    name: string | null
    email: string
    role: 'ADMIN' | 'MANAGER' | 'CUSTOMER'
    isActive: boolean
    image: string | null
    lastLoginAt: string | null
    createdAt: string
    _count: { channelMembers: number }
}

interface ChannelPermission {
    canCreatePost: boolean
    canEditPost: boolean
    canDeletePost: boolean
    canApprovePost: boolean
    canSchedulePost: boolean
    canUploadMedia: boolean
    canDeleteMedia: boolean
    canViewMedia: boolean
    canCreateEmail: boolean
    canManageContacts: boolean
    canViewReports: boolean
    canEditSettings: boolean
}

interface ChannelMemberDetail {
    id: string
    channelId: string
    role: string
    channel: { id: string; name: string; displayName: string }
    permission: ChannelPermission | null
}

interface UserDetail extends Omit<UserRow, '_count'> {
    channelMembers: ChannelMemberDetail[]
}

interface ChannelInfo {
    id: string
    name: string
    displayName: string
}

interface ChannelAssignment {
    channelId: string
    role: 'ADMIN' | 'MANAGER' | 'CUSTOMER'
    assigned: boolean
    permissions: ChannelPermission
}

const PERMISSION_KEYS: (keyof ChannelPermission)[] = [
    'canCreatePost',
    'canEditPost',
    'canDeletePost',
    'canApprovePost',
    'canSchedulePost',
    'canUploadMedia',
    'canDeleteMedia',
    'canViewMedia',
    'canCreateEmail',
    'canManageContacts',
    'canViewReports',
    'canEditSettings',
]

const DEFAULT_PERMISSIONS: Record<string, ChannelPermission> = {
    ADMIN: {
        canCreatePost: true, canEditPost: true, canDeletePost: true,
        canApprovePost: true, canSchedulePost: true, canUploadMedia: true,
        canDeleteMedia: true, canViewMedia: true, canCreateEmail: true,
        canManageContacts: true, canViewReports: true, canEditSettings: true,
    },
    MANAGER: {
        canCreatePost: true, canEditPost: true, canDeletePost: false,
        canApprovePost: false, canSchedulePost: true, canUploadMedia: true,
        canDeleteMedia: false, canViewMedia: true, canCreateEmail: true,
        canManageContacts: true, canViewReports: true, canEditSettings: false,
    },
    CUSTOMER: {
        canCreatePost: false, canEditPost: false, canDeletePost: false,
        canApprovePost: true, canSchedulePost: true, canUploadMedia: true,
        canDeleteMedia: false, canViewMedia: true, canCreateEmail: false,
        canManageContacts: false, canViewReports: true, canEditSettings: false,
    },
}

const roleBadgeVariants: Record<string, string> = {
    ADMIN: 'bg-red-500/10 text-red-500 border-red-500/20',
    MANAGER: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    CUSTOMER: 'bg-green-500/10 text-green-500 border-green-500/20',
}

// ─── Main Page ───────────────────────────────────────
export default function UsersPage() {
    const t = useTranslation()
    const [users, setUsers] = useState<UserRow[]>([])
    const [channels, setChannels] = useState<ChannelInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('ALL')

    // Dialog state
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingUser, setEditingUser] = useState<UserDetail | null>(null)
    const [deletingUser, setDeletingUser] = useState<UserRow | null>(null)

    // Form state
    const [formName, setFormName] = useState('')
    const [formEmail, setFormEmail] = useState('')
    const [formPassword, setFormPassword] = useState('')
    const [formRole, setFormRole] = useState<string>('MANAGER')
    const [formActive, setFormActive] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [saving, setSaving] = useState(false)

    // Channel assignments
    const [channelAssignments, setChannelAssignments] = useState<ChannelAssignment[]>([])

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch {
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchChannels = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/channels')
            if (res.ok) {
                const data = await res.json()
                setChannels(data)
            }
        } catch {
            // Channels might not exist yet
        }
    }, [])

    useEffect(() => {
        fetchUsers()
        fetchChannels()
    }, [fetchUsers, fetchChannels])

    // Filter users
    const filteredUsers = users.filter((u) => {
        const matchSearch = !search ||
            (u.name?.toLowerCase().includes(search.toLowerCase())) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        const matchRole = roleFilter === 'ALL' || u.role === roleFilter
        return matchSearch && matchRole
    })

    // ─── Add User ────────────────────────────────────
    const handleOpenAdd = () => {
        setFormName('')
        setFormEmail('')
        setFormPassword('')
        setFormRole('MANAGER')
        setFormActive(true)
        setShowPassword(false)
        setShowAddDialog(true)
    }

    const handleCreateUser = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formName,
                    email: formEmail,
                    password: formPassword,
                    role: formRole,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                toast.error(err.error === 'Email already exists'
                    ? t('users.error.emailExists')
                    : t('users.error.createFailed'))
                return
            }
            toast.success(t('users.success.created'))
            setShowAddDialog(false)
            fetchUsers()
        } catch {
            toast.error(t('users.error.createFailed'))
        } finally {
            setSaving(false)
        }
    }

    // ─── Edit User ───────────────────────────────────
    const handleOpenEdit = async (user: UserRow) => {
        try {
            const res = await fetch(`/api/admin/users/${user.id}`)
            if (!res.ok) throw new Error()
            const detail: UserDetail = await res.json()
            setEditingUser(detail)
            setFormName(detail.name || '')
            setFormEmail(detail.email)
            setFormPassword('')
            setFormRole(detail.role)
            setFormActive(detail.isActive)
            setShowPassword(false)

            // Build channel assignments
            const assignments: ChannelAssignment[] = channels.map((ch) => {
                const member = detail.channelMembers.find((m) => m.channelId === ch.id)
                if (member) {
                    return {
                        channelId: ch.id,
                        role: member.role as 'ADMIN' | 'MANAGER' | 'CUSTOMER',
                        assigned: true,
                        permissions: member.permission || DEFAULT_PERMISSIONS[member.role] || DEFAULT_PERMISSIONS.MANAGER,
                    }
                }
                return {
                    channelId: ch.id,
                    role: detail.role as 'ADMIN' | 'MANAGER' | 'CUSTOMER',
                    assigned: false,
                    permissions: { ...DEFAULT_PERMISSIONS[detail.role] || DEFAULT_PERMISSIONS.MANAGER },
                }
            })
            setChannelAssignments(assignments)
        } catch {
            toast.error('Failed to load user details')
        }
    }

    const handleUpdateUser = async () => {
        if (!editingUser) return
        setSaving(true)
        try {
            // Update user info
            const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formName,
                    email: formEmail,
                    password: formPassword || undefined,
                    role: formRole,
                    isActive: formActive,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                toast.error(err.error === 'Email already exists'
                    ? t('users.error.emailExists')
                    : t('users.error.updateFailed'))
                return
            }

            // Update channel assignments
            const assignedChannels = channelAssignments
                .filter((a) => a.assigned)
                .map((a) => ({
                    channelId: a.channelId,
                    role: a.role,
                    permissions: a.permissions,
                }))

            await fetch(`/api/admin/users/${editingUser.id}/channels`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channels: assignedChannels }),
            })

            toast.success(t('users.success.updated'))
            setEditingUser(null)
            fetchUsers()
        } catch {
            toast.error(t('users.error.updateFailed'))
        } finally {
            setSaving(false)
        }
    }

    // ─── Delete User ─────────────────────────────────
    const handleDeleteUser = async () => {
        if (!deletingUser) return
        try {
            const res = await fetch(`/api/admin/users/${deletingUser.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            toast.success(t('users.success.deleted'))
            setDeletingUser(null)
            fetchUsers()
        } catch {
            toast.error(t('users.error.deleteFailed'))
        }
    }

    // ─── Channel assignment helpers ──────────────────
    const toggleChannelAssignment = (channelId: string) => {
        setChannelAssignments((prev) =>
            prev.map((a) =>
                a.channelId === channelId ? { ...a, assigned: !a.assigned } : a
            )
        )
    }

    const updateChannelRole = (channelId: string, role: string) => {
        setChannelAssignments((prev) =>
            prev.map((a) =>
                a.channelId === channelId
                    ? {
                        ...a,
                        role: role as 'ADMIN' | 'MANAGER' | 'CUSTOMER',
                        permissions: { ...DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.MANAGER },
                    }
                    : a
            )
        )
    }

    const togglePermission = (channelId: string, perm: keyof ChannelPermission) => {
        setChannelAssignments((prev) =>
            prev.map((a) =>
                a.channelId === channelId
                    ? { ...a, permissions: { ...a.permissions, [perm]: !a.permissions[perm] } }
                    : a
            )
        )
    }

    // ─── Format date ─────────────────────────────────
    const formatDate = (date: string | null) => {
        if (!date) return t('users.never')
        return new Date(date).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    }

    const getInitials = (name: string | null) => {
        if (!name) return '?'
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    }

    // ─── Render ──────────────────────────────────────
    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        {t('users.title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">{t('users.description')}</p>
                </div>
                <Button onClick={handleOpenAdd} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    {t('users.addUser')}
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={t('users.searchPlaceholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">{t('users.allRoles')}</SelectItem>
                                <SelectItem value="ADMIN">{t('users.roles.ADMIN')}</SelectItem>
                                <SelectItem value="MANAGER">{t('users.roles.MANAGER')}</SelectItem>
                                <SelectItem value="CUSTOMER">{t('users.roles.CUSTOMER')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[280px]">{t('users.name')}</TableHead>
                                <TableHead>{t('users.role')}</TableHead>
                                <TableHead>{t('users.status')}</TableHead>
                                <TableHead className="text-center">{t('users.channels')}</TableHead>
                                <TableHead>{t('users.lastLogin')}</TableHead>
                                <TableHead className="w-[60px]">{t('users.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        {t('common.loading')}
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        {t('users.noUsers')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenEdit(user)}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-primary/10 text-xs font-medium">
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.name || '—'}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={roleBadgeVariants[user.role]}>
                                                {t(`users.roles.${user.role}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive ? 'default' : 'secondary'} className={
                                                user.isActive
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-zinc-500/10 text-zinc-400'
                                            }>
                                                {user.isActive ? t('users.active') : t('users.inactive')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="font-mono">
                                                {user._count.channelMembers}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(user.lastLoginAt)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(user) }}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        {t('users.editUser')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={(e) => { e.stopPropagation(); setDeletingUser(user) }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {t('users.deleteUser')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ─── Add User Dialog ──────────────────── */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            {t('users.addUser')}
                        </DialogTitle>
                        <DialogDescription>{t('users.description')}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>{t('users.name')}</Label>
                            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="John Doe" />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('users.email')}</Label>
                            <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="user@example.com" />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('users.password')}</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formPassword}
                                    onChange={(e) => setFormPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('users.role')}</Label>
                            <Select value={formRole} onValueChange={setFormRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">{t('users.roles.ADMIN')}</SelectItem>
                                    <SelectItem value="MANAGER">{t('users.roles.MANAGER')}</SelectItem>
                                    <SelectItem value="CUSTOMER">{t('users.roles.CUSTOMER')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleCreateUser} disabled={saving || !formName || !formEmail || !formPassword}>
                            {saving ? t('common.loading') : t('common.create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Edit User Dialog ─────────────────── */}
            <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null) }}>
                <DialogContent className="sm:max-w-[720px] max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5" />
                            {t('users.editUser')}
                        </DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="info">{t('users.userInfo')}</TabsTrigger>
                            <TabsTrigger value="channels" className="gap-1">
                                <Shield className="h-3.5 w-3.5" />
                                {t('users.channelPermissions')}
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab 1: User Info */}
                        <TabsContent value="info" className="mt-4 space-y-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>{t('users.name')}</Label>
                                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('users.email')}</Label>
                                    <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('users.password')}</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formPassword}
                                            onChange={(e) => setFormPassword(e.target.value)}
                                            placeholder={t('users.passwordHelp')}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('users.role')}</Label>
                                        <Select value={formRole} onValueChange={setFormRole}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ADMIN">{t('users.roles.ADMIN')}</SelectItem>
                                                <SelectItem value="MANAGER">{t('users.roles.MANAGER')}</SelectItem>
                                                <SelectItem value="CUSTOMER">{t('users.roles.CUSTOMER')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('users.status')}</Label>
                                        <div className="flex items-center gap-3 h-10">
                                            <Switch
                                                checked={formActive}
                                                onCheckedChange={setFormActive}
                                            />
                                            <span className="text-sm">
                                                {formActive ? t('users.active') : t('users.inactive')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 2: Channel Permissions */}
                        <TabsContent value="channels" className="mt-4 flex-1 overflow-hidden">
                            <ScrollArea className="h-[400px] pr-4">
                                {channels.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('users.noChannels')}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {channelAssignments.map((assignment) => {
                                            const channel = channels.find((c) => c.id === assignment.channelId)
                                            if (!channel) return null
                                            return (
                                                <Card key={assignment.channelId} className={
                                                    assignment.assigned
                                                        ? 'border-primary/30 bg-primary/5'
                                                        : 'opacity-60'
                                                }>
                                                    <CardContent className="pt-4 pb-4">
                                                        {/* Channel header */}
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <Checkbox
                                                                    checked={assignment.assigned}
                                                                    onCheckedChange={() => toggleChannelAssignment(assignment.channelId)}
                                                                />
                                                                <div>
                                                                    <p className="font-medium text-sm">{channel.displayName}</p>
                                                                    <p className="text-xs text-muted-foreground">@{channel.name}</p>
                                                                </div>
                                                            </div>
                                                            {assignment.assigned && (
                                                                <Select
                                                                    value={assignment.role}
                                                                    onValueChange={(v) => updateChannelRole(assignment.channelId, v)}
                                                                >
                                                                    <SelectTrigger className="w-[130px] h-8 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="MANAGER">{t('users.roles.MANAGER')}</SelectItem>
                                                                        <SelectItem value="CUSTOMER">{t('users.roles.CUSTOMER')}</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        </div>

                                                        {/* Permission grid */}
                                                        {assignment.assigned && (
                                                            <div className="grid grid-cols-3 gap-x-4 gap-y-2 mt-2 pl-7">
                                                                {PERMISSION_KEYS.map((perm) => (
                                                                    <label
                                                                        key={perm}
                                                                        className="flex items-center gap-2 text-xs cursor-pointer hover:text-foreground text-muted-foreground"
                                                                    >
                                                                        <Checkbox
                                                                            checked={assignment.permissions[perm]}
                                                                            onCheckedChange={() => togglePermission(assignment.channelId, perm)}
                                                                            className="h-3.5 w-3.5"
                                                                        />
                                                                        {t(`users.permissions.${perm}`)}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setEditingUser(null)}>{t('common.cancel')}</Button>
                        <Button onClick={handleUpdateUser} disabled={saving || !formName || !formEmail}>
                            {saving ? t('common.loading') : t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Delete Confirmation ──────────────── */}
            <AlertDialog open={!!deletingUser} onOpenChange={(open) => { if (!open) setDeletingUser(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('users.deleteUser')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('users.deleteConfirm')}
                            {deletingUser && (
                                <span className="block mt-2 font-medium text-foreground">
                                    {deletingUser.name} ({deletingUser.email})
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
