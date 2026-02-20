'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWorkspace } from '@/lib/workspace-context'
import { useTranslation } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'
import {
    FileBarChart2,
    Send,
    Calendar,
    XCircle,
    FileText,
    Clock,
    RefreshCw,
    Download,
    TrendingUp,
    Users,
    Eye,
    Heart,
    MessageCircle,
    Share2,
    AlertCircle,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────
interface KPI {
    total: number
    published: number
    scheduled: number
    failed: number
    drafts: number
    pendingApproval: number
}

interface DayData {
    date: string
    total: number
    published: number
    scheduled: number
}

interface PlatformCount {
    platform: string
    published: number
    failed: number
    total: number
}

interface StatusData {
    name: string
    value: number
}

interface ReportsData {
    kpi: KPI
    postsOverTime: DayData[]
    platformBreakdown: PlatformCount[]
    statusBreakdown: StatusData[]
    recentPublished: {
        id: string
        content: string | null
        publishedAt: string | null
        media: { mediaItem: { url: string; thumbnailUrl: string | null } }[]
        platformStatuses: { platform: string; status: string }[]
    }[]
}

interface PlatformInsight {
    platform: string
    accountName: string
    followers: number | null
    newFollowers?: number | null
    engagement: number | null
    impressions: number | null
    reach: number | null
    likes?: number | null
    comments?: number | null
    shares?: number | null
    views?: number | null
    pendingApproval?: boolean
}

interface PostInsight {
    postId: string
    platform: string
    content: string | null
    thumbnail: string | null
    publishedAt: string | null
    likes: number
    comments: number
    shares: number
    reach: number
    impressions: number
}

// ─── Constants ───────────────────────────────────────────────────────
const PIE_COLORS: Record<string, string> = {
    PUBLISHED: '#22c55e',
    SCHEDULED: '#f59e0b',
    DRAFT: '#6b7280',
    FAILED: '#ef4444',
    PENDING_APPROVAL: '#8b5cf6',
}

const PLATFORM_COLORS: Record<string, string> = {
    facebook: '#1877f2',
    instagram: '#e1306c',
    youtube: '#ff0000',
    tiktok: '#010101',
    linkedin: '#0a66c2',
    pinterest: '#e60023',
    x: '#000000',
    gbp: '#34a853',
}

const PLATFORM_LABELS: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
    pinterest: 'Pinterest',
    x: 'X (Twitter)',
    gbp: 'Google Business',
}

function platformColor(platform: string) {
    return PLATFORM_COLORS[platform] || '#6b7280'
}

function fmt(n: number | null | undefined) {
    if (n == null) return '—'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
    return String(n)
}

