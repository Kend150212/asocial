/**
 * Platform Registry — single source of truth for all supported platforms.
 * Adding a new platform: just add it here → EasyConnect page auto-includes it.
 */

// OAuth-based platforms (open popup → redirect to /api/oauth/[key])
export const OAUTH_PLATFORMS = [
    { key: 'facebook', label: 'Facebook', color: '#1877F2', description: 'Pages & Profiles' },
    { key: 'instagram', label: 'Instagram', color: '#E1306C', description: 'Business Accounts' },
    { key: 'youtube', label: 'YouTube', color: '#FF0000', description: 'Channels' },
    { key: 'tiktok', label: 'TikTok', color: '#000000', description: 'Business Accounts' },
    { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2', description: 'Pages & Profiles' },
    { key: 'pinterest', label: 'Pinterest', color: '#E60023', description: 'Boards & Profiles' },
    { key: 'threads', label: 'Threads', color: '#000000', description: 'Profiles' },
    { key: 'gbp', label: 'Google Business', color: '#4285F4', description: 'Business Locations' },
] as const

// Credential-based platforms (inline form instead of OAuth popup)
export const CREDENTIAL_PLATFORMS = [
    {
        key: 'x',
        label: 'X (Twitter)',
        color: '#000000',
        description: 'Requires Developer API Keys',
        fields: [
            { id: 'apiKey', label: 'API Key', placeholder: 'API Key (Consumer Key)', type: 'password' },
            { id: 'apiKeySecret', label: 'API Key Secret', placeholder: 'API Key Secret', type: 'password' },
            { id: 'accessToken', label: 'Access Token', placeholder: 'Access Token', type: 'password' },
            { id: 'accessTokenSecret', label: 'Access Token Secret', placeholder: 'Access Token Secret', type: 'password' },
        ],
        guide: {
            title: 'Cách lấy X API Credentials',
            steps: [
                'Truy cập developer.x.com → Đăng nhập → Create Project',
                'Tạo App → App Settings → Enable OAuth 1.0a → Permissions: Read and Write',
                'Tab "Keys and tokens" → Copy API Key, API Key Secret, Access Token, Access Token Secret',
            ],
            warning: 'Free tier: 1,500 tweets/tháng. Basic ($100/tháng): 3M tweets/tháng',
            connectUrl: '/api/oauth/x/connect',
        },
    },
    {
        key: 'bluesky',
        label: 'Bluesky',
        color: '#0085ff',
        description: 'Dùng App Password',
        fields: [
            { id: 'handle', label: 'Handle', placeholder: 'user.bsky.social', type: 'text' },
            { id: 'appPassword', label: 'App Password', placeholder: 'App Password', type: 'password' },
        ],
        guide: {
            title: 'Cách lấy Bluesky App Password',
            steps: [
                'Truy cập bsky.app → Đăng nhập',
                'Settings → App Passwords → Add App Password',
                'Đặt tên, copy password được tạo ra',
            ],
            warning: null,
            connectUrl: '/api/oauth/bluesky',
        },
    },
] as const

export type OAuthPlatformKey = typeof OAUTH_PLATFORMS[number]['key']
export type CredentialPlatformKey = typeof CREDENTIAL_PLATFORMS[number]['key']
export type PlatformKey = OAuthPlatformKey | CredentialPlatformKey

export const ALL_PLATFORM_KEYS: string[] = [
    ...OAUTH_PLATFORMS.map(p => p.key),
    ...CREDENTIAL_PLATFORMS.map(p => p.key),
]
