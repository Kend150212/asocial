'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[GlobalError - Root]', error)
    }, [error])

    return (
        <html>
            <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0a0a0b', color: '#fafafa' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: '1rem',
                    padding: '2rem',
                    textAlign: 'center',
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Something went wrong</h2>
                    <p style={{ color: '#888', maxWidth: '400px', fontSize: '0.875rem' }}>
                        An unexpected error occurred. Click the button below to try again.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 24px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </body>
        </html>
    )
}
