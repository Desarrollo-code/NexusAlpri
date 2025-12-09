// src/components/resources/folder-content-view.tsx
'use client';
import React from 'react';
import type { AppResourceType } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { IconFolderDynamic } from '../icons/icon-folder-dynamic';
import { FileIcon } from '../ui/file-icon';
import { Button } from '../ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { getProcessColors } from '@/lib/utils';

interface FolderContentViewProps {
    items: AppResourceType[];
    onEdit: (item: AppResourceType) => void;
    onDelete: (item: AppResourceType) => void;
}

const FolderItem = ({ item, onEdit, onDelete }: { item: AppResourceType, onEdit: (item: AppResourceType) => void, onDelete: (item: AppResourceType) => void }) => (
    <div className="flex items-center gap-2 py-1 pl-2 group">
        <IconFolderDynamic color={getProcessColors(item.id).raw.medium} className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium truncate flex-grow">{item.title}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(item)}><Edit className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(item)}><Trash2 className="h-3 w-3" /></Button>
        </div>
    </div>
);

const FileItem = ({ item, onEdit, onDelete }: { item: AppResourceType, onEdit: (item: AppResourceType) => void, onDelete: (item: AppResourceType) => void }) => {
    const fileExtension = item.filetype?.split('/')[1] || item.url?.split('.').pop() || 'file';
    return (
        <div className="flex items-center gap-2 py-1 pl-2 group">
            <FileIcon displayMode="list" type={fileExtension} className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm truncate flex-grow">{item.title}</span>
             <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(item)}><Edit className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(item)}><Trash2 className="h-3 w-3" /></Button>
            </div>
        </div>
    );
};


export const FolderContentView: React.FC<FolderContentViewProps> = ({ items, onEdit, onDelete }) => {
    if (!items || items.length === 0) {
        return <p className="text-sm text-center text-muted-foreground p-4">Esta carpeta está vacía.</p>;
    }

    const folders = items.filter(item => item.type === 'FOLDER');
    const files = items.filter(item => item.type !== 'FOLDER');

    return (
        <div className="space-y-1">
            <Accordion type="multiple" className="w-full">
                {folders.map(folder => (
                    <AccordionItem key={folder.id} value={folder.id} className="border-none">
                        <AccordionTrigger className="p-0 hover:no-underline">
                            <FolderItem item={folder} onEdit={onEdit} onDelete={onDelete} />
                        </AccordionTrigger>
                        <AccordionContent className="pl-6 border-l ml-2">
                           {/* Esta es una versión simplificada. Una versión completa requeriría carga perezosa de los contenidos de la subcarpeta. */}
                           <p className="text-xs text-muted-foreground p-2">El contenido de la subcarpeta se gestiona entrando en ella.</p>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
             <div className="pl-2 space-y-1">
                {files.map(file => (
                    <FileItem key={file.id} item={file} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        </div>
    );
};
