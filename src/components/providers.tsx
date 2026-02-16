'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nProvider } from '@/lib/i18n'
import { Session } from 'next-auth'
import { useState } from 'react'

export function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    )

    return (
        <SessionProvider session={session}>
            <QueryClientProvider client={queryClient}>
                <NextThemesProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <I18nProvider>
                        <TooltipProvider delayDuration={0}>
                            {children}
                        </TooltipProvider>
                    </I18nProvider>
                </NextThemesProvider>
            </QueryClientProvider>
        </SessionProvider>
    )
}

