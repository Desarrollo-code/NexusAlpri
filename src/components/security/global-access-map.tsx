// src/components/security/global-access-map.tsx
'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { SecurityLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Globe, CheckCircle, XCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

// Carga dinámica del componente del globo para evitar problemas con SSR.
const GlobeGl = dynamic(() => import('react-globe.gl'), { ssr: false });

type AccessPoint = {
    id: string;
    lat: number;
    lng: number;
    ip_address: string;
    success: boolean;
    user: string;
    timestamp: string;
    country: string;
};

interface GlobalAccessMapProps {
    accessPoints: SecurityLog[];
}

export const GlobalAccessMap: React.FC<GlobalAccessMapProps> = ({ accessPoints }) => {
    const globeEl = useRef<any>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 360, height: 360 });
    const [hoveredPoint, setHoveredPoint] = useState<AccessPoint | null>(null);
    
    // Ubicación central de la empresa (ej. Medellín, Colombia)
    const COMPANY_LOCATION = { lat: 6.2442, lng: -75.5812 };

    const pointsData = useMemo(() => {
        return accessPoints
            .filter(log => log.lat != null && log.lng != null)
            .map(log => ({
                id: log.id,
                lat: log.lat!,
                lng: log.lng!,
                ip_address: log.ipAddress || 'Desconocida',
                success: log.event === 'SUCCESSFUL_LOGIN',
                user: log.user?.name || log.emailAttempt || 'Sistema',
                timestamp: log.createdAt,
                country: log.country || 'Desconocido',
            }));
    }, [accessPoints]);
    
    // Creación de datos para los arcos animados
    const arcsData = useMemo(() => {
        return pointsData.map(point => ({
            startLat: point.lat,
            startLng: point.lng,
            endLat: COMPANY_LOCATION.lat,
            endLng: COMPANY_LOCATION.lng,
            color: point.success ? 'rgba(52, 211, 153, 0.6)' : 'rgba(239, 68, 68, 0.6)',
        }));
    }, [pointsData]);


    useEffect(() => {
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.3; // Un poco más rápido
            globeEl.current.controls().enableZoom = true;
        }
    }, []);
    
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        handleResize();
        const resizeObserver = new ResizeObserver(handleResize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        
        return () => {
            if(containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, []);

    const handlePointHover = (point: any) => {
        setHoveredPoint(point);
    };

    const handleZoom = (factor: number) => {
        if (!globeEl.current) return;
        const currentAltitude = globeEl.current.pointOfView().altitude;
        globeEl.current.pointOfView({ altitude: currentAltitude * factor }, 500);
    }
    
    return (
        <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <GlobeGl
                ref={globeEl}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg" // <-- Mapa diurno
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)"
                
                // Propiedades de los Puntos de Acceso
                pointsData={pointsData}
                pointAltitude={0.02} // Ligeramente más elevados
                pointRadius={0.5}   // Un poco más grandes
                pointColor={(point: any) => point.success ? 'rgba(52, 211, 153, 0.9)' : 'rgba(239, 68, 68, 0.9)'}
                onPointHover={handlePointHover}

                // Propiedades de los Arcos Animados
                arcsData={arcsData}
                arcColor={'color'}
                arcDashLength={0.4}
                arcDashGap={0.6}
                arcDashAnimateTime={2500} // Velocidad de la animación del arco
                
                width={dimensions.width}
                height={dimensions.height}
            />

             <div className="absolute bottom-2 right-2 flex flex-col gap-2">
                <Button size="icon" variant="secondary" onClick={() => handleZoom(0.8)}>
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" onClick={() => handleZoom(1.2)}>
                    <ZoomOut className="h-4 w-4" />
                </Button>
            </div>

            {hoveredPoint && (
                <div className="absolute top-2 left-2 pointer-events-none z-10">
                    <Card className="bg-background/80 backdrop-blur-sm max-w-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                               {hoveredPoint.success ? <CheckCircle className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-red-500" />}
                               <span>{hoveredPoint.success ? 'Acceso Exitoso' : 'Fallo de Seguridad'}</span>
                            </CardTitle>
                            <CardDescription>{hoveredPoint.country} - {hoveredPoint.ip_address}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                             <p><strong>Usuario:</strong> {hoveredPoint.user}</p>
                             <p><strong>Hora:</strong> {format(new Date(hoveredPoint.timestamp), 'PPP p', { locale: es })}</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
