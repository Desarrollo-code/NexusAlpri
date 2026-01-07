// src/hooks/use-mobile-drawer.ts
'use client';

import { useState, useCallback } from 'react';

export function useMobileDrawer() {
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

    const toggleExplorer = useCallback(() => {
        setIsExplorerOpen(prev => !prev);
        setIsPropertiesOpen(false); // Close properties when opening explorer
    }, []);

    const toggleProperties = useCallback(() => {
        setIsPropertiesOpen(prev => !prev);
        setIsExplorerOpen(false); // Close explorer when opening properties
    }, []);

    const closeAll = useCallback(() => {
        setIsExplorerOpen(false);
        setIsPropertiesOpen(false);
    }, []);

    const openExplorer = useCallback(() => {
        setIsExplorerOpen(true);
        setIsPropertiesOpen(false);
    }, []);

    const openProperties = useCallback(() => {
        setIsPropertiesOpen(true);
        setIsExplorerOpen(false);
    }, []);

    return {
        isExplorerOpen,
        isPropertiesOpen,
        toggleExplorer,
        toggleProperties,
        closeAll,
        openExplorer,
        openProperties,
    };
}
