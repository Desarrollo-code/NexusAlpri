import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Folder, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppResourceType } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { UI_CONFIG } from '@/lib/ui-config';

interface FolderBannerProps {
    folder: AppResourceType;
    onEdit: () => void;
    canManage: boolean;
}

// SVG Pattern Components
const MeshPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={`mesh-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="50%" stopColor={color} stopOpacity="0.15" />
                <stop offset="100%" stopColor={color} stopOpacity="0.08" />
            </linearGradient>
            <filter id={`blur-${id}`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
        </defs>
        <path d="M0,0 Q150,80 300,0 T600,0 T900,0" fill="none" stroke={`url(#mesh-${id})`} strokeWidth="3" />
        <path d="M0,100 Q150,180 300,100 T600,100 T900,100" fill="none" stroke={`url(#mesh-${id})`} strokeWidth="2.5" />
        <circle cx="150" cy="50" r="100" fill={`url(#mesh-${id})`} filter={`url(#blur-${id})`} />
        <circle cx="500" cy="140" r="120" fill={`url(#mesh-${id})`} filter={`url(#blur-${id})`} />
        <circle cx="750" cy="60" r="80" fill={`url(#mesh-${id})`} filter={`url(#blur-${id})`} />
    </svg>
);

const GeometricPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.14]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`geo-${id}`} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <polygon points="60,10 110,60 60,110 10,60" fill={color} fillOpacity="0.2" />
                <polygon points="60,30 90,60 60,90 30,60" fill={color} fillOpacity="0.15" />
                <circle cx="60" cy="60" r="25" fill={color} fillOpacity="0.12" />
                <circle cx="10" cy="10" r="8" fill={color} fillOpacity="0.18" />
                <circle cx="110" cy="110" r="8" fill={color} fillOpacity="0.18" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#geo-${id})`} />
    </svg>
);

const DotsPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`dots-${id}`} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2.5" fill={color} fillOpacity="0.6" />
                <circle cx="30" cy="30" r="4" fill={color} fillOpacity="0.4" />
                <circle cx="40" cy="15" r="1.5" fill={color} fillOpacity="0.5" />
                <circle cx="15" cy="35" r="3" fill={color} fillOpacity="0.35" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${id})`} />
    </svg>
);

const WavesPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.16]" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,50 Q100,15 200,50 T400,50 T600,50 T800,50 T1000,50" fill="none" stroke={color} strokeWidth="2.5" opacity="0.35" />
        <path d="M0,100 Q100,65 200,100 T400,100 T600,100 T800,100 T1000,100" fill="none" stroke={color} strokeWidth="2.5" opacity="0.25" />
        <path d="M0,150 Q100,115 200,150 T400,150 T600,150 T800,150 T1000,150" fill="none" stroke={color} strokeWidth="2" opacity="0.15" />
        <path d="M0,190 Q100,160 200,190 T400,190 T600,190 T800,190 T1000,190" fill="none" stroke={color} strokeWidth="1.5" opacity="0.1" />
    </svg>
);

const LinesPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.1]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`lines-${id}`} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="30" stroke={color} strokeWidth="1.5" />
                <line x1="15" y1="0" x2="15" y2="30" stroke={color} strokeWidth="0.8" opacity="0.5" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#lines-${id})`} />
    </svg>
);

const GridPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`grid-${id}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke={color} strokeWidth="1.5" />
                <circle cx="0" cy="0" r="3" fill={color} fillOpacity="0.4" />
                <circle cx="30" cy="30" r="2" fill={color} fillOpacity="0.3" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
    </svg>
);

const CirclesPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.13]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id={`circle-grad-${id}`}>
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
        </defs>
        <circle cx="15%" cy="30%" r="120" fill={`url(#circle-grad-${id})`} />
        <circle cx="60%" cy="70%" r="150" fill={`url(#circle-grad-${id})`} />
        <circle cx="85%" cy="25%" r="100" fill={`url(#circle-grad-${id})`} />
        <circle cx="35%" cy="85%" r="90" fill={`url(#circle-grad-${id})`} />
    </svg>
);

const HexagonPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.11]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`hex-${id}`} x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
                <polygon points="50,0 100,25 100,65 50,87 0,65 0,25" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
                <polygon points="50,15 85,32 85,62 50,75 15,62 15,32" fill={color} fillOpacity="0.08" />
                <circle cx="50" cy="43" r="5" fill={color} fillOpacity="0.4" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#hex-${id})`} />
    </svg>
);

const TopographyPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.14]" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 Q150,40 300,80 T600,80 T900,80" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
        <path d="M0,120 Q150,70 300,120 T600,120 T900,120" fill="none" stroke={color} strokeWidth="2" opacity="0.25" />
        <path d="M0,160 Q150,100 300,160 T600,160 T900,160" fill="none" stroke={color} strokeWidth="1.8" opacity="0.2" />
        <ellipse cx="200" cy="100" rx="80" ry="50" fill="none" stroke={color} strokeWidth="1.5" opacity="0.2" />
        <ellipse cx="500" cy="140" rx="100" ry="60" fill="none" stroke={color} strokeWidth="1.5" opacity="0.18" />
    </svg>
);

const DiagonalPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.09]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`diag-${id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                <rect x="0" y="0" width="20" height="40" fill={color} fillOpacity="0.15" />
                <rect x="20" y="0" width="2" height="40" fill={color} fillOpacity="0.3" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#diag-${id})`} />
    </svg>
);

const StarburstPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id={`starburst-${id}`}>
                <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
        </defs>
        <g transform="translate(200, 100)">
            {[...Array(12)].map((_, i) => (
                <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={Math.cos((i * 30 * Math.PI) / 180) * 150}
                    y2={Math.sin((i * 30 * Math.PI) / 180) * 150}
                    stroke={color}
                    strokeWidth="2"
                    opacity="0.2"
                />
            ))}
            <circle cx="0" cy="0" r="80" fill={`url(#starburst-${id})`} />
        </g>
        <g transform="translate(700, 150)">
            {[...Array(12)].map((_, i) => (
                <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={Math.cos((i * 30 * Math.PI) / 180) * 120}
                    y2={Math.sin((i * 30 * Math.PI) / 180) * 120}
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.15"
                />
            ))}
            <circle cx="0" cy="0" r="60" fill={`url(#starburst-${id})`} />
        </g>
    </svg>
);

const BubblePattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.11]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id={`bubble-blur-${id}`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
        </defs>
        <circle cx="10%" cy="20%" r="60" fill={color} fillOpacity="0.15" filter={`url(#bubble-blur-${id})`} />
        <circle cx="25%" cy="60%" r="80" fill={color} fillOpacity="0.12" filter={`url(#bubble-blur-${id})`} />
        <circle cx="70%" cy="30%" r="90" fill={color} fillOpacity="0.18" filter={`url(#bubble-blur-${id})`} />
        <circle cx="85%" cy="75%" r="70" fill={color} fillOpacity="0.14" filter={`url(#bubble-blur-${id})`} />
        <circle cx="50%" cy="85%" r="50" fill={color} fillOpacity="0.1" filter={`url(#bubble-blur-${id})`} />
        <circle cx="90%" cy="15%" r="40" fill={color} fillOpacity="0.16" filter={`url(#bubble-blur-${id})`} />
    </svg>
);

export function FolderBanner({ folder, onEdit, canManage }: FolderBannerProps) {
    // Generate a deterministic pattern based on folder ID
    const bannerConfig = useMemo(() => {
        if (!folder?.id) return UI_CONFIG.folderBanners.patterns[0];

        // Simple hash function
        const hash = folder.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const patternIndex = hash % UI_CONFIG.folderBanners.patterns.length;

        return UI_CONFIG.folderBanners.patterns[patternIndex];
    }, [folder?.id]);

    const renderPattern = () => {
        if (!folder?.id) return null;

        const patternProps = { id: folder.id, color: 'currentColor' };

        switch (bannerConfig.pattern) {
            case 'mesh':
                return <MeshPattern {...patternProps} />;
            case 'geometric':
                return <GeometricPattern {...patternProps} />;
            case 'dots':
                return <DotsPattern {...patternProps} />;
            case 'waves':
                return <WavesPattern {...patternProps} />;
            case 'lines':
                return <LinesPattern {...patternProps} />;
            case 'grid':
                return <GridPattern {...patternProps} />;
            case 'circles':
                return <CirclesPattern {...patternProps} />;
            case 'hexagon':
                return <HexagonPattern {...patternProps} />;
            case 'topography':
                return <TopographyPattern {...patternProps} />;
            case 'diagonal':
                return <DiagonalPattern {...patternProps} />;
            case 'starburst':
                return <StarburstPattern {...patternProps} />;
            case 'bubble':
                return <BubblePattern {...patternProps} />;
            default:
                return <MeshPattern {...patternProps} />;
        }
    };

    if (!folder) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                "relative w-full rounded-2xl overflow-hidden border border-border/40 mb-8 shadow-sm",
                "bg-gradient-to-br p-6 md:p-8",
                bannerConfig.gradient
            )}
        >
            {/* Dynamic SVG Pattern Background */}
            <div className={cn("pointer-events-none", bannerConfig.accentColor)}>
                {renderPattern()}
            </div>

            {/* Gradient Overlay */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3 max-w-3xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background/40 backdrop-blur-md border border-white/10 shadow-sm">
                            <Folder className={cn("w-6 h-6", bannerConfig.accentColor)} />
                        </div>
                        <Badge variant="secondary" className="bg-background/40 backdrop-blur-md border-white/10">
                            Carpeta
                        </Badge>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground bg-clip-text">
                        {folder.title}
                    </h1>

                    {folder.description && (
                        <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                            {folder.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                        {folder.uploaderName && (
                            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1 rounded-full border border-white/5">
                                <User className="h-3.5 w-3.5" />
                                <span className="font-medium">{folder.uploaderName}</span>
                            </div>
                        )}
                        {folder.uploadDate && (
                            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1 rounded-full border border-white/5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Creado el {new Date(folder.uploadDate).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {canManage && (
                    <Button
                        onClick={onEdit}
                        variant="secondary"
                        className="shrink-0 flex items-center gap-2 shadow-sm hover:shadow-md transition-all bg-background/60 hover:bg-background/80 backdrop-blur-sm border border-white/10"
                    >
                        <Settings2 className="h-4 w-4" />
                        <span>Editar Carpeta</span>
                    </Button>
                )}
            </div>
        </motion.div>
    );
}