// ─── KPI Card ────────────────────────────────────────────────────────
function KpiCard({
    label, value, icon: Icon, color,
}: {
    label: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    color: string
}) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${color}`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{fmt(value)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
            </CardContent>
        </Card>
    )
}

// ─── Custom Tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
    active?: boolean
    payload?: { name: string; value: number; color: string }[]
    label?: string
}) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-card border rounded-lg p-3 shadow-lg text-xs">
            <p className="font-medium mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
            ))}
        </div>
    )
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function ReportsPage() {
    const t = useTranslation()
    const { channels, activeChannelId } = useWorkspace()
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(activeChannelId)

    const [range, setRange] = useState('30')
    const [loading, setLoading] = useState(false)
    const [insightsLoading, setInsightsLoading] = useState(false)
    const [data, setData] = useState<ReportsData | null>(null)
    const [insights, setInsights] = useState<{ platformInsights: PlatformInsight[]; postInsights: PostInsight[] } | null>(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ range })
            if (selectedChannelId) params.set('channelId', selectedChannelId)
            const res = await fetch(`/api/admin/reports?${params}`)
            const json = await res.json()
            setData(json)
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [selectedChannelId, range])

    const fetchInsights = useCallback(async () => {
        setInsightsLoading(true)
        try {
            const params = new URLSearchParams()
            if (selectedChannelId) params.set('channelId', selectedChannelId)
            const res = await fetch(`/api/admin/reports/insights?${params}`)
            const json = await res.json()
            setInsights(json)
        } catch {
            // silent
        } finally {
            setInsightsLoading(false)
        }
    }, [selectedChannelId])

    useEffect(() => {
        fetchData()
        fetchInsights()
    }, [fetchData, fetchInsights])

    // ── CSV Export ───────────────────────────────────────────────────
    const exportCSV = () => {
        if (!data) return
        const rows = [
            ['Date', 'Total Posts', 'Published', 'Scheduled'],
            ...data.postsOverTime.map(d => [d.date, d.total, d.published, d.scheduled]),
        ]
        const csv = rows.map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reports-${range}days-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const kpi = data?.kpi

    return (
        <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">{t('reports.title')}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{t('reports.description')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Channel selector */}
                    <Select value={selectedChannelId || 'all'} onValueChange={v => setSelectedChannelId(v === 'all' ? null : v)}>
                        <SelectTrigger className="h-8 text-xs w-40">
                            <SelectValue placeholder={t('reports.selectChannel')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('reports.allChannels')}</SelectItem>
                            {channels.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Date range */}
                    <Select value={range} onValueChange={setRange}>
                        <SelectTrigger className="h-8 text-xs w-28">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">{t('reports.range7')}</SelectItem>
                            <SelectItem value="30">{t('reports.range30')}</SelectItem>
                            <SelectItem value="90">{t('reports.range90')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { fetchData(); fetchInsights() }}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t('reports.refresh')}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCSV} disabled={!data}>
                        <Download className="h-3.5 w-3.5 mr-1.5" />{t('reports.exportCSV')}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />{t('reports.loading')}
                </div>
            ) : !data ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">{t('reports.noData')}</div>
            ) : (
                <>
                    {/* ── KPI Cards ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
                        <KpiCard label={t('reports.totalPosts')} value={kpi?.total ?? 0} icon={FileBarChart2} color="bg-primary" />
                        <KpiCard label={t('reports.published')} value={kpi?.published ?? 0} icon={Send} color="bg-green-500" />
                        <KpiCard label={t('reports.scheduled')} value={kpi?.scheduled ?? 0} icon={Calendar} color="bg-amber-500" />
                        <KpiCard label={t('reports.failed')} value={kpi?.failed ?? 0} icon={XCircle} color="bg-red-500" />
                        <KpiCard label={t('reports.drafts')} value={kpi?.drafts ?? 0} icon={FileText} color="bg-gray-500" />
                        <KpiCard label={t('reports.pendingApproval')} value={kpi?.pendingApproval ?? 0} icon={Clock} color="bg-violet-500" />
                    </div>

                    {/* ── Posts Over Time + Status Pie ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Area Chart */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />{t('reports.postsOverTime')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={data.postsOverTime} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10 }}
                                            tickFormatter={v => v.slice(5)}
                                            className="fill-muted-foreground"
                                        />
                                        <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Area type="monotone" dataKey="total" name={t('reports.totalPosts')} stroke="hsl(var(--primary))" fill="url(#colorTotal)" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="published" name={t('reports.published')} stroke="#22c55e" fill="url(#colorPublished)" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Pie Chart */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm font-semibold">{t('reports.statusDistribution')}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 flex flex-col items-center">
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={data.statusBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {data.statusBreakdown.map((entry, i) => (
                                                <Cell key={i} fill={PIE_COLORS[entry.name] ?? '#6b7280'} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2">
                                    {data.statusBreakdown.map((s, i) => (
                                        <div key={i} className="flex items-center gap-1 text-xs">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[s.name] ?? '#6b7280' }} />
                                            <span className="text-muted-foreground">{s.name.replace('_', ' ')}</span>
                                            <span className="font-medium">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Platform Bar Chart ── */}
                    {data.platformBreakdown.length > 0 && (
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm font-semibold">{t('reports.platformBreakdown')}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={data.platformBreakdown} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                                        <YAxis
                                            type="category"
                                            dataKey="platform"
                                            tick={{ fontSize: 11 }}
                                            className="fill-muted-foreground"
                                            tickFormatter={p => PLATFORM_LABELS[p] || p}
                                            width={90}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="published" name={t('reports.published')} radius={[0, 4, 4, 0]}>
                                            {data.platformBreakdown.map((entry, i) => (
                                                <Cell key={i} fill={platformColor(entry.platform)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Platform Engagement Table (from real platform APIs) ── */}
                    <Card>
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4" />{t('reports.platformEngagement')}
                            </CardTitle>
                            {insightsLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            {!insights?.platformInsights?.length ? (
                                <div className="px-4 pb-4 text-sm text-muted-foreground">{t('reports.noInsights')}</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('reports.platform')}</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">{t('reports.followers')}</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">{t('reports.newFollowers')}</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">{t('reports.engagement')}</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">{t('reports.reach')}</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">{t('reports.impressions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {insights.platformInsights.map((pi, i) => (
                                                <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                style={{ background: platformColor(pi.platform) }}
                                                            />
                                                            <div>
                                                                <p className="font-medium text-xs">{PLATFORM_LABELS[pi.platform] || pi.platform}</p>
                                                                <p className="text-[10px] text-muted-foreground">{pi.accountName}</p>
                                                            </div>
                                                            {pi.pendingApproval && (
                                                                <Badge variant="outline" className="text-[9px] h-4 px-1 ml-1 text-amber-600 border-amber-400">
                                                                    <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                                                    {t('reports.pendingApiApproval')}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono">{fmt(pi.followers)}</td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono text-green-600">
                                                        {pi.newFollowers != null ? `+${fmt(pi.newFollowers)}` : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono">{fmt(pi.engagement)}</td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono">{fmt(pi.reach)}</td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono">{fmt(pi.impressions)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Top Posts ── */}
                    {insights?.postInsights && insights.postInsights.length > 0 && (
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm font-semibold">{t('reports.topPosts')}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('reports.recentPosts')}</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                                                    <Heart className="h-3 w-3 inline mr-1" />{t('reports.likes')}
                                                </th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                                                    <MessageCircle className="h-3 w-3 inline mr-1" />{t('reports.comments')}
                                                </th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                                                    <Share2 className="h-3 w-3 inline mr-1" />{t('reports.shares')}
                                                </th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                                                    <Eye className="h-3 w-3 inline mr-1" />{t('reports.reach')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {insights.postInsights.map((post, i) => (
                                                <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {post.thumbnail ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={post.thumbnail} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-xs truncate max-w-[200px]">{post.content || '—'}</p>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <div className="w-2 h-2 rounded-full" style={{ background: platformColor(post.platform) }} />
                                                                    <p className="text-[11px] text-muted-foreground">{PLATFORM_LABELS[post.platform] || post.platform}</p>
                                                                    {post.publishedAt && (
                                                                        <p className="text-[11px] text-muted-foreground">
                                                                            · {new Date(post.publishedAt).toLocaleDateString()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono">{fmt(post.likes)}</td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono">{fmt(post.comments)}</td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono">{fmt(post.shares)}</td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono">{fmt(post.reach)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}
