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

// --- Constantes de Estilo Global ---
const PATTERN_CLASS = "absolute inset-0 w-full h-full opacity-[0.35]"; // Opacidad base aumentada
const STROKE_WIDTH_BOLD = "3.5";
const STROKE_WIDTH_THIN = "1.5";

// --- Componentes de Patrones Optimizados ---

const MeshPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className={PATTERN_CLASS} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={`mesh-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                <stop offset="50%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0.1" />
            </linearGradient>
            <filter id={`blur-${id}`}><feGaussianBlur in="SourceGraphic" stdDeviation="3" /></filter>
        </defs>
        <path d="M0,0 Q150,80 300,0 T600,0 T900,0" fill="none" stroke={`url(#mesh-${id})`} strokeWidth={STROKE_WIDTH_BOLD} />
        <circle cx="150" cy="50" r="120" fill={`url(#mesh-${id})`} filter={`url(#blur-${id})`} />
        <circle cx="750" cy="60" r="100" fill={`url(#mesh-${id})`} filter={`url(#blur-${id})`} />
    </svg>
);

const GeometricPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className={PATTERN_CLASS} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`geo-${id}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <polygon points="50,5 95,50 50,95 5,50" fill={color} fillOpacity="0.4" />
                <circle cx="50" cy="50" r="20" fill={color} fillOpacity="0.3" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#geo-${id})`} />
    </svg>
);

const DotsPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.45]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`dots-${id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="3.5" fill={color} fillOpacity="0.8" />
                <circle cx="30" cy="30" r="5" fill={color} fillOpacity="0.6" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${id})`} />
    </svg>
);

const WavesPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className={PATTERN_CLASS} xmlns="http://www.w3.org/2000/svg">
        <path d="M0,50 Q100,15 200,50 T400,50 T600,50 T800,50 T1000,50" fill="none" stroke={color} strokeWidth={STROKE_WIDTH_BOLD} opacity="0.6" />
        <path d="M0,100 Q100,65 200,100 T400,100 T600,100 T800,100 T1000,100" fill="none" stroke={color} strokeWidth="2.5" opacity="0.4" />
        <path d="M0,150 Q100,115 200,150 T400,150 T600,150 T800,150 T1000,150" fill="none" stroke={color} strokeWidth="1.5" opacity="0.2" />
    </svg>
);

const LinesPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.25]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`lines-${id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="40" stroke={color} strokeWidth="3" opacity="0.7" />
                <line x1="20" y1="0" x2="20" y2="40" stroke={color} strokeWidth="1" opacity="0.4" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#lines-${id})`} />
    </svg>
);

const GridPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.2]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`grid-${id}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke={color} strokeWidth="2" opacity="0.6" />
                <circle cx="0" cy="0" r="4" fill={color} fillOpacity="0.5" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
    </svg>
);

const CirclesPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.3]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id={`circle-grad-${id}`}>
                <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
        </defs>
        <circle cx="15%" cy="30%" r="150" fill={`url(#circle-grad-${id})`} />
        <circle cx="85%" cy="25%" r="130" fill={`url(#circle-grad-${id})`} />
        <circle cx="50%" cy="80%" r="180" fill={`url(#circle-grad-${id})`} />
    </svg>
);

const HexagonPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.25]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`hex-${id}`} x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
                <polygon points="50,0 100,25 100,65 50,87 0,65 0,25" fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
                <circle cx="50" cy="43" r="8" fill={color} fillOpacity="0.4" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#hex-${id})`} />
    </svg>
);

const TopographyPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className={PATTERN_CLASS} xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 Q150,40 300,80 T600,80 T900,80" fill="none" stroke={color} strokeWidth="3" opacity="0.5" />
        <ellipse cx="200" cy="100" rx="100" ry="60" fill="none" stroke={color} strokeWidth="2.5" opacity="0.4" />
        <ellipse cx="700" cy="120" rx="120" ry="70" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
    </svg>
);

const DiagonalPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.2]" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`diag-${id}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                <rect x="0" y="0" width="30" height="60" fill={color} fillOpacity="0.25" />
                <rect x="30" y="0" width="5" height="60" fill={color} fillOpacity="0.4" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#diag-${id})`} />
    </svg>
);

const StarburstPattern = ({ id, color }: { id: string; color: string }) => (
    <svg className={PATTERN_CLASS} xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(150, 100)">
            {[...Array(12)].map((_, i) => (
                <line key={i} x1="0" y1="0" x2={Math.cos((i * 30 * Math.PI) / 180) * 200} y2={Math.sin((i * 30 * Math.PI) / 180) * 200} stroke={color} strokeWidth="3" opacity="0.4" />
            ))}
        </g>
        <g transform="translate(850, 120)">
            {[...Array(8)].map((_, i) => (
                <line key={i} x1="0" y1="0" x2={Math.cos((i * 45 * Math.PI) / 180) * 150} y2={Math.sin((i * 45 * Math.PI) / 180) * 150} stroke={color} strokeWidth="2" opacity="0.3" />
            ))}
        </g>
    </svg>
);

