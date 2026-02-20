'use client'

import { useEffect, useState, useCallback } from 'react'
import {
    CreditCard, TrendingUp, Users, AlertCircle, CheckCircle2,
    XCircle, Clock, Zap, ExternalLink, Download, Sparkles,
    ArrowUpRight, Target,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubRow {
    id: string
    status: string
    billingInterval: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    createdAt: string
    user: { id: string; name: string | null; email: string; trialEndsAt: string | null }
    plan: { id: string; name: string; priceMonthly: number; priceAnnual: number }
}
interface Plan { id: string; name: string; priceMonthly: number }
interface MrrPoint { month: string; mrr: number; subs: number }
interface PlanPoint { name: string; count: number }
interface TrialStats { active: number; expired: number; converted: number; conversionRate: number }

interface BillingData {
    subs: SubRow[]
    mrrHistory: MrrPoint[]
    planBreakdown: PlanPoint[]
    trialStats: TrialStats
}

const PIE_COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#6366f1']
const STATUS_COLORS: Record<string, string> = {
    active: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    past_due: 'text-red-400 border-red-500/30 bg-red-500/10',
    canceled: 'text-zinc-400 border-zinc-500/30',
    trialing: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(subs: SubRow[]) {
    const header = ['Name', 'Email', 'Plan', 'Status', 'Interval', 'Renews', 'Stripe ID', 'Created']
    const rows = subs.map(s => [
        s.user.name ?? '',
        s.user.email,
        s.plan.name,
        s.status,
        s.billingInterval,
        new Date(s.currentPeriodEnd).toLocaleDateString(),
        s.stripeSubscriptionId ?? 'Manual',
        new Date(s.createdAt).toLocaleDateString(),
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminBillingPage() {
    const [data, setData] = useState<BillingData | null>(null)
    const [plans, setPlans] = useState<Plan[]>([])
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [loading, setLoading] = useState(true)
    const [overridingId, setOverridingId] = useState<string | null>(null)
    const [overridePlanId, setOverridePlanId] = useState<Record<string, string>>({})

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [billingRes, planRes] = await Promise.all([
                fetch('/api/admin/billing'),
                fetch('/api/admin/billing/plans'),
            ])
            if (billingRes.ok) setData(await billingRes.json())
            if (planRes.ok) setPlans(await planRes.json())
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

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
                const d = await res.json().catch(() => ({}))
                toast.error(d.error ?? 'Failed to override plan')
            }
        } finally {
            setOverridingId(null)
        }
    }

    if (loading || !data) {
        return (
            <div className="p-6 space-y-6 animate-pulse">
                <div className="h-8 w-56 bg-muted rounded" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
                </div>
                <div className="h-64 bg-muted rounded-xl" />
            </div>
        )
    }

    const { subs, mrrHistory, planBreakdown, trialStats } = data
    const active = subs.filter(s => s.status === 'active')
    const pastDue = subs.filter(s => s.status === 'past_due')
    const canceled = subs.filter(s => s.status === 'canceled')
    const mrr = active.reduce((sum, s) => {
        const price = s.billingInterval === 'annual' ? s.plan.priceAnnual / 12 : s.plan.priceMonthly
        return sum + price
    }, 0)
    const filtered = statusFilter === 'ALL' ? subs : subs.filter(s => s.status === statusFilter)

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <CreditCard className="h-6 w-6" />
                        Billing Overview
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Revenue, subscriptions, and payment status</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV(subs)}>
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-violet-400" /> MRR
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

            {/* Charts Row */}
            <div className="grid gap-4 lg:grid-cols-5">
                {/* MRR Area Chart */}
                <Card className="lg:col-span-3">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-violet-400" />
                            Revenue (MRR) — Last 6 Months
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={mrrHistory}>
                                <defs>
                                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                                <Tooltip
                                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                                    formatter={(v: number | undefined) => [`$${v ?? 0}`, 'MRR']}
                                />
                                <Area type="monotone" dataKey="mrr" stroke="#7c3aed" fill="url(#mrrGrad)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Plan Pie Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4 text-blue-400" />
                            Plan Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie data={planBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={3}>
                                    {planBreakdown.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                                />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Trial Stats */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        Trial Stats
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <div className="flex items-center gap-1.5 text-xs text-indigo-400 mb-1">
                                <Clock className="h-3.5 w-3.5" /> Active Trials
                            </div>
                            <p className="text-2xl font-bold">{trialStats.active}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                <XCircle className="h-3.5 w-3.5" /> Trials Expired
                            </div>
                            <p className="text-2xl font-bold">{trialStats.expired}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
                                <ArrowUpRight className="h-3.5 w-3.5" /> Converted
                            </div>
                            <p className="text-2xl font-bold text-emerald-400">{trialStats.converted}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-1">
                                <Target className="h-3.5 w-3.5" /> Conversion Rate
                            </div>
                            <p className="text-2xl font-bold text-amber-400">{trialStats.conversionRate}%</p>
                        </div>
                    </div>

                    {/* Mini bar chart for trial funnel */}
                    {(trialStats.active + trialStats.expired) > 0 && (
                        <div className="mt-4">
                            <ResponsiveContainer width="100%" height={80}>
                                <BarChart data={[
                                    { label: 'Active', value: trialStats.active, fill: '#6366f1' },
                                    { label: 'Expired', value: trialStats.expired, fill: '#71717a' },
                                    { label: 'Converted', value: trialStats.converted, fill: '#10b981' },
                                ]} barSize={32}>
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                    <YAxis hide allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {[{ fill: '#6366f1' }, { fill: '#71717a' }, { fill: '#10b981' }].map((c, i) => (
                                            <Cell key={i} fill={c.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Subscription Table */}
            <div>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
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
                                {filtered.length === 0 ? (
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
                                                {sub.user.trialEndsAt && (
                                                    <span className="text-xs text-indigo-400">Trial</span>
                                                )}
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
        </div>
    )
}
