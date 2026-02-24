'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { use } from 'react'
import {
    ArrowLeft,
    Save,
    Megaphone,
    Globe,
    Settings,
    BookOpen,
    FileText,
    Hash,
    Bell,
    Palette,
    Plus,
    Trash2,
    Link as LinkIcon,
    FileSpreadsheet,
    Type,
    ExternalLink,
    GripVertical,
    Sparkles,
    Loader2,
    Send,
    Zap,
    Download,
    Search,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
    Users,
    UserPlus,
    Shield,
    ChevronDown,
    ChevronUp,
    Check,
    Eye,
    EyeOff,
    X,
    Phone,
    MapPin,
    Globe as Globe2,
    Target,
    Lightbulb,
    Bot,
    MessageSquareDot,
    Pencil,
} from 'lucide-react'
import ChatBotTab from './ChatBotTab'
import GeneralTab from './GeneralTab'
import AiSetupTab from './AiSetupTab'
import PlatformsTab from './PlatformsTab'
import VibeTab from './VibeTab'
import KnowledgeTab from './KnowledgeTab'
import TemplatesTab from './TemplatesTab'
import HashtagsTab from './HashtagsTab'
import WebhooksTab from './WebhooksTab'
import MembersTab from './MembersTab'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// ─── Types ──────────────────────────────────────────
interface KnowledgeEntry {
    id: string
    title: string
    sourceType: string
    sourceUrl: string | null
    content: string
    createdAt: string
}

interface ContentTemplate {
    id: string
    name: string
    platform: string | null
    templateContent: string
    variables: string[]
    createdAt: string
}

interface HashtagGroup {
    id: string
    name: string
    hashtags: string[]
    usageCount: number
}

interface AiProviderInfo {
    id: string
    provider: string
    name: string
    status: string
    hasApiKey: boolean
}

interface AiModelInfo {
    id: string
    name: string
    type: string
    description?: string
}

interface ChannelPlatformEntry {
    id: string
    platform: string
    accountId: string
    accountName: string
    isActive: boolean
    config?: Record<string, unknown>
}

const platformIcons: Record<string, React.ReactNode> = {
    facebook: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
    ),
    instagram: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#E4405F"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" /></svg>
    ),
    youtube: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
    ),
    tiktok: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
    ),
    x: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    ),
    linkedin: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
    ),
    pinterest: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#E60023"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" /></svg>
    ),
    gbp: (
        <svg viewBox="0 0 64 64" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="30" width="48" height="28" rx="3" fill="#4285F4" />
            <path d="M8 44 L56 58 L56 30 L8 30Z" fill="#3367D6" opacity="0.4" />
            <path d="M4 20 Q32 14 60 20 L56 34 Q32 28 8 34Z" fill="#4285F4" />
            <path d="M4 20 Q12 17 20 20 L16 34 Q8 31 4 34Z" fill="#3367D6" />
            <path d="M20 20 Q28 17 36 20 L32 34 Q24 31 20 34Z" fill="#3367D6" />
            <path d="M36 20 Q44 17 52 20 L48 34 Q40 31 36 34Z" fill="#3367D6" />
            <path d="M52 20 Q56 18 60 20 L56 34 Q52 32 48 34Z" fill="#3367D6" />
            <ellipse cx="32" cy="34" rx="24" ry="4" fill="#3367D6" />
            <circle cx="44" cy="46" r="10" fill="white" />
            <path d="M49 46h-5.5v2.5h3.2c-0.3 1.5-1.6 2.5-3.2 2.5-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5c0.9 0 1.7 0.3 2.3 0.9l1.8-1.8C46.7 42.4 45.4 42 44 42c-3 0-5.5 2.5-5.5 5.5S41 53 44 53c3 0 5.5-2.5 5.5-5.5 0-0.3 0-0.6-0.5-1.5z" fill="#4285F4" />
        </svg>
    ),
    threads: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.56c-1.096-3.98-3.832-5.988-8.136-5.974h-.013c-2.806.02-4.929.926-6.31 2.694-1.296 1.66-1.974 4.074-2.013 7.169.039 3.094.717 5.508 2.014 7.168 1.382 1.77 3.505 2.674 6.31 2.694h.013c2.447-.017 4.33-.604 5.6-1.745 1.358-1.222 2.065-2.979 2.1-5.222l.008-.018c-.033-.632-.185-1.163-.452-1.578-.396-.615-.98-1.004-1.636-1.089-.508-.065-1.021.012-1.389.211-.182.098-.333.228-.424.396.182.32.321.676.414 1.065.14.587.147 1.266.02 1.916-.232 1.186-.899 2.183-1.881 2.81-.893.571-1.99.83-3.176.748-1.523-.105-2.862-.733-3.769-1.768-.823-.94-1.276-2.163-1.312-3.54-.036-1.392.353-2.647 1.126-3.636.87-1.113 2.193-1.82 3.829-2.046.776-.107 1.534-.113 2.249-.02-.022-1.123-.177-2.023-.489-2.755-.397-.932-1.05-1.461-1.941-1.574-.505-.064-1.037.02-1.449.23-.255.13-.471.312-.639.538l-1.596-1.297c.34-.417.77-.756 1.276-1.006.774-.384 1.655-.56 2.542-.51 1.48.084 2.652.72 3.482 1.89.764 1.076 1.162 2.522 1.182 4.298l.003.188c1.116.115 2.098.588 2.804 1.395.828.946 1.24 2.198 1.194 3.627-.037 2.656-.912 4.824-2.602 6.445-1.619 1.553-3.937 2.35-6.887 2.37zM9.206 14.633c.013.557.17 1.032.468 1.372.366.418.918.65 1.601.674.711.024 1.379-.135 1.876-.447.436-.273.74-.672.858-1.123.076-.294.087-.624.031-.954-.086-.51-.389-.91-.82-1.09-.314-.13-.72-.182-1.14-.145-1.235.108-2.469.65-2.874 1.713z" /></svg>
    ),
    bluesky: (
        <svg viewBox="0 0 600 530" className="w-4 h-4" fill="#0085ff" xmlns="http://www.w3.org/2000/svg">
            <path d="M135.72 44.03C202.216 93.951 273.74 195.17 300 249.49c26.262-54.316 97.782-155.54 164.28-205.46C512.26 8.009 590 -17.88 590 68.825c0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.19-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.38-3.69-10.832-3.708-7.896-.017-2.936-1.193.516-3.707 7.896-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.098-34.605-132.23 82.697-152.19-67.108 11.421-142.55-7.45-163.25-81.433C20.15 217.613 10 86.535 10 68.825c0-86.703 77.742-60.816 125.72-24.795z" />
        </svg>
    ),
}


