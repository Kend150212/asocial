import { prisma } from '@/lib/prisma'
import { decrypt, encrypt } from '@/lib/encryption'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3'

// Scopes needed: manage files created by the app
const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
]

/**
 * Build Google OAuth2 authorization URL
 */
export function getGDriveAuthUrl(clientId: string, redirectUri: string, state: string) {
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state,
    })
    return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for access + refresh tokens
 */
export async function exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
) {
    const res = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }),
    })

    const data = await res.json()

    if (data.error) {
        throw new Error(`Token exchange failed: ${data.error_description || data.error}`)
    }

    return {
        accessToken: data.access_token as string,
        refreshToken: data.refresh_token as string,
        expiresIn: data.expires_in as number,
    }
}

/**
 * Refresh an expired access token using the refresh token
 */
export async function refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
) {
    const res = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
        }),
    })

    const data = await res.json()

    if (data.error) {
        throw new Error(`Token refresh failed: ${data.error_description || data.error}`)
    }

    return {
        accessToken: data.access_token as string,
        expiresIn: data.expires_in as number,
    }
}

/**
 * Get a valid access token for Google Drive API calls.
 * Reads credentials from the ApiIntegration record, refreshes the token.
 */
export async function getGDriveAccessToken() {
    const integration = await prisma.apiIntegration.findFirst({
        where: { provider: 'gdrive' },
    })

    if (!integration) {
        throw new Error('Google Drive integration not found')
    }

    const config = (integration.config || {}) as Record<string, string>
    const clientId = config.gdriveClientId
    const refreshTokenEncrypted = config.gdriveRefreshToken

    if (!clientId || !refreshTokenEncrypted) {
        throw new Error('Google Drive not connected — please connect first')
    }

    // Client Secret is stored as the encrypted API key
    if (!integration.apiKeyEncrypted) {
        throw new Error('Google Drive Client Secret not configured')
    }

    const clientSecret = decrypt(integration.apiKeyEncrypted)
    const refreshToken = decrypt(refreshTokenEncrypted)

    const { accessToken } = await refreshAccessToken(refreshToken, clientId, clientSecret)
    return accessToken
}

/**
 * Create a folder in Google Drive
 */
export async function createFolder(
    accessToken: string,
    name: string,
    parentId?: string
) {
    const metadata: Record<string, unknown> = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
    }

    if (parentId) {
        metadata.parents = [parentId]
    }

    const res = await fetch(`${GOOGLE_DRIVE_API}/files`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
    })

    const data = await res.json()

    if (data.error) {
        throw new Error(`Failed to create folder: ${data.error.message}`)
    }

    return {
        id: data.id as string,
        name: data.name as string,
        webViewLink: `https://drive.google.com/drive/folders/${data.id}`,
    }
}

/**
 * Get user info (email) from Google
 */
export async function getGoogleUserEmail(accessToken: string) {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    return data.email as string
}

/**
 * Store the refresh token + connected email in the integration config
 */
export async function storeGDriveTokens(
    integrationId: string,
    refreshToken: string,
    email: string
) {
    const integration = await prisma.apiIntegration.findUnique({
        where: { id: integrationId },
    })

    const existingConfig = (integration?.config as Record<string, unknown>) || {}

    await prisma.apiIntegration.update({
        where: { id: integrationId },
        data: {
            config: {
                ...existingConfig,
                gdriveRefreshToken: encrypt(refreshToken),
                gdriveEmail: email,
                gdriveConnectedAt: new Date().toISOString(),
            },
            status: 'ACTIVE',
        },
    })
}

/**
 * Build the OAuth2 redirect URI from the app's base URL
 */
export function getRedirectUri() {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return `${baseUrl}/api/admin/gdrive/callback`
}
