'use client'

import { useEffect, useState, useCallback } from 'react'
import {
    CreditCard,
    TrendingUp,
    Users,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface SubRow {
    id: string
    status: string
    billingInterval: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    createdAt: string
    user: { id: string; name: string | null; email: string }
    plan: { id: string; name: string; priceMonthly: number; priceAnnual: number }
}

interface Plan { id: string; name: string; priceMonthly: number }

const STATUS_COLORS: Record<string, string> = {
    active: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    past_due: 'text-red-400 border-red-500/30 bg-red-500/10',
    canceled: 'text-zinc-400 border-zinc-500/30',
    trialing: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
}

export default function AdminBillingPage() {
    const [subs, setSubs] = useState<SubRow[]>([])
    const [plans, setPlans] = useState<Plan[]>([])
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [loading, setLoading] = useState(true)
    const [overridingId, setOverridingId] = useState<string | null>(null)
    const [overridePlanId, setOverridePlanId] = useState<Record<string, string>>({})

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [subRes, planRes] = await Promise.all([
                fetch('/api/admin/billing'),
                fetch('/api/admin/billing/plans'),
            ])
            if (subRes.ok) setSubs(await subRes.json())
            if (planRes.ok) setPlans(await planRes.json())
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // Metrics
    const active = subs.filter(s => s.status === 'active')
    const pastDue = subs.filter(s => s.status === 'past_due')
    const canceled = subs.filter(s => s.status === 'canceled')
    const mrr = active.reduce((sum, s) => {
        const price = s.billingInterval === 'annual' ? s.plan.priceAnnual / 12 : s.plan.priceMonthly
        return sum + price
    }, 0)

    const filtered = statusFilter === 'ALL' ? subs : subs.filter(s => s.status === statusFilter)

    const handleOverride = async (userId: string) => {
        const planId = overridePlanId[userId]
        if (!planId) return
        setOverridingId(userId)
        try {
            const res = await fetch(`/api/admin/users/${userId}/billing`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            })
            if (res.ok) {
                toast.success('Plan overridden!')
                fetchData()
            } else {
                toast.error('Failed to override plan')
            }
        } finally {
            setOverridingId(null)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <CreditCard className="h-6 w-6" />
                    Billing Overview
                </h1>
                <p className="text-muted-foreground mt-1">Revenue, subscriptions, and payment status</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" /> MRR
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">${mrr.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">per month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Active
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-emerald-400">{active.length}</p>
                        <p className="text-xs text-muted-foreground">subscribers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 text-red-400" /> Past Due
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-400">{pastDue.length}</p>
                        <p className="text-xs text-muted-foreground">need attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5 text-zinc-400" /> Canceled
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-zinc-400">{canceled.length}</p>
                        <p className="text-xs text-muted-foreground">churned</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{filtered.length} subscriptions</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] h-8 text-sm ml-auto">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                        <SelectItem value="trialing">Trialing</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Subscriptions Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Interval</TableHead>
                                <TableHead>Renews</TableHead>
                                <TableHead>Stripe</TableHead>
                                <TableHead>Override</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        No subscriptions found
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map(sub => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-sm">{sub.user.name ?? '—'}</p>
                                            <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs border-violet-500/30 text-violet-400 bg-violet-500/10">
                                            <Zap className="h-3 w-3 mr-1" />
                                            {sub.plan.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[sub.status] ?? ''}`}>
                                            {sub.status}
                                            {sub.cancelAtPeriodEnd && <Clock className="h-3 w-3 ml-1" />}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground capitalize">
                                        {sub.billingInterval}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {sub.stripeSubscriptionId ? (
                                            <a
                                                href={`https://dashboard.stripe.com/subscriptions/${sub.stripeSubscriptionId}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                            >
                                                View <ExternalLink className="h-3 w-3" />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Manual</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Select
                                                value={overridePlanId[sub.user.id] ?? sub.plan.id}
                                                onValueChange={(v) => setOverridePlanId(prev => ({ ...prev, [sub.user.id]: v }))}
                                            >
                                                <SelectTrigger className="h-7 w-[110px] text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {plans.map(p => (
                                                        <SelectItem key={p.id} value={p.id} className="text-xs">
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2 text-xs"
                                                disabled={
                                                    overridingId === sub.user.id ||
                                                    !overridePlanId[sub.user.id] ||
                                                    overridePlanId[sub.user.id] === sub.plan.id
                                                }
                                                onClick={() => handleOverride(sub.user.id)}
                                            >
                                                {overridingId === sub.user.id ? '...' : 'Apply'}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
