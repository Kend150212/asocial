import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Holidays from 'date-holidays'

/**
 * GET /api/admin/posts/best-times?channelId=xxx&from=ISO&to=ISO&platforms=facebook,instagram
 *
 * Returns scored time slots for the given date range based on:
 * 1. Platform-specific peak hours (50%)
 * 2. Channel posting history patterns (50%)
 * 3. Holiday bonuses/penalties
 *
 * No AI calls — pure data analysis.
 */

// ─── Platform Peak Hours (day × hour → score 0-100) ─────────

interface PeakHour {
    days: number[]  // 0=Sun, 1=Mon, ... 6=Sat
    hours: number[] // 0-23
    score: number   // 0-100
}

const PLATFORM_PEAKS: Record<string, PeakHour[]> = {
    facebook: [
        { days: [2, 3, 4], hours: [9, 10, 11], score: 95 },   // Tue-Thu 9-11 AM
        { days: [3], hours: [11, 12], score: 100 },            // Wed 11 AM-12 PM
        { days: [1, 5], hours: [9, 10, 11, 12], score: 75 },   // Mon,Fri 9-12
        { days: [0, 6], hours: [10, 11], score: 50 },          // Weekends 10-11
    ],
    instagram: [
        { days: [1, 2, 3, 4, 5], hours: [11, 12], score: 95 },  // Mon-Fri 11-12
        { days: [2, 3], hours: [11, 12, 13], score: 100 },       // Tue-Wed 11-1 PM
        { days: [1, 2, 3, 4, 5], hours: [7, 8], score: 70 },    // Weekday mornings (Stories)
        { days: [0, 6], hours: [10, 11, 12], score: 60 },        // Weekends
    ],
    tiktok: [
        { days: [2, 3, 4], hours: [14, 15, 16], score: 95 },    // Tue-Thu 2-4 PM
        { days: [5, 6], hours: [19, 20, 21, 22], score: 100 },   // Fri-Sat 7-10 PM
        { days: [1], hours: [14, 15], score: 70 },               // Mon 2-3 PM
        { days: [0], hours: [18, 19, 20], score: 75 },           // Sun evening
    ],
    x: [
        { days: [1, 2, 3, 4, 5], hours: [8, 9, 10, 11, 12, 13, 14, 15], score: 85 }, // Mon-Fri 8-3 PM
        { days: [3, 4], hours: [9, 10, 11], score: 100 },        // Wed-Thu 9-11 (B2B peak)
        { days: [0, 6], hours: [9, 10], score: 50 },             // Weekends lower
    ],
    linkedin: [
        { days: [2, 3, 4], hours: [7, 8], score: 100 },         // Tue-Thu 7-8 AM
        { days: [2, 3, 4], hours: [12], score: 95 },             // Tue-Thu noon
        { days: [2, 3, 4], hours: [17, 18], score: 90 },         // Tue-Thu 5-6 PM
        { days: [1, 5], hours: [8, 9, 12], score: 70 },          // Mon,Fri business
        { days: [0, 6], hours: [9, 10], score: 30 },             // Weekends very low
    ],
    youtube: [
        { days: [4, 5], hours: [14, 15, 16], score: 100 },      // Thu-Fri 2-4 PM
        { days: [0, 6], hours: [9, 10, 11], score: 85 },         // Weekend mornings
        { days: [1, 2, 3], hours: [14, 15], score: 70 },         // Weekday afternoons
    ],
    pinterest: [
        { days: [5, 6, 0], hours: [20, 21, 22], score: 100 },   // Fri-Sun 8-10 PM
        { days: [5, 6, 0], hours: [14, 15, 16], score: 80 },     // Fri-Sun afternoon
        { days: [1, 2, 3, 4], hours: [20, 21], score: 65 },      // Weekday evenings
    ],
}

// ─── Holiday Keywords ────────────────────────────────────────

const CONTENT_FRIENDLY_KEYWORDS = [
    'valentine', 'christmas', 'black friday', 'cyber monday', 'halloween',
    'new year', 'independence', 'mother', 'father', 'labor', 'memorial',
    'easter', 'diwali', 'lunar new', 'mid-autumn', 'singles day',
    'women', 'earth day', 'pride',
]

const FAMILY_KEYWORDS = [
    'thanksgiving', 'tết', 'eid', 'ramadan', 'yom kippur', 'good friday',
    'all saints', 'day of the dead',
]

function classifyHoliday(name: string): 'content-friendly' | 'family' | 'neutral' {
    const lower = name.toLowerCase()
    if (CONTENT_FRIENDLY_KEYWORDS.some(k => lower.includes(k))) return 'content-friendly'
    if (FAMILY_KEYWORDS.some(k => lower.includes(k))) return 'family'
    return 'neutral'
}

