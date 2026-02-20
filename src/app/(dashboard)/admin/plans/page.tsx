'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2, Users, AlertTriangle } from 'lucide-react'

type Plan = {
    id: string
    name: string
    nameVi: string
    description: string | null
    descriptionVi: string | null
    priceMonthly: number
    priceAnnual: number
    stripePriceIdMonthly: string | null
    stripePriceIdAnnual: string | null
    maxChannels: number
    maxPostsPerMonth: number
    maxMembersPerChannel: number
    maxAiImagesPerMonth: number
    hasAutoSchedule: boolean
    hasWebhooks: boolean
    hasAdvancedReports: boolean
    hasPrioritySupport: boolean
    hasWhiteLabel: boolean
    isActive: boolean
    isPublic: boolean
    sortOrder: number
    _count: { subscriptions: number }
}

const EMPTY_PLAN: Omit<Plan, 'id' | '_count'> = {
    name: '', nameVi: '', description: null, descriptionVi: null,
    priceMonthly: 0, priceAnnual: 0,
    stripePriceIdMonthly: null, stripePriceIdAnnual: null,
    maxChannels: 1, maxPostsPerMonth: 50, maxMembersPerChannel: 2,
    maxAiImagesPerMonth: 0,
    hasAutoSchedule: false, hasWebhooks: false, hasAdvancedReports: false,
    hasPrioritySupport: false, hasWhiteLabel: false,
    isActive: true, isPublic: true, sortOrder: 0,
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editPlan, setEditPlan] = useState<Partial<Plan> & typeof EMPTY_PLAN>(EMPTY_PLAN)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const fetchPlans = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/admin/plans')
        const data = await res.json()
        setPlans(Array.isArray(data) ? data : [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchPlans() }, [fetchPlans])

    const openCreate = () => {
        setEditPlan(EMPTY_PLAN)
        setIsEditing(false)
        setDialogOpen(true)
    }

    const openEdit = (plan: Plan) => {
        setEditPlan(plan)
        setIsEditing(true)
        setDialogOpen(true)
    }

    const handleSave = async () => {
        setSaving(true)
        const method = isEditing ? 'PUT' : 'POST'
        const url = isEditing ? `/api/admin/plans/${(editPlan as Plan).id}` : '/api/admin/plans'
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editPlan),
        })
        if (res.ok) {
            setDialogOpen(false)
            fetchPlans()
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
        if (res.ok) {
            fetchPlans()
        } else {
            const data = await res.json()
            alert(data.errorVi || data.error)
        }
        setDeleteId(null)
    }

    const field = (key: keyof typeof EMPTY_PLAN, label: string, type: 'text' | 'number' | 'textarea' = 'text') => (
        <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            {type === 'textarea' ? (
                <Textarea
                    value={(editPlan[key] as string) ?? ''}
                    onChange={e => setEditPlan(p => ({ ...p, [key]: e.target.value }))}
                    rows={2}
                    className="text-sm"
                />
            ) : (
                <Input
                    type={type}
                    value={(editPlan[key] as string | number) ?? ''}
                    onChange={e => setEditPlan(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="text-sm"
                />
            )}
        </div>
    )

    const toggle = (key: keyof typeof EMPTY_PLAN, label: string) => (
        <div className="flex items-center justify-between">
            <Label className="text-sm">{label}</Label>
            <Switch
                checked={!!editPlan[key]}
                onCheckedChange={v => setEditPlan(p => ({ ...p, [key]: v }))}
            />
        </div>
    )

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Plans Management</h1>
                    <p className="text-muted-foreground text-sm">Quản lý gói dịch vụ / Manage billing plans</p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Plan
                </Button>
            </div>

            {loading ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {plans.map(plan => (
                        <Card key={plan.id} className={!plan.isActive ? 'opacity-50' : ''}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-base">{plan.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground">{plan.nameVi}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {!plan.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                                        {!plan.isPublic && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-end gap-3">
                                    <div>
                                        <div className="text-xl font-bold">${plan.priceMonthly}<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
                                        <div className="text-xs text-muted-foreground">${plan.priceAnnual}/yr</div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                                        <Users className="h-3.5 w-3.5" />
                                        {plan._count.subscriptions} users
                                    </div>
                                </div>

                                <div className="text-xs space-y-1 text-muted-foreground border-t pt-2">
                                    <div>Channels: {plan.maxChannels === -1 ? '∞' : plan.maxChannels}</div>
                                    <div>Posts/mo: {plan.maxPostsPerMonth === -1 ? '∞' : plan.maxPostsPerMonth}</div>
                                    <div>Members/ch: {plan.maxMembersPerChannel === -1 ? '∞' : plan.maxMembersPerChannel}</div>
                                    <div>AI Images/mo: <span className="font-medium text-foreground">{plan.maxAiImagesPerMonth === -1 ? '∞' : plan.maxAiImagesPerMonth === 0 ? 'BYOK only' : plan.maxAiImagesPerMonth}</span></div>
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {plan.hasAutoSchedule && <Badge variant="secondary" className="text-xs px-1">Auto-schedule</Badge>}
                                        {plan.hasWebhooks && <Badge variant="secondary" className="text-xs px-1">Webhooks</Badge>}
                                        {plan.hasAdvancedReports && <Badge variant="secondary" className="text-xs px-1">Reports</Badge>}
                                        {plan.hasPrioritySupport && <Badge variant="secondary" className="text-xs px-1">Priority</Badge>}
                                        {plan.hasWhiteLabel && <Badge variant="secondary" className="text-xs px-1">White-label</Badge>}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEdit(plan)}>
                                        <Pencil className="h-3.5 w-3.5" /> Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 text-red-500 hover:text-red-600"
                                        onClick={() => setDeleteId(plan.id)}
                                        disabled={plan._count.subscriptions > 0}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            {field('name', 'Name (EN)')}
                            {field('nameVi', 'Tên (VN)')}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {field('description', 'Description (EN)', 'textarea')}
                            {field('descriptionVi', 'Mô tả (VN)', 'textarea')}
                        </div>

                        <div className="border-t pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">PRICING</p>
                            <div className="grid grid-cols-2 gap-3">
                                {field('priceMonthly', 'Monthly Price ($)', 'number')}
                                {field('priceAnnual', 'Annual Price ($)', 'number')}
                            </div>
                        </div>

                        <div className="border-t pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">STRIPE PRICE IDs</p>
                            <div className="grid grid-cols-2 gap-3">
                                {field('stripePriceIdMonthly', 'Monthly Price ID')}
                                {field('stripePriceIdAnnual', 'Annual Price ID')}
                            </div>
                        </div>

                        <div className="border-t pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">LIMITS (-1 = unlimited)</p>
                            <div className="grid grid-cols-3 gap-3">
                                {field('maxChannels', 'Max Channels', 'number')}
                                {field('maxPostsPerMonth', 'Max Posts/Month', 'number')}
                                {field('maxMembersPerChannel', 'Max Members/Channel', 'number')}
                            </div>
                            <div className="mt-3">
                                {field('maxAiImagesPerMonth', 'AI Images/Month (0=BYOK only, -1=unlimited)', 'number')}
                                <p className="text-xs text-muted-foreground mt-1">Uses platform Runware API. 0 = user must bring own key. -1 = unlimited.</p>
                            </div>
                        </div>

                        <div className="border-t pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">FEATURES</p>
                            <div className="space-y-2">
                                {toggle('hasAutoSchedule', 'Auto Scheduling')}
                                {toggle('hasWebhooks', 'Webhooks')}
                                {toggle('hasAdvancedReports', 'Advanced Reports')}
                                {toggle('hasPrioritySupport', 'Priority Support')}
                                {toggle('hasWhiteLabel', 'White Label')}
                            </div>
                        </div>

                        <div className="border-t pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">VISIBILITY</p>
                            <div className="space-y-2">
                                {toggle('isActive', 'Active')}
                                {toggle('isPublic', 'Show on /pricing page')}
                                {field('sortOrder', 'Sort Order', 'number')}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Plan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete Plan
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete this plan? This cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
