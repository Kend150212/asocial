import { prisma } from '@/lib/prisma'

const PINTEREST_PRODUCTION = 'https://api.pinterest.com'
const PINTEREST_SANDBOX = 'https://api-sandbox.pinterest.com'

/**
 * Get the Pinterest API base URL based on integration config.
 * If `pinterestSandbox` is set to 'true' in the Pinterest integration config,
 * returns the sandbox URL. Otherwise returns production URL.
 */
export async function getPinterestApiBase(): Promise<string> {
    const integration = await prisma.apiIntegration.findFirst({
        where: { provider: 'pinterest' },
    })
    const config = (integration?.config || {}) as Record<string, string>
    const useSandbox = config.pinterestSandbox === 'true' || config.pinterestSandbox === '1'

    if (useSandbox) {
        console.log('[Pinterest] Using SANDBOX API')
    }
    return useSandbox ? PINTEREST_SANDBOX : PINTEREST_PRODUCTION
}