// ─── Timezone → Country mapping ──────────────────────────────

const TIMEZONE_COUNTRY: Record<string, string> = {
    'Asia/Ho_Chi_Minh': 'VN', 'Asia/Bangkok': 'TH', 'Asia/Tokyo': 'JP',
    'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN', 'Asia/Singapore': 'SG',
    'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH', 'Asia/Kolkata': 'IN',
    'Asia/Taipei': 'TW', 'Asia/Hong_Kong': 'HK',
    'America/New_York': 'US', 'America/Los_Angeles': 'US',
    'America/Chicago': 'US', 'America/Denver': 'US',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA',
    'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
    'America/Argentina/Buenos_Aires': 'AR',
    'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
    'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL',
    'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE',
    'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI',
    'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Vienna': 'AT',
    'Europe/Lisbon': 'PT', 'Europe/Athens': 'GR', 'Europe/Istanbul': 'TR',
    'Europe/Moscow': 'RU', 'Europe/Bucharest': 'RO',
    'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
    'Pacific/Auckland': 'NZ',
    'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG',
    'Africa/Cairo': 'EG', 'Africa/Nairobi': 'KE',
    'UTC': 'US',
}

// ─── Main handler ────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const platformsParam = searchParams.get('platforms')
    const countryOverride = searchParams.get('country') // optional ISO 3166 code

    if (!channelId || !from || !to) {
        return NextResponse.json({ error: 'channelId, from, and to are required' }, { status: 400 })
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)
    const platforms = platformsParam ? platformsParam.split(',') : Object.keys(PLATFORM_PEAKS)

    // ─── 1. Get channel info ─────────────────────────────────

    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: { timezone: true },
    })

    if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // ─── 2. Determine country for holidays ───────────────────

    const country = countryOverride
        || TIMEZONE_COUNTRY[channel.timezone]
        || 'US'

    // ─── 3. Get holidays for the date range ──────────────────

    const hd = new Holidays(country)
    const holidayMap: Record<string, { name: string; type: string; classification: string }> = {}

    // Iterate each day in range
    const current = new Date(fromDate)
    while (current <= toDate) {
        const dayHolidays = hd.isHoliday(current)
        if (dayHolidays && Array.isArray(dayHolidays)) {
            const dateStr = toDateStr(current)
            // Use the first public holiday found
            const pub = dayHolidays.find(h => h.type === 'public') || dayHolidays[0]
            if (pub) {
                holidayMap[dateStr] = {
                    name: pub.name,
                    type: pub.type,
                    classification: classifyHoliday(pub.name),
                }
            }
        }
        current.setDate(current.getDate() + 1)
    }

    // ─── 4. Analyze channel posting history ──────────────────

    const MIN_POSTS_REQUIRED = 20

    const pastPosts = await prisma.post.findMany({
        where: {
            channelId,
            status: 'PUBLISHED',
            publishedAt: { not: null },
        },
        select: { publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 200,
    })

    const publishedCount = pastPosts.length

    // If not enough data, return empty slots with informational message
    if (publishedCount < MIN_POSTS_REQUIRED) {
        return NextResponse.json({
            slots: [],
            holidays: Object.entries(holidayMap).map(([date, info]) => ({
                date,
                name: info.name,
                type: info.type,
                classification: info.classification,
            })),
            country,
            publishedCount,
            minRequired: MIN_POSTS_REQUIRED,
            message: `Need at least ${MIN_POSTS_REQUIRED} published posts to generate best times. Currently: ${publishedCount} posts.`,
        })
    }

    // Build histogram: dayOfWeek (0-6) × hour (0-23) → count
    const histogram: Record<string, number> = {}
    let maxCount = 1

    for (const post of pastPosts) {
        if (!post.publishedAt) continue
        const d = new Date(post.publishedAt)
        const key = `${d.getDay()}_${d.getHours()}`
        histogram[key] = (histogram[key] || 0) + 1
        if (histogram[key] > maxCount) maxCount = histogram[key]
    }

    // ─── 5. Get existing scheduled posts to avoid conflicts ──

    const scheduledPosts = await prisma.post.findMany({
        where: {
            channelId,
            status: 'SCHEDULED',
            scheduledAt: { gte: fromDate, lte: toDate },
        },
        select: { scheduledAt: true },
    })

    const scheduledHours = new Set<string>()
    for (const post of scheduledPosts) {
        if (post.scheduledAt) {
            const d = new Date(post.scheduledAt)
            scheduledHours.add(`${toDateStr(d)}_${d.getHours()}`)
        }
    }

    // ─── 6. Calculate scores for each slot ───────────────────
    // History-driven: 70% channel data, 30% platform peaks

    interface Slot {
        date: string
        time: string
        hour: number
        score: number
        platforms: string[]
        reason: string
        tier: 'best' | 'good' | 'fair'
    }

    const allSlots: Slot[] = []
    const candidate = new Date(fromDate)

    while (candidate <= toDate) {
        const dateStr = toDateStr(candidate)
        const dayOfWeek = candidate.getDay()

        // Only suggest slots between 7 AM and 22 PM
        for (let hour = 7; hour <= 21; hour++) {
            const slotKey = `${dateStr}_${hour}`

            // Skip if already has a scheduled post at this hour
            if (scheduledHours.has(slotKey)) continue

            // Calculate history score (primary signal — 70%)
            const histKey = `${dayOfWeek}_${hour}`
            const histCount = histogram[histKey] || 0
            const historyScore = Math.round((histCount / maxCount) * 100)

            // Skip slots with no history data at all
            if (historyScore === 0) continue

            // Calculate platform score (secondary signal — 30%)
            let bestPlatformScore = 0
            const matchedPlatforms: string[] = []
            const reasons: string[] = []

            for (const platform of platforms) {
                const peaks = PLATFORM_PEAKS[platform]
                if (!peaks) continue

                let platformScore = 0
                for (const peak of peaks) {
                    if (peak.days.includes(dayOfWeek) && peak.hours.includes(hour)) {
                        platformScore = Math.max(platformScore, peak.score)
                    }
                }

                if (platformScore > 0) {
                    matchedPlatforms.push(platform)
                    if (platformScore > bestPlatformScore) {
                        bestPlatformScore = platformScore
                    }
                }
            }

            // Combined score: 70% history, 30% platform
            let score = Math.round(historyScore * 0.7 + bestPlatformScore * 0.3)

            // Holiday adjustments
            const holiday = holidayMap[dateStr]
            if (holiday) {
                if (holiday.classification === 'content-friendly') {
                    score += 15
                    reasons.push(`${holiday.name} boost`)
                } else if (holiday.classification === 'family') {
                    score -= 10
                    reasons.push(`${holiday.name} — lower engagement`)
                }
            }

            // Bonus for empty days
            const dayHasScheduled = Array.from(scheduledHours).some(k => k.startsWith(dateStr))
            if (!dayHasScheduled && score > 0) {
                score += 10
            }

            score = Math.min(100, Math.max(0, score))

            // Only include slots with score >= 40
            if (score < 40) continue

            const tier: 'best' | 'good' | 'fair' =
                score >= 80 ? 'best' : score >= 60 ? 'good' : 'fair'

            const timeStr = `${String(hour).padStart(2, '0')}:00`

            // Build reason — emphasize data-driven nature
            let reason = `Based on ${publishedCount} posts`
            if (matchedPlatforms.length > 0) {
                const labels = matchedPlatforms.slice(0, 3).map(p => p.charAt(0).toUpperCase() + p.slice(1))
                reason += ` · Peak for ${labels.join(', ')}`
            }
            if (reasons.length > 0) {
                reason += ` (${reasons.join(', ')})`
            }

            allSlots.push({
                date: dateStr,
                time: timeStr,
                hour,
                score,
                platforms: matchedPlatforms.length > 0 ? matchedPlatforms : platforms,
                reason,
                tier,
            })
        }

        candidate.setDate(candidate.getDate() + 1)
    }

    // ─── 7. Pick top 2-3 slots per day ───────────────────────

    const slotsByDay: Record<string, Slot[]> = {}
    for (const slot of allSlots) {
        if (!slotsByDay[slot.date]) slotsByDay[slot.date] = []
        slotsByDay[slot.date].push(slot)
    }

    const finalSlots: Slot[] = []
    for (const day of Object.keys(slotsByDay).sort()) {
        const daySlots = slotsByDay[day]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3) // top 3 per day

        // Ensure minimum 2-hour gap between suggestions
        const selected: Slot[] = []
        for (const slot of daySlots) {
            if (selected.every(s => Math.abs(s.hour - slot.hour) >= 2)) {
                selected.push(slot)
            }
        }
        finalSlots.push(...selected)
    }

    // ─── 8. Return results ───────────────────────────────────

    return NextResponse.json({
        slots: finalSlots.map(({ hour, ...rest }) => rest),
        holidays: Object.entries(holidayMap).map(([date, info]) => ({
            date,
            name: info.name,
            type: info.type,
            classification: info.classification,
        })),
        country,
        publishedCount,
        minRequired: MIN_POSTS_REQUIRED,
        message: null,
    })
}

// ─── Helpers ─────────────────────────────────────────────────

function toDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