const platformOptions = [
    { value: 'facebook', label: 'Facebook', color: '#1877F2' },
    { value: 'instagram', label: 'Instagram', color: '#E4405F' },
    { value: 'youtube', label: 'YouTube', color: '#FF0000' },
    { value: 'tiktok', label: 'TikTok', color: '#00F2EA' },
    { value: 'x', label: 'X / Twitter', color: '#000000' },
    { value: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
    { value: 'pinterest', label: 'Pinterest', color: '#E60023' },
    { value: 'gbp', label: 'Google Business', color: '#4285F4' },
    { value: 'threads', label: 'Threads', color: '#000000' },
    { value: 'bluesky', label: 'Bluesky', color: '#0085ff' },
]

interface ChannelDetail {
    id: string
    name: string
    displayName: string
    description: string | null
    isActive: boolean
    language: string
    descriptionsPerPlatform: Record<string, string>
    vibeTone: Record<string, string>
    seoTags: string[]
    colorPalette: string[]
    notificationEmail: string | null
    requireApproval: string  // 'none' | 'optional' | 'required'
    storageProvider: string | null
    useDefaultStorage: boolean
    webhookDiscord: Record<string, string>
    webhookTelegram: Record<string, string>
    webhookSlack: Record<string, string>
    webhookCustom: Record<string, string>
    knowledgeBase: KnowledgeEntry[]
    contentTemplates: ContentTemplate[]
    hashtagGroups: HashtagGroup[]
    _count: { posts: number; mediaItems: number }
    defaultAiProvider: string | null
    defaultAiModel: string | null
    defaultImageProvider: string | null
    defaultImageModel: string | null
    brandProfile: {
        targetAudience?: string
        contentTypes?: string
        brandValues?: string
        communicationStyle?: string
    } | null
    businessInfo: {
        phone?: string
        address?: string
        website?: string
        socials?: Record<string, string>
        custom?: { label: string; url: string }[]
    } | null
}

const sourceTypeIcons: Record<string, typeof Type> = {
    text: Type,
    url: LinkIcon,
    google_sheet: FileSpreadsheet,
    file: FileText,
}

const sourceTypeLabels: Record<string, string> = {
    text: 'Text',
    url: 'URL',
    google_sheet: 'Google Sheets',
    file: 'File',
}

// ─── Page ───────────────────────────────────────────
export default function ChannelDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const t = useTranslation()
    const router = useRouter()
    const { data: session } = useSession()
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER'
    const isAdminOrManager = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER' || session?.user?.role === 'MANAGER'
    const [channel, setChannel] = useState<ChannelDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
    const isInitialLoad = useRef(true)
    const [analyzing, setAnalyzing] = useState(false)
    const [activeTab, setActiveTab] = useState('general')

    // Editable fields
    const [displayName, setDisplayName] = useState('')
    const [description, setDescription] = useState('')
    const [language, setLanguage] = useState('en')
    const [timezone, setTimezone] = useState('UTC')
    const [isActive, setIsActive] = useState(true)
    const [notificationEmail, setNotificationEmail] = useState('')
    const [requireApproval, setRequireApproval] = useState<'none' | 'optional' | 'required'>('none')
    const [vibeTone, setVibeTone] = useState<Record<string, string>>({})

    // Knowledge Base state
    const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([])
    const [newKbTitle, setNewKbTitle] = useState('')
    const [newKbType, setNewKbType] = useState('text')
    const [newKbUrl, setNewKbUrl] = useState('')
    const [newKbContent, setNewKbContent] = useState('')
    const [addingKb, setAddingKb] = useState(false)

    // Content Templates state
    const [templates, setTemplates] = useState<ContentTemplate[]>([])
    const [newTplName, setNewTplName] = useState('')
    const [newTplContent, setNewTplContent] = useState('')
    const [addingTpl, setAddingTpl] = useState(false)

    // Hashtag Groups state
    const [hashtags, setHashtags] = useState<HashtagGroup[]>([])
    const [newHashName, setNewHashName] = useState('')
    const [newHashTags, setNewHashTags] = useState('')
    const [addingHash, setAddingHash] = useState(false)

    // AI provider/model
    const [aiProvider, setAiProvider] = useState('')
    const [aiModel, setAiModel] = useState('')
    const [imageProvider, setImageProvider] = useState('')
    const [imageModel, setImageModel] = useState('')
    const [requireOwnApiKey, setRequireOwnApiKey] = useState(false)
    const [generatingDesc, setGeneratingDesc] = useState(false)
    const [generatingVibe, setGeneratingVibe] = useState(false)
    const [availableProviders, setAvailableProviders] = useState<AiProviderInfo[]>([])
    const [availableModels, setAvailableModels] = useState<AiModelInfo[]>([])
    const [availableImageModels, setAvailableImageModels] = useState<AiModelInfo[]>([])
    const [loadingModels, setLoadingModels] = useState(false)
    const [loadingImageModels, setLoadingImageModels] = useState(false)
    const [userConfiguredProviders, setUserConfiguredProviders] = useState<string[]>([])

    // Webhook state
    const [webhookDiscordUrl, setWebhookDiscordUrl] = useState('')
    const [webhookTelegramToken, setWebhookTelegramToken] = useState('')
    const [webhookTelegramChatId, setWebhookTelegramChatId] = useState('')
    const [webhookSlackUrl, setWebhookSlackUrl] = useState('')
    const [webhookCustomUrl, setWebhookCustomUrl] = useState('')
    const [webhookZaloAppId, setWebhookZaloAppId] = useState('')
    const [webhookZaloSecretKey, setWebhookZaloSecretKey] = useState('')
    const [webhookZaloRefreshToken, setWebhookZaloRefreshToken] = useState('')
    const [webhookZaloUserId, setWebhookZaloUserId] = useState('')
    const [testingWebhook, setTestingWebhook] = useState<string | null>(null)

    // Business Info state
    const [bizPhone, setBizPhone] = useState('')
    const [bizAddress, setBizAddress] = useState('')
    const [bizWebsite, setBizWebsite] = useState('')
    const [bizSocials, setBizSocials] = useState<Record<string, string>>({})
    const [bizCustomLinks, setBizCustomLinks] = useState<{ label: string; url: string }[]>([])

    // Brand Profile state
    const [brandTargetAudience, setBrandTargetAudience] = useState('')
    const [brandContentTypes, setBrandContentTypes] = useState('')
    const [brandValues, setBrandValues] = useState('')
    const [brandCommStyle, setBrandCommStyle] = useState('')

    // Platform state
    const [platforms, setPlatforms] = useState<ChannelPlatformEntry[]>([])
    const [addingPlatform, setAddingPlatform] = useState(false)
    const [newPlatform, setNewPlatform] = useState('')
    const [newPlatformAccountId, setNewPlatformAccountId] = useState('')
    const [newPlatformAccountName, setNewPlatformAccountName] = useState('')
    const [savingPlatform, setSavingPlatform] = useState(false)

    const [platformSearch, setPlatformSearch] = useState('')
    const [hideDisabled, setHideDisabled] = useState(false)
    const [showBlueskyForm, setShowBlueskyForm] = useState(false)
    const [blueskyHandle, setBlueskyHandle] = useState('')
    const [blueskyAppPassword, setBlueskyAppPassword] = useState('')
    const [blueskyConnecting, setBlueskyConnecting] = useState(false)
    const [showXForm, setShowXForm] = useState(false)
    const [xApiKey, setXApiKey] = useState('')
    const [xApiKeySecret, setXApiKeySecret] = useState('')
    const [xAccessToken, setXAccessToken] = useState('')
    const [xAccessTokenSecret, setXAccessTokenSecret] = useState('')
    const [xConnecting, setXConnecting] = useState(false)

    // EasyConnect state
    interface EasyLink { id: string; title: string; token: string; isEnabled: boolean; expiresAt?: string | null; createdAt: string }
    const [easyLinks, setEasyLinks] = useState<EasyLink[]>([])
    const [easyLinksLoading, setEasyLinksLoading] = useState(false)
    const [showCreateLink, setShowCreateLink] = useState(false)
    const [newLinkTitle, setNewLinkTitle] = useState('')
    const [newLinkPassword, setNewLinkPassword] = useState('')
    const [creatingLink, setCreatingLink] = useState(false)
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
    const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
    const [editingLinkTitle, setEditingLinkTitle] = useState('')
    const [easyLinksLoaded, setEasyLinksLoaded] = useState(false)

    const loadEasyLinks = async () => {
        if (!id) return
        setEasyLinksLoading(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/easy-connect`)
            if (res.ok) setEasyLinks(await res.json())
        } finally { setEasyLinksLoading(false); setEasyLinksLoaded(true) }
    }

    // Auto-load links when platforms tab is active
    useEffect(() => {
        if (activeTab === 'platforms' && !easyLinksLoaded && id) {
            loadEasyLinks()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, id])

    const createEasyLink = async () => {
        if (!newLinkTitle.trim()) return
        setCreatingLink(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/easy-connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newLinkTitle, password: newLinkPassword || undefined }),
            })
            if (res.ok) {
                const link = await res.json()
                setEasyLinks(prev => [link, ...prev])
                setShowCreateLink(false)
                setNewLinkTitle('')
                setNewLinkPassword('')
                toast.success('EasyConnect link created!')
            }
        } finally { setCreatingLink(false) }
    }

    const toggleEasyLink = async (linkId: string, isEnabled: boolean) => {
        await fetch(`/api/admin/channels/${id}/easy-connect/${linkId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isEnabled }),
        })
        setEasyLinks(prev => prev.map(l => l.id === linkId ? { ...l, isEnabled } : l))
    }

    const renameEasyLink = async (linkId: string) => {
        if (!editingLinkTitle.trim()) { setEditingLinkId(null); return }
        await fetch(`/api/admin/channels/${id}/easy-connect/${linkId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: editingLinkTitle.trim() }),
        })
        setEasyLinks(prev => prev.map(l => l.id === linkId ? { ...l, title: editingLinkTitle.trim() } : l))
        setEditingLinkId(null)
        toast.success('Link renamed')
    }

    const deleteEasyLink = async (linkId: string) => {
        if (!confirm('Delete this EasyConnect link? Clients will no longer be able to use it.')) return
        await fetch(`/api/admin/channels/${id}/easy-connect/${linkId}`, { method: 'DELETE' })
        setEasyLinks(prev => prev.filter(l => l.id !== linkId))
        toast.success('Link deleted')
    }

    const copyEasyLink = (token: string, linkId: string) => {
        const url = `${window.location.origin}/connect/${token}`
        navigator.clipboard.writeText(url)
        setCopiedLinkId(linkId)
        setTimeout(() => setCopiedLinkId(null), 2000)
    }

    // Members state
    const [members, setMembers] = useState<any[]>([])
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [addingMember, setAddingMember] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState('')
    const [selectedRole, setSelectedRole] = useState('MANAGER')
    const [expandedMember, setExpandedMember] = useState<string | null>(null)
    const [savingPermissions, setSavingPermissions] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [sendingInvite, setSendingInvite] = useState(false)

    const fetchChannel = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/channels/${id}`)
            if (res.ok) {
                const data = await res.json()
                setChannel(data)
                setDisplayName(data.displayName)
                setDescription(data.description || '')
                setLanguage(data.language)
                setTimezone(data.timezone || 'UTC')
                setIsActive(data.isActive)
                setNotificationEmail(data.notificationEmail || '')
                setRequireApproval((data.requireApproval as 'none' | 'optional' | 'required') || 'none')
                setVibeTone(data.vibeTone || {})
                setKnowledgeEntries(data.knowledgeBase || [])
                setTemplates(data.contentTemplates || [])
                setHashtags(data.hashtagGroups || [])
                // AI defaults
                setAiProvider(data.defaultAiProvider || '')
                setAiModel(data.defaultAiModel || '')
                setImageProvider(data.defaultImageProvider || '')
                setImageModel(data.defaultImageModel || '')
                setRequireOwnApiKey(data.requireOwnApiKey ?? false)
                // Webhooks
                setWebhookDiscordUrl(data.webhookDiscord?.url || '')
                setWebhookTelegramToken(data.webhookTelegram?.botToken || '')
                setWebhookTelegramChatId(data.webhookTelegram?.chatId || '')
                setWebhookSlackUrl(data.webhookSlack?.url || '')
                setWebhookZaloAppId(data.webhookZalo?.appId || '')
                setWebhookZaloSecretKey(data.webhookZalo?.secretKey || '')
                setWebhookZaloRefreshToken(data.webhookZalo?.refreshToken || '')
                setWebhookZaloUserId(data.webhookZalo?.userId || '')
                setWebhookCustomUrl(data.webhookCustom?.url || '')
                // Business Info
                const biz = data.businessInfo || {}
                setBizPhone(biz.phone || '')
                setBizAddress(biz.address || '')
                setBizWebsite(biz.website || '')
                setBizSocials(biz.socials || {})
                setBizCustomLinks(biz.custom || [])
                // Brand Profile
                const bp = data.brandProfile || {}
                setBrandTargetAudience(bp.targetAudience || '')
                setBrandContentTypes(bp.contentTypes || '')
                setBrandValues(bp.brandValues || '')
                setBrandCommStyle(bp.communicationStyle || '')
            } else {
                toast.error(t('channels.notFound'))
                router.push('/dashboard/channels')
            }
        } catch {
            toast.error(t('channels.loadFailed'))
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        fetchChannel()
        // Fetch platforms
        fetch(`/api/admin/channels/${id}/platforms`)
            .then(r => r.ok ? r.json() : [])
            .then(data => setPlatforms(data))
            .catch(() => { })
        // Fetch members
        fetch(`/api/admin/channels/${id}/members`)
            .then(r => r.ok ? r.json() : [])
            .then(data => setMembers(data))
            .catch(() => { })
    }, [fetchChannel, id])

    // Handle OAuth redirect success
    const searchParams = useSearchParams()
    useEffect(() => {
        const oauthPlatform = searchParams.get('oauth')
        const imported = searchParams.get('imported')
        const oauthError = searchParams.get('error')
        const tab = searchParams.get('tab')

        if (tab === 'platforms') {
            setActiveTab('platforms')
        }

        if (oauthPlatform && imported) {
            const name = oauthPlatform.charAt(0).toUpperCase() + oauthPlatform.slice(1)
            toast.success(`${name} connected! ${imported} account(s) imported.`)
            // Refresh platform list
            fetch(`/api/admin/channels/${id}/platforms`)
                .then(r => r.ok ? r.json() : [])
                .then(data => setPlatforms(data))
                .catch(() => { })
            // Clean URL params
            router.replace(`/dashboard/channels/${id}`, { scroll: false })
        } else if (oauthError) {
            toast.error(`OAuth error: ${oauthError}`)
            router.replace(`/dashboard/channels/${id}`, { scroll: false })
        }
    }, [searchParams, id, router])

    // Fetch AI providers from API Hub + user's configured keys
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const res = await fetch('/api/user/ai-providers')
                if (res.ok) {
                    const data = await res.json()
                    setAvailableProviders(data)
                }
            } catch { /* silently ignore */ }
        }
        const fetchUserKeys = async () => {
            try {
                const res = await fetch('/api/user/api-keys')
                if (res.ok) {
                    const data = await res.json()
                    setUserConfiguredProviders(data.map((k: { provider: string }) => k.provider))
                }
            } catch { /* silently ignore */ }
        }
        fetchProviders()
        fetchUserKeys()
    }, [])

    // Fetch models when provider changes — uses user's key
    useEffect(() => {
        if (!aiProvider) {
            setAvailableModels([])
            return
        }
        // Only fetch models if user has this provider configured
        if (!userConfiguredProviders.includes(aiProvider)) {
            setAvailableModels([])
            return
        }

        const fetchModels = async () => {
            setLoadingModels(true)
            try {
                const res = await fetch('/api/user/api-keys/models', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider: aiProvider }),
                })
                if (res.ok) {
                    const data = await res.json()
                    // Filter to text models only for content generation
                    setAvailableModels(
                        (data.models || []).filter((m: AiModelInfo) => m.type === 'text')
                    )
                }
            } catch { /* silently ignore */ }
            setLoadingModels(false)
        }
        fetchModels()
    }, [aiProvider, userConfiguredProviders])

    // Fetch image models when image provider changes
    useEffect(() => {
        if (!imageProvider) {
            setAvailableImageModels([])
            return
        }
        if (!userConfiguredProviders.includes(imageProvider)) {
            setAvailableImageModels([])
            return
        }
        const fetchImageModels = async () => {
            setLoadingImageModels(true)
            try {
                const res = await fetch('/api/user/api-keys/models', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider: imageProvider }),
                })
                if (res.ok) {
                    const data = await res.json()
                    setAvailableImageModels(
                        (data.models || []).filter((m: AiModelInfo) => m.type === 'image')
                    )
                }
            } catch { /* silently ignore */ }
            setLoadingImageModels(false)
        }
        fetchImageModels()
    }, [imageProvider, userConfiguredProviders])

    // ─── Save General Settings ──────────────────────
    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName,
                    description: description || null,
                    language,
                    timezone,
                    isActive,
                    notificationEmail: notificationEmail || null,
                    requireApproval,
                    vibeTone,
                    defaultAiProvider: aiProvider || null,
                    defaultAiModel: aiModel || null,
                    defaultImageProvider: imageProvider || null,
                    defaultImageModel: imageModel || null,

                    ...(isAdmin ? { requireOwnApiKey } : {}),
                    webhookDiscord: webhookDiscordUrl ? { url: webhookDiscordUrl } : {},
                    webhookTelegram: webhookTelegramToken ? { botToken: webhookTelegramToken, chatId: webhookTelegramChatId } : {},
                    webhookSlack: webhookSlackUrl ? { url: webhookSlackUrl } : {},
                    webhookZalo: webhookZaloRefreshToken ? { appId: webhookZaloAppId, secretKey: webhookZaloSecretKey, refreshToken: webhookZaloRefreshToken, userId: webhookZaloUserId } : {},
                    webhookCustom: webhookCustomUrl ? { url: webhookCustomUrl } : {},
                    brandProfile: {
                        targetAudience: brandTargetAudience || undefined,
                        contentTypes: brandContentTypes || undefined,
                        brandValues: brandValues || undefined,
                        communicationStyle: brandCommStyle || undefined,
                    },
                    businessInfo: {
                        phone: bizPhone || undefined,
                        address: bizAddress || undefined,
                        website: bizWebsite || undefined,
                        socials: Object.keys(bizSocials).length > 0 ? bizSocials : undefined,
                        custom: bizCustomLinks.length > 0 ? bizCustomLinks : undefined,
                    },
                }),
            })
            if (res.ok) {
                toast.success(t('channels.saved'))
                fetchChannel()
            } else {
                toast.error(t('channels.saveFailed'))
            }
        } catch {
            toast.error(t('channels.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    // ─── Auto-save (debounced 2s) ────────────────────────
    const autoSave = useCallback(async () => {
        if (!channel) return
        setAutoSaveStatus('saving')
        try {
            const res = await fetch(`/api/admin/channels/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName,
                    description: description || null,
                    language,
                    timezone,
                    isActive,
                    notificationEmail: notificationEmail || null,
                    requireApproval,
                    vibeTone,
                    defaultAiProvider: aiProvider || null,
                    defaultAiModel: aiModel || null,
                    defaultImageProvider: imageProvider || null,
                    defaultImageModel: imageModel || null,
                    ...(isAdmin ? { requireOwnApiKey } : {}),
                    brandProfile: {
                        targetAudience: brandTargetAudience || undefined,
                        contentTypes: brandContentTypes || undefined,
                        brandValues: brandValues || undefined,
                        communicationStyle: brandCommStyle || undefined,
                    },
                    businessInfo: {
                        phone: bizPhone || undefined,
                        address: bizAddress || undefined,
                        website: bizWebsite || undefined,
                        socials: Object.keys(bizSocials).length > 0 ? bizSocials : undefined,
                        custom: bizCustomLinks.length > 0 ? bizCustomLinks : undefined,
                    },
                }),
            })
            if (res.ok) {
                setAutoSaveStatus('saved')
                setTimeout(() => setAutoSaveStatus('idle'), 3000)
            } else {
                setAutoSaveStatus('idle')
            }
        } catch {
            setAutoSaveStatus('idle')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channel, id, displayName, description, language, timezone, isActive, notificationEmail, requireApproval, vibeTone, aiProvider, aiModel, isAdmin, requireOwnApiKey, bizPhone, bizAddress, bizWebsite, bizSocials, bizCustomLinks, brandTargetAudience, brandContentTypes, brandValues, brandCommStyle])

    useEffect(() => {
        // Skip auto-save on initial load
        if (isInitialLoad.current) {
            if (channel) isInitialLoad.current = false
            return
        }
        if (!channel) return

        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
        autoSaveTimer.current = setTimeout(() => {
            autoSave()
        }, 2000)

        return () => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayName, description, language, isActive, notificationEmail, requireApproval, vibeTone, aiProvider, aiModel, requireOwnApiKey, bizPhone, bizAddress, bizWebsite, bizSocials, bizCustomLinks, brandTargetAudience, brandContentTypes, brandValues, brandCommStyle])

    // ─── AI Analysis ────────────────────────────────
    const handleAnalyze = async () => {
        if (!displayName || !description) {
            toast.error(t('channels.ai.needDescription'))
            return
        }
        setAnalyzing(true)
        toast.info(t('channels.ai.started'))

        try {
            // First save description
            await fetch(`/api/admin/channels/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description }),
            })

            // Call AI analysis
            const res = await fetch(`/api/admin/channels/${id}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelName: displayName,
                    description,
                    language,
                    targetAudience: brandTargetAudience || undefined,
                    contentTypes: brandContentTypes || undefined,
                    brandValues: brandValues || undefined,
                    communicationStyle: brandCommStyle || undefined,
                    provider: aiProvider || undefined,
                    model: aiModel || undefined,
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || t('channels.ai.failed'))
            }

            const analysis = await res.json()

            // Apply Vibe & Tone
            if (analysis.vibeTone) {
                setVibeTone(analysis.vibeTone)
                await fetch(`/api/admin/channels/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vibeTone: analysis.vibeTone }),
                })
            }

            // Create Knowledge Base entries
            if (analysis.knowledgeBase?.length) {
                for (const entry of analysis.knowledgeBase) {
                    await fetch(`/api/admin/channels/${id}/knowledge`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: entry.title,
                            sourceType: 'text',
                            content: entry.content,
                        }),
                    })
                }
            }

            // Create Content Templates
            if (analysis.contentTemplates?.length) {
                for (const tpl of analysis.contentTemplates) {
                    await fetch(`/api/admin/channels/${id}/templates`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: tpl.name,
                            templateContent: tpl.templateContent,
                        }),
                    })
                }
            }

            // Create Hashtag Groups
            if (analysis.hashtagGroups?.length) {
                for (const group of analysis.hashtagGroups) {
                    await fetch(`/api/admin/channels/${id}/hashtags`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: group.name,
                            hashtags: group.hashtags,
                        }),
                    })
                }
            }

            // Refresh all data
            await fetchChannel()
            toast.success(t('channels.ai.complete'))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('channels.ai.failed'))
        } finally {
            setAnalyzing(false)
        }
    }

    // ─── Knowledge Base CRUD ────────────────────────
    const addKbEntry = async () => {
        if (!newKbTitle) return
        setAddingKb(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/knowledge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newKbTitle,
                    sourceType: newKbType,
                    sourceUrl: newKbUrl || null,
                    content: newKbContent,
                }),
            })
            if (res.ok) {
                const entry = await res.json()
                setKnowledgeEntries([entry, ...knowledgeEntries])
                setNewKbTitle('')
                setNewKbType('text')
                setNewKbUrl('')
                setNewKbContent('')
                toast.success(t('channels.knowledge.added'))
            }
        } catch {
            toast.error(t('channels.knowledge.addFailed'))
        } finally {
            setAddingKb(false)
        }
    }

    const deleteKbEntry = async (entryId: string) => {
        try {
            await fetch(`/api/admin/channels/${id}/knowledge?entryId=${entryId}`, { method: 'DELETE' })
            setKnowledgeEntries(knowledgeEntries.filter((e) => e.id !== entryId))
            toast.success(t('channels.knowledge.deleted'))
        } catch {
            toast.error(t('channels.knowledge.deleteFailed'))
        }
    }

    // ─── Content Templates CRUD ─────────────────────
    const addTemplate = async () => {
        if (!newTplName || !newTplContent) return
        setAddingTpl(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newTplName,
                    templateContent: newTplContent,
                }),
            })
            if (res.ok) {
                const tpl = await res.json()
                setTemplates([tpl, ...templates])
                setNewTplName('')
                setNewTplContent('')
                toast.success(t('channels.templates.added'))
            }
        } catch {
            toast.error(t('channels.templates.addFailed'))
        } finally {
            setAddingTpl(false)
        }
    }

    const deleteTemplate = async (templateId: string) => {
        try {
            await fetch(`/api/admin/channels/${id}/templates?templateId=${templateId}`, { method: 'DELETE' })
            setTemplates(templates.filter((t) => t.id !== templateId))
            toast.success(t('channels.templates.deleted'))
        } catch {
            toast.error(t('channels.templates.deleteFailed'))
        }
    }

    // ─── Hashtag Groups CRUD ────────────────────────
    const addHashtagGroup = async () => {
        if (!newHashName) return
        setAddingHash(true)
        try {
            const tags = newHashTags.split(/[,\n]/).map((t) => t.trim()).filter(Boolean)
            const res = await fetch(`/api/admin/channels/${id}/hashtags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newHashName, hashtags: tags }),
            })
            if (res.ok) {
                const group = await res.json()
                setHashtags([...hashtags, group])
                setNewHashName('')
                setNewHashTags('')
                toast.success(t('channels.hashtags.added'))
            }
        } catch {
            toast.error(t('channels.hashtags.addFailed'))
        } finally {
            setAddingHash(false)
        }
    }

    const deleteHashtagGroup = async (groupId: string) => {
        try {
            await fetch(`/api/admin/channels/${id}/hashtags?groupId=${groupId}`, { method: 'DELETE' })
            setHashtags(hashtags.filter((h) => h.id !== groupId))
            toast.success(t('channels.hashtags.deleted'))
        } catch {
            toast.error(t('channels.hashtags.deleteFailed'))
        }
    }

    // ─── Generate SEO Description ────────────────────
    const handleGenerateDescription = async () => {
        if (!displayName || !description) {
            toast.error(t('channels.ai.needDescription'))
            return
        }
        setGeneratingDesc(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/generate-description`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelName: displayName,
                    shortDescription: description,
                    language,
                    targetAudience: brandTargetAudience || undefined,
                    contentTypes: brandContentTypes || undefined,
                    brandValues: brandValues || undefined,
                    communicationStyle: brandCommStyle || undefined,
                    provider: aiProvider || undefined,
                    model: aiModel || undefined,
                }),
            })
            if (res.ok) {
                const data = await res.json()
                setDescription(data.description)
                toast.success(t('channels.ai.descGenerated'))
            } else {
                const err = await res.json()
                toast.error(err.error || t('channels.ai.descFailed'))
            }
        } catch {
            toast.error(t('channels.ai.descFailed'))
        } finally {
            setGeneratingDesc(false)
        }
    }

    // ─── Generate Vibe & Tone ───────────────────────
    const handleGenerateVibe = async () => {
        if (!displayName || !description) {
            toast.error(t('channels.ai.needDescription'))
            return
        }
        setGeneratingVibe(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/generate-vibe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelName: displayName,
                    description,
                    language,
                    provider: aiProvider || undefined,
                    model: aiModel || undefined,
                }),
            })
            if (res.ok) {
                const data = await res.json()
                if (data.vibeTone) {
                    setVibeTone(data.vibeTone)
                    toast.success(t('channels.vibe.vibeGenerated'))
                }
            } else {
                const err = await res.json()
                toast.error(err.error || t('channels.vibe.vibeFailed'))
            }
        } catch {
            toast.error(t('channels.vibe.vibeFailed'))
        } finally {
            setGeneratingVibe(false)
        }
    }

    // ─── Webhook Test ────────────────────────────────
    const handleWebhookTest = async (platform: string) => {
        setTestingWebhook(platform)
        try {
            const payload: Record<string, string> = { platform }
            if (platform === 'discord') payload.url = webhookDiscordUrl
            if (platform === 'telegram') {
                payload.botToken = webhookTelegramToken
                payload.chatId = webhookTelegramChatId
            }
            if (platform === 'slack') payload.url = webhookSlackUrl
            if (platform === 'zalo') {
                payload.appId = webhookZaloAppId
                payload.secretKey = webhookZaloSecretKey
                payload.refreshToken = webhookZaloRefreshToken
                payload.userId = webhookZaloUserId
            }
            if (platform === 'custom') payload.url = webhookCustomUrl

            const res = await fetch(`/api/admin/channels/${id}/webhook-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(t('channels.webhooks.testSuccess'))
            } else {
                toast.error(data.message || t('channels.webhooks.testFailed'))
            }
        } catch {
            toast.error(t('channels.webhooks.testFailed'))
        } finally {
            setTestingWebhook(null)
        }
    }

    // ─── Platform CRUD ───────────────────────────────
    const addPlatformConnection = async () => {
        if (!newPlatform || !newPlatformAccountId || !newPlatformAccountName) return
        setSavingPlatform(true)
        try {
            const res = await fetch(`/api/admin/channels/${id}/platforms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: newPlatform,
                    accountId: newPlatformAccountId,
                    accountName: newPlatformAccountName,
                }),
            })
            if (res.ok) {
                const entry = await res.json()
                setPlatforms([...platforms, entry])
                setNewPlatform('')
                setNewPlatformAccountId('')
                setNewPlatformAccountName('')
                setAddingPlatform(false)
                toast.success(t('channels.platforms.connected'))
            } else {
                const err = await res.json()
                toast.error(err.error || t('channels.platforms.connectFailed'))
            }
        } catch {
            toast.error(t('channels.platforms.connectFailed'))
        } finally {
            setSavingPlatform(false)
        }
    }

    const togglePlatformActive = async (platformId: string, isActive: boolean) => {
        try {
            await fetch(`/api/admin/channels/${id}/platforms`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platformId, isActive }),
            })
            setPlatforms(platforms.map(p => p.id === platformId ? { ...p, isActive } : p))
        } catch {
            toast.error(t('channels.platforms.connectFailed'))
        }
    }

    const deletePlatformConnection = async (platformId: string) => {
        try {
            await fetch(`/api/admin/channels/${id}/platforms?platformId=${platformId}`, { method: 'DELETE' })
            setPlatforms(platforms.filter(p => p.id !== platformId))
            toast.success(t('channels.platforms.disconnected'))
        } catch {
            toast.error(t('channels.platforms.disconnectFailed'))
        }
    }


    // Toggle all platforms active/inactive
    const toggleAllPlatforms = async (active: boolean) => {
        const toToggle = platforms.filter(p => p.isActive !== active)
        if (toToggle.length === 0) return
        // Fire all API calls in parallel
        await Promise.all(
            toToggle.map(p =>
                fetch(`/api/admin/channels/${id}/platforms`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ platformId: p.id, isActive: active }),
                })
            )
        )
        // Update state once
        setPlatforms(prev => prev.map(p => ({ ...p, isActive: active })))
    }

    // ─── Loading state ──────────────────────────────
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
                <div className="h-[400px] bg-muted rounded-xl animate-pulse"></div>
            </div>
        )
    }

    if (!channel) return null

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/channels')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                            <Megaphone className="h-5 w-5" />
                            {channel.displayName}
                        </h1>
                        <p className="text-xs text-muted-foreground font-mono">/{channel.name}</p>
                    </div>
                    <Badge variant={channel.isActive ? 'default' : 'secondary'}>
                        {channel.isActive ? t('channels.active') : t('channels.inactive')}
                    </Badge>
                </div>
                <div className="flex items-center gap-3">
                    {autoSaveStatus === 'saving' && (
                        <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
                    )}
                    {autoSaveStatus === 'saved' && (
                        <span className="text-xs text-green-500">Auto-saved ✓</span>
                    )}
                    <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
                        <Save className="h-4 w-4" />
                        {saving ? t('common.saving') : t('common.save')}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="w-full flex-wrap h-auto gap-1 justify-start">
                    <TabsTrigger value="general" className="gap-1.5 text-xs">
                        <Settings className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">{t('channels.tabs.general')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="gap-1.5 text-xs">
                        <Bot className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">AI Setup</span>
                    </TabsTrigger>
                    <TabsTrigger value="chatbot" className="gap-1.5 text-xs">
                        <MessageSquareDot className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Chat Bot</span>
                    </TabsTrigger>
                    <TabsTrigger value="platforms" className="gap-1.5 text-xs">
                        <Globe className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">{t('channels.tabs.platforms')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="vibe" className="gap-1.5 text-xs">
                        <Palette className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">{t('channels.tabs.vibe')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="knowledge" className="gap-1.5 text-xs">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">{t('channels.tabs.knowledge')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-1.5 text-xs">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">{t('channels.tabs.templates')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="hashtags" className="gap-1.5 text-xs">
                        <Hash className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">{t('channels.tabs.hashtags')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="webhooks" className="gap-1.5 text-xs">
                        <Bell className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">{t('channels.tabs.webhooks')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="members" className="gap-1.5 text-xs">
                        <Users className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">{t('channels.tabs.members')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="gap-1.5 text-xs">
                        <UserPlus className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Customers</span>
                    </TabsTrigger>
                </TabsList>

                {/* ─── General Tab ─── */}
                <TabsContent value="general" className="space-y-4">
                    <GeneralTab
                        channelId={id}
                        displayName={displayName}
                        setDisplayName={setDisplayName}
                        description={description}
                        setDescription={setDescription}
                        language={language}
                        setLanguage={setLanguage}
                        timezone={timezone}
                        setTimezone={setTimezone}
                        isActive={isActive}
                        setIsActive={setIsActive}
                        notificationEmail={notificationEmail}
                        setNotificationEmail={setNotificationEmail}
                        requireApproval={requireApproval}
                        setRequireApproval={setRequireApproval}
                        brandTargetAudience={brandTargetAudience}
                        setBrandTargetAudience={setBrandTargetAudience}
                        brandContentTypes={brandContentTypes}
                        setBrandContentTypes={setBrandContentTypes}
                        brandValues={brandValues}
                        setBrandValues={setBrandValues}
                        brandCommStyle={brandCommStyle}
                        setBrandCommStyle={setBrandCommStyle}
                        bizPhone={bizPhone}
                        setBizPhone={setBizPhone}
                        bizAddress={bizAddress}
                        setBizAddress={setBizAddress}
                        bizWebsite={bizWebsite}
                        setBizWebsite={setBizWebsite}
                        bizSocials={bizSocials}
                        setBizSocials={setBizSocials}
                        bizCustomLinks={bizCustomLinks}
                        setBizCustomLinks={setBizCustomLinks}
                        analyzing={analyzing}
                        handleAnalyze={handleAnalyze}
                        generatingDesc={generatingDesc}
                        handleGenerateDescription={handleGenerateDescription}
                        isAdmin={isAdmin}
                        requireOwnApiKey={requireOwnApiKey}
                        setRequireOwnApiKey={setRequireOwnApiKey}
                        aiProvider={aiProvider}
                        aiModel={aiModel}
                    />
                </TabsContent>

                {/* ─── AI Setup Tab ─── */}
                <TabsContent value="ai" className="space-y-4">
                    <AiSetupTab
                        aiProvider={aiProvider}
                        setAiProvider={setAiProvider}
                        aiModel={aiModel}
                        setAiModel={setAiModel}
                        imageProvider={imageProvider}
                        setImageProvider={setImageProvider}
                        imageModel={imageModel}
                        setImageModel={setImageModel}
                        availableProviders={availableProviders}
                        availableModels={availableModels}
                        availableImageModels={availableImageModels}
                        loadingModels={loadingModels}
                        loadingImageModels={loadingImageModels}
                        userConfiguredProviders={userConfiguredProviders}
                    />
                </TabsContent>

                {/* ─── Platforms Tab ─── */}
                <TabsContent value="platforms" className="space-y-4">
                    <PlatformsTab
                        channelId={id}
                        platforms={platforms}
                        setPlatforms={setPlatforms}
                        isAdmin={isAdmin}
                        activeTab={activeTab}
                    />
                </TabsContent>

                {/* ─── Vibe & Tone Tab ─── */}
                <TabsContent value="vibe" className="space-y-4">
                    <VibeTab
                        vibeTone={vibeTone}
                        setVibeTone={setVibeTone}
                        generatingVibe={generatingVibe}
                        handleGenerateVibe={handleGenerateVibe}
                        description={description}
                    />
                </TabsContent>

                {/* ─── Knowledge Base Tab ─── */}
                <TabsContent value="knowledge" className="space-y-4">
                    <KnowledgeTab
                        channelId={id}
                        knowledgeEntries={knowledgeEntries}
                        setKnowledgeEntries={setKnowledgeEntries}
                    />
                </TabsContent>

                {/* ─── Templates Tab ─── */}
                <TabsContent value="templates" className="space-y-4">
                    <TemplatesTab
                        channelId={id}
                        templates={templates}
                        setTemplates={setTemplates}
                    />
                </TabsContent>

                {/* ─── Hashtags Tab ─── */}
                <TabsContent value="hashtags" className="space-y-4">
                    <HashtagsTab
                        channelId={id}
                        hashtags={hashtags}
                        setHashtags={setHashtags}
                    />
                </TabsContent>

                {/* ─── Webhooks Tab ─── */}
                <TabsContent value="webhooks" className="space-y-4">
                    <WebhooksTab
                        webhookDiscordUrl={webhookDiscordUrl}
                        setWebhookDiscordUrl={setWebhookDiscordUrl}
                        webhookTelegramToken={webhookTelegramToken}
                        setWebhookTelegramToken={setWebhookTelegramToken}
                        webhookTelegramChatId={webhookTelegramChatId}
                        setWebhookTelegramChatId={setWebhookTelegramChatId}
                        webhookSlackUrl={webhookSlackUrl}
                        setWebhookSlackUrl={setWebhookSlackUrl}
                        webhookZaloAppId={webhookZaloAppId}
                        setWebhookZaloAppId={setWebhookZaloAppId}
                        webhookZaloSecretKey={webhookZaloSecretKey}
                        setWebhookZaloSecretKey={setWebhookZaloSecretKey}
                        webhookZaloRefreshToken={webhookZaloRefreshToken}
                        setWebhookZaloRefreshToken={setWebhookZaloRefreshToken}
                        webhookZaloUserId={webhookZaloUserId}
                        setWebhookZaloUserId={setWebhookZaloUserId}
                        webhookCustomUrl={webhookCustomUrl}
                        setWebhookCustomUrl={setWebhookCustomUrl}
                        testingWebhook={testingWebhook}
                        handleWebhookTest={handleWebhookTest}
                    />
                </TabsContent>

                {/* ─── Members Tab ─── */}
                <TabsContent value="members" className="space-y-4">
                    <MembersTab
                        channelId={id}
                        members={members}
                        setMembers={setMembers}
                        isAdmin={isAdmin}
                    />
                </TabsContent>

                {/* ─── Customers Tab ─── */}
                <TabsContent value="customers" className="space-y-4">
                    <CustomersTab channelId={id} />
                </TabsContent>

                {/* ─── Chat Bot Tab ─── */}
                <TabsContent value="chatbot" className="space-y-4">
                    <ChatBotTab channelId={id} />
                </TabsContent>

            </Tabs>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Customers Tab Component
// ─────────────────────────────────────────────────────────
function CustomersTab({ channelId }: { channelId: string }) {
    const [customers, setCustomers] = useState<{ user: { id: string; name: string | null; email: string; isActive: boolean } }[]>([])
    const [invites, setInvites] = useState<{ id: string; email: string; name: string | null; expiresAt: string; token: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [inviting, setInviting] = useState(false)
    const [inviteUrl, setInviteUrl] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (!channelId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/channels/${channelId}/customers`)
            const data = await res.json()
            setCustomers(data.members || [])
            setInvites(data.invites || [])
        } finally {
            setLoading(false)
        }
    }, [channelId])

    useEffect(() => { load() }, [load])

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault()
        if (!email) return
        setInviting(true)
        try {
            const res = await fetch(`/api/admin/channels/${channelId}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name }),
            })
            const data = await res.json()
            if (res.ok) {
                setInviteUrl(data.inviteUrl)
                setEmail('')
                setName('')
                load()
            }
        } finally {
            setInviting(false)
        }
    }

    async function toggleActive(customerId: string, isActive: boolean) {
        await fetch(`/api/admin/channels/${channelId}/customers/${customerId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: isActive ? 'deactivate' : 'activate' }),
        })
        load()
    }

    async function removeCustomer(customerId: string) {
        if (!confirm('Remove this customer from the channel?')) return
        await fetch(`/api/admin/channels/${channelId}/customers/${customerId}`, { method: 'DELETE' })
        load()
    }

    async function removeInvite(inviteId: string) {
        if (!confirm('Cancel this invite?')) return
        await fetch(`/api/admin/channels/${channelId}/customers/${inviteId}`, { method: 'DELETE' })
        load()
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Customers</CardTitle>
                <CardDescription>Invite clients to review and approve posts in this channel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Invite form */}
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        placeholder="Name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border border-border rounded-md px-3 py-2 text-sm bg-background flex-1"
                    />
                    <input
                        type="email"
                        placeholder="Email address *"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border border-border rounded-md px-3 py-2 text-sm bg-background flex-1"
                    />
                    <Button type="submit" disabled={inviting || !email} size="sm" className="gap-1.5">
                        <UserPlus className="h-3.5 w-3.5" />
                        {inviting ? 'Sending...' : 'Send Invite'}
                    </Button>
                </form>

                {/* Show invite URL after sending */}
                {inviteUrl && (
                    <div className="bg-muted rounded-lg px-4 py-3 text-sm">
                        <p className="text-muted-foreground mb-1">Invite link sent. Copy to share manually:</p>
                        <div className="flex items-center gap-2">
                            <code className="text-xs bg-background border border-border rounded px-2 py-1 flex-1 overflow-x-auto">{inviteUrl}</code>
                            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(inviteUrl); setInviteUrl(null) }}>
                                Copy &amp; Close
                            </Button>
                        </div>
                    </div>
                )}

                <Separator />

                {/* Active customers */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Active Customers ({customers.length})</h4>
                    {loading ? (
                        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : customers.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No customers yet. Send your first invite above.</p>
                    ) : (
                        <div className="space-y-2">
                            {customers.map(({ user }) => (
                                <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5">
                                    <div>
                                        <p className="text-sm font-medium">{user.name || user.email}</p>
                                        {user.name && <p className="text-xs text-muted-foreground">{user.email}</p>}\
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Button size="sm" variant="ghost" onClick={() => toggleActive(user.id, user.isActive)}>
                                            {user.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}\
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => removeCustomer(user.id)}>
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pending invites */}
                {invites.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-3">Pending Invites ({invites.length})</h4>
                        <div className="space-y-2">
                            {invites.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-2.5">
                                    <div>
                                        <p className="text-sm font-medium">{inv.name || inv.email}</p>
                                        {inv.name && <p className="text-xs text-muted-foreground">{inv.email}</p>}
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Expires {new Date(inv.expiresAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">Pending</Badge>
                                        <Button size="sm" variant="ghost" title="Copy invite link" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.token}`)}>
                                            <LinkIcon className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => removeInvite(inv.id)}>
                                            <X className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    )
}
