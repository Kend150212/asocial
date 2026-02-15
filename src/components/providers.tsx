'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
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
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <NextThemesProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <TooltipProvider delayDuration={0}>
                        {children}
                    </TooltipProvider>
                </NextThemesProvider>
            </QueryClientProvider>
        </SessionProvider>
    )
}
