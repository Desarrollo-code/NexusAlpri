// src/components/ui/file-icon.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import Image from 'next/image';
import { PlayCircle, FileText, BarChart3, Music, Image as ImageIcon, Video as VideoIcon, ListVideo, BrainCircuit } from 'lucide-react';
import { IconFolderDynamic } from '../icons/icon-folder-dynamic';
import { IconVideoPlaylist } from '../icons/icon-video-playlist';
import { getProcessColors } from '@/lib/utils';
import { IconFolderYellow } from '../icons/icon-folder-yellow';

interface FileIconProps {
    type: string;
    className?: string;
    thumbnailUrl?: string | null;
    displayMode?: 'grid' | 'list' | 'header';
    resourceId?: string; // Optional, for dynamic coloring
    size?: 'sm' | 'md' | 'lg';
}

const backgroundPatterns = [
    'bg-pattern-dots',
    'bg-pattern-lines',
    'bg-pattern-cross',
    'bg-pattern-circles',
    'bg-pattern-zig-zag',
    'bg-pattern-triangles',
    'bg-pattern-designer',
    'bg-pattern-cubes',
    'bg-pattern-geometry',
    'bg-pattern-blueprint',
    'bg-pattern-circuit',
    'bg-pattern-argyle',
    'bg-pattern-longbar',
    'bg-pattern-woven',
    'bg-pattern-space',
];

/**
 * A simple and effective hashing function (djb2) to convert a string to a number.
 * This provides a better distribution than a basic character code sum.
 * @param str The string to hash (e.g., a resource ID).
 * @returns A number hash.
 */
const stringToHash = (str: string): number => {
    if (!str) return 0;
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
    }
    return Math.abs(hash);
};


const renderIconPath = (type: string, className?: string) => {
    switch (type.toLowerCase()) {
        case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp':
            return <ImageIcon className={cn("w-full h-full", className)} />;
        case 'mp4': case 'webm': case 'mov': case 'video':
            return <VideoIcon className={cn("w-full h-full", className)} />;
        case 'mp3': case 'wav':
            return <Music className={cn("w-full h-full", className)} />;
        case 'xls': case 'xlsx': case 'csv':
            return <BarChart3 className={cn("w-full h-full", className)} />;
        case 'quiz':
            return <BrainCircuit className={cn("w-full h-full", className)} />;
        default:
            return <FileText className={cn("w-full h-full", className)} />;
    }
};

export const FileIcon: React.FC<FileIconProps> = ({ type, className, thumbnailUrl, displayMode = 'grid', resourceId, size }) => {
    const isYoutube = type.toLowerCase() === 'youtube';
    const isVideoFile = ['mp4', 'webm', 'mov', 'video', 'youtube'].includes(type.toLowerCase());
    const finalThumbnailUrl = isYoutube
        ? `https://img.youtube.com/vi/${getYoutubeVideoId(thumbnailUrl)}/sddefault.jpg`
        : thumbnailUrl;

    // --- HEADER MODE ---
    if (displayMode === 'header') {
        const Icon = renderIconPath(type);
        return (
            <div className={cn("w-5 h-5 flex items-center justify-center rounded-md", className)}>
                {React.cloneElement(Icon as React.ReactElement, { className: 'text-muted-foreground' })}
            </div>
        );
    }

    // --- LIST MODE ---
    if (displayMode === 'list') {
        const { label, bgColor } = getFileTypeDetails(type);
        const isActuallyVideoFile = isVideoFile && finalThumbnailUrl && !isYoutube;

        return (
            <div className={cn("w-full h-full flex items-center justify-center rounded-md overflow-hidden group relative", className)}>
                {isActuallyVideoFile ? (
                    <>
                        <video key={finalThumbnailUrl} preload="metadata" className="w-full h-full object-cover">
                            <source src={`${finalThumbnailUrl}#t=0.1`} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                            <PlayCircle className="h-6 w-6 text-white/80 drop-shadow-lg" />
                        </div>
                    </>
                ) : finalThumbnailUrl ? (
                    <>
                        <Image src={finalThumbnailUrl} alt={label} fill className="object-cover transition-transform duration-300 group-hover:scale-105" quality={75} />
                        {isYoutube && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                <PlayCircle className="h-6 w-6 text-white/80 drop-shadow-lg" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center rounded-md" style={{ backgroundColor: bgColor }}>
                        {isVideoFile ? <VideoIcon className="h-6 w-6 text-white" /> :
                            <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                                {label}
                            </span>}
                    </div>
                )}
            </div>
        );
    }

    // --- GRID VIEW ---
    if ((type === 'FOLDER' || type === 'VIDEO_PLAYLIST') && resourceId) {
        const { raw } = getProcessColors(resourceId);
        const hash = stringToHash(resourceId);
        const patternClass = backgroundPatterns[hash % backgroundPatterns.length];

        return (
            <div
                className={cn("flex h-full w-full items-center justify-center p-4 relative overflow-hidden", patternClass)}
                style={{
                    '--c1': raw.light,
                    '--c2': raw.medium,
                } as React.CSSProperties}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                {type === 'FOLDER' ? (
                    <IconFolderYellow className={cn(size === 'sm' ? "w-12 h-12" : "w-24 h-24", "text-foreground/80 drop-shadow-lg relative z-10")} style={{ color: raw.dark }} />
                ) : (
                    <IconVideoPlaylist className={cn(size === 'sm' ? "w-10 h-10" : "w-20 h-20", "text-foreground/80 drop-shadow-lg relative z-10")} style={{ color: raw.dark }} />
                )}
            </div>
        );
    }


    const isActuallyImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(finalThumbnailUrl || '');

    return (
        <div className={cn("relative w-full h-full overflow-hidden bg-black", className)}>
            {isActuallyImage && finalThumbnailUrl ? (
                <>
                    <Image src={finalThumbnailUrl} alt={type} fill className="object-cover transition-transform duration-300 group-hover:scale-105" quality={80} />
                    {(isYoutube) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                            <PlayCircle className="h-10 w-10 text-white/70 drop-shadow-lg" />
                        </div>
                    )}
                </>
            ) : isVideoFile && finalThumbnailUrl ? (
                <>
                    <video key={finalThumbnailUrl} preload="metadata" className="w-full h-full object-cover">
                        <source src={`${finalThumbnailUrl}#t=0.1`} type={type === 'mp4' ? 'video/mp4' : 'video/webm'} />
                    </video>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                        <PlayCircle className="h-10 w-10 text-white/70 drop-shadow-lg" />
                    </div>
                </>
            ) : (
                <div className="flex h-full w-full items-center justify-center p-4">
                    {renderIconPath(type, cn(size === 'sm' ? 'w-8 h-8' : 'w-16 h-16', 'text-white/80'))}
                </div>
            )}
        </div>
    );
};

