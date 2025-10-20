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
    const [hoveredPoint, setHoveredPoint] = useState<AccessPoint | null>(null);

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

    useEffect(() => {
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.2;
            globeEl.current.controls().enableZoom = true;
        }
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
        <div className="relative w-full h-full flex items-center justify-center">
            <GlobeGl
                ref={globeEl}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)"
                pointsData={pointsData}
                pointAltitude={0.01}
                pointRadius={0.4}
                pointColor={(point: any) => point.success ? 'rgba(52, 211, 153, 0.8)' : 'rgba(239, 68, 68, 0.8)'}
                onPointHover={handlePointHover}
            />

             <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <Button size="icon" variant="secondary" onClick={() => handleZoom(0.8)}>
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" onClick={() => handleZoom(1.2)}>
                    <ZoomOut className="h-4 w-4" />
                </Button>
            </div>

            {hoveredPoint && (
                <div className="absolute top-4 left-4 pointer-events-none z-10">
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