const BubblePattern = ({ id, color }: { id: string; color: string }) => (
    <svg className={PATTERN_CLASS} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id={`bubble-blur-${id}`}><feGaussianBlur in="SourceGraphic" stdDeviation="4" /></filter></defs>
        <circle cx="15%" cy="30%" r="90" fill={color} fillOpacity="0.3" filter={`url(#bubble-blur-${id})`} />
        <circle cx="75%" cy="40%" r="110" fill={color} fillOpacity="0.25" filter={`url(#bubble-blur-${id})`} />
        <circle cx="40%" cy="80%" r="70" fill={color} fillOpacity="0.2" filter={`url(#bubble-blur-${id})`} />
    </svg>
);

// --- Componente Principal ---

export function FolderBanner({ folder, onEdit, canManage }: FolderBannerProps) {
    const bannerConfig = useMemo(() => {
        if (!folder?.id) return UI_CONFIG.folderBanners.patterns[0];
        const hash = folder.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const patternIndex = hash % UI_CONFIG.folderBanners.patterns.length;
        return UI_CONFIG.folderBanners.patterns[patternIndex];
    }, [folder?.id]);

    const renderPattern = () => {
        if (!folder?.id) return null;
        const patternProps = { id: folder.id, color: 'currentColor' };

        switch (bannerConfig.pattern) {
            case 'mesh': return <MeshPattern {...patternProps} />;
            case 'geometric': return <GeometricPattern {...patternProps} />;
            case 'dots': return <DotsPattern {...patternProps} />;
            case 'waves': return <WavesPattern {...patternProps} />;
            case 'lines': return <LinesPattern {...patternProps} />;
            case 'grid': return <GridPattern {...patternProps} />;
            case 'circles': return <CirclesPattern {...patternProps} />;
            case 'hexagon': return <HexagonPattern {...patternProps} />;
            case 'topography': return <TopographyPattern {...patternProps} />;
            case 'diagonal': return <DiagonalPattern {...patternProps} />;
            case 'starburst': return <StarburstPattern {...patternProps} />;
            case 'bubble': return <BubblePattern {...patternProps} />;
            default: return <MeshPattern {...patternProps} />;
        }
    };

    if (!folder) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "relative w-full rounded-3xl overflow-hidden border border-border/50 mb-8 shadow-xl",
                "bg-gradient-to-br transition-all duration-700 ease-in-out",
                bannerConfig.gradient,
                "p-8 md:p-12"
            )}
        >
            {/* Capa de color de fondo sólida para reforzar el tema (dinámica) */}
            <div className={cn(
                "absolute inset-0 opacity-15 mix-blend-overlay", 
                bannerConfig.accentColor.replace('text-', 'bg-')
            )} />

            {/* Patrones SVG con color de acento */}
            <div className={cn("absolute inset-0 pointer-events-none", bannerConfig.accentColor)}>
                {renderPattern()}
            </div>

            {/* Overlay para garantizar legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-tr from-background/60 via-background/10 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-5 max-w-4xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-background/70 backdrop-blur-xl border border-white/20 shadow-inner">
                            <Folder className={cn("w-7 h-7", bannerConfig.accentColor)} />
                        </div>
                        <Badge variant="secondary" className="px-4 py-1 bg-background/70 backdrop-blur-md border-white/20 text-foreground font-bold tracking-wide uppercase text-[10px]">
                            Carpeta de Archivos
                        </Badge>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground drop-shadow-sm">
                        {folder.title}
                    </h1>

                    {folder.description && (
                        <p className="text-muted-foreground/90 text-xl leading-relaxed max-w-3xl font-medium">
                            {folder.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-5 pt-4">
                        {folder.uploaderName && (
                            <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10 shadow-sm text-foreground">
                                <User className="h-4 w-4 opacity-70" />
                                <span className="font-bold text-sm">{folder.uploaderName}</span>
                            </div>
                        )}
                        {folder.uploadDate && (
                            <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10 shadow-sm text-foreground">
                                <Calendar className="h-4 w-4 opacity-70" />
                                <span className="text-sm font-medium">Creado: {new Date(folder.uploadDate).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {canManage && (
                    <Button
                        onClick={onEdit}
                        variant="secondary"
                        className="shrink-0 flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all bg-background/90 hover:bg-background backdrop-blur-md border border-white/20 px-8 py-7 rounded-2xl group"
                    >
                        <Settings2 className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="font-bold text-base">Gestionar</span>
                    </Button>
                )}
            </div>
        </motion.div>
    );
}