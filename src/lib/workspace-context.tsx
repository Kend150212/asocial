'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

const STORAGE_KEY = 'asocial_workspace'

interface WorkspaceChannel {
    id: string
    displayName: string
    name: string
}

interface WorkspaceContextType {
    activeChannelId: string | null   // null = all channels
    activeChannel: WorkspaceChannel | null
    channels: WorkspaceChannel[]
    setActiveChannel: (channel: WorkspaceChannel | null) => void
    loadingChannels: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType>({
    activeChannelId: null,
    activeChannel: null,
    channels: [],
    setActiveChannel: () => { },
    loadingChannels: true,
})

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [channels, setChannels] = useState<WorkspaceChannel[]>([])
    const [activeChannel, setActiveChannelState] = useState<WorkspaceChannel | null>(null)
    const [loadingChannels, setLoadingChannels] = useState(true)

    // Load channels on mount
    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const res = await fetch('/api/admin/channels')
                if (res.ok) {
                    const data: WorkspaceChannel[] = await res.json()
                    setChannels(data)

                    // Restore saved workspace from localStorage
                    const saved = localStorage.getItem(STORAGE_KEY)
                    if (saved) {
                        const found = data.find((c) => c.id === saved)
                        if (found) setActiveChannelState(found)
                    }
                }
            } catch {
                // silently ignore
            } finally {
                setLoadingChannels(false)
            }
        }
        fetchChannels()
    }, [])

    const setActiveChannel = useCallback((channel: WorkspaceChannel | null) => {
        setActiveChannelState(channel)
        if (channel) {
            localStorage.setItem(STORAGE_KEY, channel.id)
        } else {
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [])

    return (
        <WorkspaceContext.Provider
            value={{
                activeChannelId: activeChannel?.id ?? null,
                activeChannel,
                channels,
                setActiveChannel,
                loadingChannels,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    )
}

export function useWorkspace() {
    return useContext(WorkspaceContext)
}
