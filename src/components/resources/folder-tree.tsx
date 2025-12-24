'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AppResourceType } from '@/types';

interface FolderTreeProps {
    currentFolderId: string | null;
    onNavigate: (folder: AppResourceType) => void;
    className?: string;
}

interface FolderTreeItemProps {
    folder: AppResourceType;
    level: number;
    currentFolderId: string | null;
    onNavigate: (folder: AppResourceType) => void;
}

const FolderTreeItem = ({ folder, level, currentFolderId, onNavigate }: FolderTreeItemProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [children, setChildren] = useState<AppResourceType[]>([]);
    const [hasLoadedChildren, setHasLoadedChildren] = useState(false);

    const isActive = currentFolderId === folder.id;

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
            setIsOpen(false);
        } else {
            setIsOpen(true);
            if (!hasLoadedChildren) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/resources?parentId=${folder.id}&status=ACTIVE`);
                    if (res.ok) {
                        const data = await res.json();
                        // Filter only folders
                        const folders = (data.resources || []).filter((r: AppResourceType) => r.type === 'FOLDER');
                        setChildren(folders);
                        setHasLoadedChildren(true);
                    }
                } catch (error) {
                    console.error("Error loading folder children:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onNavigate(folder);
    };

    return (
        <div>
            <div
                className={cn(
                    "flex items-center py-1 px-2 rounded-md cursor-pointer transition-colors text-sm select-none",
                    isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
            >
                <div
                    role="button"
                    className="p-1 hover:bg-background rounded-sm mr-1"
                    onClick={handleToggle}
                >
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </div>

                {isOpen ? (
                    <FolderOpen className={cn("h-4 w-4 mr-2", isActive ? "text-primary" : "text-muted-foreground")} />
                ) : (
                    <Folder className={cn("h-4 w-4 mr-2", isActive ? "text-primary" : "text-muted-foreground")} />
                )}

                <span className="truncate">{folder.title}</span>
            </div>

            {isOpen && (
                <div>
                    {isLoading ? (
                        <div className="pl-4 py-1">
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ) : (
                        children.length > 0 ? (
                            children.map(child => (
                                <FolderTreeItem
                                    key={child.id}
                                    folder={child}
                                    level={level + 1}
                                    currentFolderId={currentFolderId}
                                    onNavigate={onNavigate}
                                />
                            ))
                        ) : (
                            <div className="text-xs text-muted-foreground py-1" style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}>
                                (vacío)
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export function FolderTree({ currentFolderId, onNavigate, className }: FolderTreeProps) {
    const [rootFolders, setRootFolders] = useState<AppResourceType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRoots = async () => {
            setIsLoading(true);
            try {
                // Fetch root level resources
                const res = await fetch('/api/resources?parentId=&status=ACTIVE');
                if (res.ok) {
                    const data = await res.json();
                    const folders = (data.resources || []).filter((r: AppResourceType) => r.type === 'FOLDER');
                    setRootFolders(folders);
                }
            } catch (error) {
                console.error("Error fetching root folders:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoots();
    }, []);

    // Helper for "Root" / "Biblioteca" item
    const rootItem: AppResourceType = {
        id: 'root',
        title: 'Biblioteca Principal',
        type: 'FOLDER',
        // Mock required properties to satisfy type
        description: null,
        url: null,
        category: 'System',
        tags: [],
        uploaderName: 'System',
        hasPin: false,
        status: 'ACTIVE',
        filetype: null,
        sharingMode: 'PUBLIC',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        uploadDate: new Date(),
        views: 0,
        downloads: 0,
        size: 0,
        uploaderId: 'system',
        parentId: null,
        isPinned: false,
        expiresAt: null
    } as unknown as AppResourceType;

    return (
        <div className={cn("w-full", className)}>
            <div
                className={cn(
                    "flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm mb-1 font-semibold",
                    !currentFolderId ? "bg-accent text-accent-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onNavigate({ ...rootItem, id: '' } as any)} // Passing empty ID for root/null
            >
                <Folder className="h-4 w-4 mr-2" />
                <span>Biblioteca</span>
            </div>

            {isLoading ? (
                <div className="space-y-2 p-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            ) : rootFolders.length > 0 ? (
                <div className="space-y-0.5">
                    {rootFolders.map(folder => (
                        <FolderTreeItem
                            key={folder.id}
                            folder={folder}
                            level={0}
                            currentFolderId={currentFolderId}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-sm text-muted-foreground p-4 text-center">
                    No hay carpetas
                </div>
            )}
        </div>
    );
}