export const getFileTypeDetails = (type: string) => {
    if (!type) return { label: 'FILE', bgColor: '#757575' };
    const upperType = type.toUpperCase();
    const extension = upperType.split('.').pop() || 'DEFAULT';
    const fileTypeMap: Record<string, { label: string, bgColor: string }> = {
        // Rojos y Rosas
        PDF: { label: 'PDF', bgColor: '#D94336' },
        PPT: { label: 'PPT', bgColor: '#D24726' },
        PPTX: { label: 'PPTX', bgColor: '#D24726' },
        YOUTUBE: { label: 'YT', bgColor: '#FF3D00' },
        MP3: { label: 'MP3', bgColor: '#E91E63' },
        MOV: { label: 'MOV', bgColor: '#E91E63' },
        SVG: { label: 'SVG', bgColor: '#E91E63' },

        // Azules y Grises
        ZIP: { label: 'ZIP', bgColor: '#607D8B' },
        DOC: { label: 'DOCX', bgColor: '#2A5699' },
        DOCX: { label: 'DOCX', bgColor: '#2A5699' },
        AVI: { label: 'AVI', bgColor: '#3F51B5' },
        TIFF: { label: 'TIFF', bgColor: '#3F51B5' },
        PSD: { label: 'PSD', bgColor: '#3F51B5' },
        TXT: { label: 'TXT', bgColor: '#03A9F4' },
        EXE: { label: 'EXE', bgColor: '#607D8B' },
        DLL: { label: 'DLL', bgColor: '#607D8B' },
        RAW: { label: 'RAW', bgColor: '#9E9E9E' },

        // Púrpuras
        MPG: { label: 'MPG', bgColor: '#673AB7' },
        WAV: { label: 'WAV', bgColor: '#673AB7' },
        RAR: { label: 'RAR', bgColor: '#673AB7' },
        EML: { label: 'EML', bgColor: '#673AB7' },

        // Verdes
        JPG: { label: 'JPG', bgColor: '#4CAF50' },
        JPEG: { label: 'JPG', bgColor: '#4CAF50' },
        BMP: { label: 'BMP', bgColor: '#4CAF50' },
        GIF: { label: 'GIF', bgColor: '#4CAF50' },
        XLS: { label: 'XLS', bgColor: '#0F7D40' },
        XLSX: { label: 'XLSX', bgColor: '#0F7D40' },
        CSV: { label: 'CSV', bgColor: '#0F7D40' },

        // Naranjas y Amarillos
        EPS: { label: 'EPS', bgColor: '#FF9800' },
        FLV: { label: 'FLV', bgColor: '#FF9800' },
        CSS: { label: 'CSS', bgColor: '#FF5722' },
        HTML: { label: 'HTML', bgColor: '#FF5722' },
        AI: { label: 'AI', bgColor: '#FFC107' },
        PNG: { label: 'PNG', bgColor: '#03A9F4' },

        // Video
        VIDEO: { label: 'VID', bgColor: '#00796B' }, // para MP4, etc.
        MP4: { label: 'MP4', bgColor: '#00796B' },

        DEFAULT: { label: 'FILE', bgColor: '#757575' },
    };
    return fileTypeMap[extension] || { label: extension.substring(0, 4), bgColor: '#757575' };
};
