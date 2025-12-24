import { useCallback, useEffect, useState } from 'react';

const RECENT_RESOURCES_KEY = 'nexus-recent-resources';
const MAX_RECENT_ITEMS = 20;

interface RecentResource {
    id: string;
    timestamp: number;
}

export function useRecentResources() {
    const [recentIds, setRecentIds] = useState<string[]>([]);

    // Load recent resources from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_RESOURCES_KEY);
            if (stored) {
                const parsed: RecentResource[] = JSON.parse(stored);
                // Sort by timestamp descending and extract IDs
                const ids = parsed
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map(item => item.id);
                setRecentIds(ids);
            }
        } catch (error) {
            console.error('Error loading recent resources:', error);
        }
    }, []);

    const addRecentResource = useCallback((resourceId: string) => {
        try {
            const stored = localStorage.getItem(RECENT_RESOURCES_KEY);
            let recent: RecentResource[] = stored ? JSON.parse(stored) : [];

            // Remove existing entry for this resource if present
            recent = recent.filter(item => item.id !== resourceId);

            // Add new entry at the beginning
            recent.unshift({
                id: resourceId,
                timestamp: Date.now()
            });

            // Keep only the most recent MAX_RECENT_ITEMS
            recent = recent.slice(0, MAX_RECENT_ITEMS);

            // Save to localStorage
            localStorage.setItem(RECENT_RESOURCES_KEY, JSON.stringify(recent));

            // Update state
            setRecentIds(recent.map(item => item.id));
        } catch (error) {
            console.error('Error saving recent resource:', error);
        }
    }, []);

    const clearRecentResources = useCallback(() => {
        try {
            localStorage.removeItem(RECENT_RESOURCES_KEY);
            setRecentIds([]);
        } catch (error) {
            console.error('Error clearing recent resources:', error);
        }
    }, []);

    return {
        recentIds,
        addRecentResource,
        clearRecentResources
    };
}
