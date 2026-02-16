import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/channels/[id]/templates — list content templates
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const templates = await prisma.contentTemplate.findMany({
        where: { channelId: id },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(templates)
}

// POST /api/admin/channels/[id]/templates — create template
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, platform, templateContent, variables } = body

    if (!name || !templateContent) {
        return NextResponse.json({ error: 'Name and template content are required' }, { status: 400 })
    }

    const template = await prisma.contentTemplate.create({
        data: {
            channelId: id,
            name,
            platform: platform || null,
            templateContent,
            variables: variables || [],
        },
    })

    return NextResponse.json(template, { status: 201 })
}

// PUT /api/admin/channels/[id]/templates — update template
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await params
    const body = await req.json()
    const { templateId, name, platform, templateContent, variables } = body

    if (!templateId) {
        return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const template = await prisma.contentTemplate.update({
        where: { id: templateId },
        data: {
            ...(name !== undefined && { name }),
            ...(platform !== undefined && { platform }),
            ...(templateContent !== undefined && { templateContent }),
            ...(variables !== undefined && { variables }),
        },
    })

    return NextResponse.json(template)
}

// DELETE /api/admin/channels/[id]/templates — delete template
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await params
    const { searchParams } = new URL(req.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
        return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    await prisma.contentTemplate.delete({ where: { id: templateId } })

    return NextResponse.json({ success: true })
}
