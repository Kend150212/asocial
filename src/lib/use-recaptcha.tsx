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
        // Fetch site key from branding/settings
        fetch('/api/recaptcha-key')
            .then(r => r.json())
            .then(d => {
                if (d.siteKey) {
                    setSiteKey(d.siteKey)
                    // Load reCAPTCHA script
                    const script = document.createElement('script')
                    script.src = `https://www.google.com/recaptcha/api.js?render=${d.siteKey}`
                    script.async = true
                    script.onload = () => {
                        // Wait for grecaptcha to be ready
                        ; (window as any).grecaptcha?.ready(() => setReady(true))
                    }
                    document.head.appendChild(script)
                }
            })
            .catch(() => { })
    }, [])

    const getToken = useCallback(async (action: string): Promise<string | null> => {
        if (!siteKey || !ready) return null
        try {
            const token = await (window as any).grecaptcha.execute(siteKey, { action })
            return token
        } catch {
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
