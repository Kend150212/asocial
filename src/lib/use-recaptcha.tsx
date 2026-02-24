'use client'

import { useEffect, useState, useCallback, createContext, useContext } from 'react'

/**
 * Hook to load Google reCAPTCHA v3 and get tokens.
 *
 * Usage:
 *   const { getToken, ready } = useRecaptcha()
 *   const token = await getToken('register')
 *   // Send token to server for verification
 */

interface RecaptchaContextValue {
    /** Get a reCAPTCHA token for the given action */
    getToken: (action: string) => Promise<string | null>
    /** Whether reCAPTCHA is loaded and ready */
    ready: boolean
    /** Whether reCAPTCHA is enabled (site key is configured) */
    enabled: boolean
}

const RecaptchaContext = createContext<RecaptchaContextValue>({
    getToken: async () => null,
    ready: false,
    enabled: false,
})

export function RecaptchaProvider({ children }: { children: React.ReactNode }) {
    const [siteKey, setSiteKey] = useState<string | null>(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        // Fetch site key from API
        console.log('[reCAPTCHA] Fetching site key...')
        fetch('/api/recaptcha-key')
            .then(r => r.json())
            .then(d => {
                console.log('[reCAPTCHA] Response:', d)
                if (d.siteKey) {
                    setSiteKey(d.siteKey)
                    // Load reCAPTCHA script
                    const script = document.createElement('script')
                    script.src = `https://www.google.com/recaptcha/api.js?render=${d.siteKey}`
                    script.async = true
                    script.onload = () => {
                        console.log('[reCAPTCHA] Script loaded, waiting for grecaptcha.ready...')
                            // Wait for grecaptcha to be ready
                            ; (window as any).grecaptcha?.ready(() => {
                                console.log('[reCAPTCHA] Ready!')
                                setReady(true)
                            })
                    }
                    script.onerror = (err) => {
                        console.error('[reCAPTCHA] Script load error:', err)
                    }
                    document.head.appendChild(script)
                } else {
                    console.log('[reCAPTCHA] No site key configured, skipping')
                }
            })
            .catch((err) => {
                console.error('[reCAPTCHA] Fetch error:', err)
            })
    }, [])

    const getToken = useCallback(async (action: string): Promise<string | null> => {
        console.log('[reCAPTCHA] getToken called:', { action, siteKey: !!siteKey, ready })
        if (!siteKey || !ready) {
            console.warn('[reCAPTCHA] Not ready, returning null token')
            return null
        }
        try {
            const token = await (window as any).grecaptcha.execute(siteKey, { action })
            console.log('[reCAPTCHA] Token obtained:', token?.substring(0, 20) + '...')
            return token
        } catch (err) {
            console.error('[reCAPTCHA] Execute error:', err)
            return null
        }
    }, [siteKey, ready])

    return (
        <RecaptchaContext.Provider value={{ getToken, ready, enabled: !!siteKey }}>
            {children}
        </RecaptchaContext.Provider>
    )
}

export function useRecaptcha() {
    return useContext(RecaptchaContext)
}
