import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// One-off fix: delete duplicate Robolly and update the original to DESIGN category
export async function GET() {
    try {
        // Find all Robolly records
        const all = await prisma.apiIntegration.findMany({
            where: { provider: 'robolly' },
            orderBy: { createdAt: 'asc' },
        })

        if (all.length === 0) {
            return NextResponse.json({ message: 'No Robolly records found' })
        }

        // Keep the first one (original with API key), delete the rest
        const [keep, ...duplicates] = all

        if (duplicates.length > 0) {
            await prisma.apiIntegration.deleteMany({
                where: { id: { in: duplicates.map(d => d.id) } },
            })
        }

        // Update the original to DESIGN category
        await prisma.apiIntegration.update({
            where: { id: keep.id },
            data: { category: 'DESIGN' },
        })

        return NextResponse.json({
            success: true,
            kept: keep.id,
            deleted: duplicates.map(d => d.id),
            message: `Updated Robolly to DESIGN. Deleted ${duplicates.length} duplicate(s).`,
        })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
