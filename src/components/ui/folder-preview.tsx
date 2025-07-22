
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type EnterpriseResource } from '@/types';
import { Loader2, Folder, FileText, Video, Info, Notebook, Shield, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './scroll-area';

interface FolderPreviewProps {
  folderId: string;
  children: React.ReactNode;
}

const getIconForType = (type: EnterpriseResource['type']) => {
    switch (type) {
      case 'FOLDER': return <Folder className="h-4 w-4 text-primary" />;
      case 'DOCUMENT': return <FileText className="h-4 w-4 text-blue-400" />;
      case 'GUIDE': return <Info className="h-4 w-4 text-green-400" />;
      case 'MANUAL': return <Notebook className="h-4 w-4 text-indigo-400" />;
      case 'POLICY': return <Shield className="h-4 w-4 text-red-400" />;
      case 'VIDEO': return <Video className="h-4 w-4 text-purple-400" />;
      default: return <FileQuestion className="h-4 w-4 text-gray-400" />;
    }
};

export function FolderPreview({ folderId, children }: FolderPreviewProps) {
  const [content, setContent] = useState<EnterpriseResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchContent = useCallback(async () => {
    if (content.length > 0) return; // Don't refetch if content is already loaded
    setIsLoading(true);
    try {
      const response = await fetch(`/api/resources?parentId=${folderId}&pageSize=50`); // Fetch up to 50 items for preview
      if (!response.ok) throw new Error('Failed to fetch folder content');
      const data = await response.json();
      setContent(data.resources || []);
    } catch (error) {
      console.error(error);
      setContent([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [folderId, content.length]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
        fetchContent();
        setIsOpen(true);
    }, 200); // Small delay to prevent accidental triggers
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
     timerRef.current = setTimeout(() => {
        setIsOpen(false);
    }, 300);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div 
        className={cn(
            "absolute left-0 top-full mt-2 w-64 bg-card border border-border rounded-md shadow-lg z-20 transition-opacity duration-300",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <ScrollArea className="max-h-64">
            <ul className="p-2 space-y-1 text-sm">
            {isLoading ? (
                <li className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </li>
            ) : content.length > 0 ? (
                content.map(item => (
                    <li key={item.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50">
                        {getIconForType(item.type)}
                        <span className="truncate">{item.title}</span>
                    </li>
                ))
            ) : (
                <li className="p-4 text-center text-muted-foreground text-xs">
                    Carpeta vacía
                </li>
            )}
            </ul>
        </ScrollArea>
      </div>
    </div>
  );
}
