// src/components/security/world-map.tsx
'use client';
import React from 'react';

// Simplified world map paths. In a real app, you'd use a more detailed SVG or a library.
const worldPaths = {
    // This is a placeholder. A real implementation would have complex SVG path data.
    northAmerica: "M10 80 L80 10 L160 50 L120 120 Z",
    southAmerica: "M100 130 L120 180 L80 190 Z",
    europe: "M180 50 L250 40 L240 90 Z",
    asia: "M260 40 L380 60 L350 140 Z",
    africa: "M170 100 L230 180 L190 200 Z",
    oceania: "M340 160 L380 180 L360 200 Z",
};

const countryCoordinates: Record<string, { x: number, y: number, code?: string }> = {
    // These are very approximate coordinates on a 400x220 map.
    "United States": { x: 80, y: 60, code: 'US' },
    "Colombia": { x: 115, y: 110, code: 'CO' },
    "Spain": { x: 195, y: 70, code: 'ES' },
    "Germany": { x: 215, y: 60, code: 'DE' },
    "China": { x: 320, y: 75, code: 'CN' },
    "India": { x: 290, y: 90, code: 'IN' },
    "Brazil": { x: 140, y: 130, code: 'BR' },
    "Australia": { x: 360, y: 150, code: 'AU' },
    "South Africa": { x: 230, y: 155, code: 'ZA' },
    "Russia": { x: 280, y: 50, code: 'RU' },
    "Desconocido": { x: 200, y: 110 },
};

interface WorldMapProps {
    data: { name: string; count: number }[];
}

export const WorldMap = ({ data }: WorldMapProps) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    return (
        <svg viewBox="0 0 400 220" className="w-full h-full">
            <path 
                d="M1,1 C399,1 399,219 1,219" // Dummy path data
                fill="#FFF"
                fillOpacity="0.1"
                stroke="#FFF"
                strokeOpacity="0.2"
                strokeWidth="0.5"
            />
             {/* Simplified Continents */}
            <g fill="#FFF" fillOpacity="0.3">
                <path d="M52 82c-2-12-19-24-12-38 6-12 29-16 41-12 11 3 13 14 17 21 11 19-2 36-16 35s-26-2-30-6z" />
                <path d="M125 183c-5-12-14-25-10-39 4-15 22-19 36-13s14 26 15 35c2 14-8 27-21 27s-16-7-20-10z" />
                <path d="M188 67c-13-17-10-34 4-43 14-9 36-3 44 9s-2 38-16 46-27-3-32-12z" />
                <path d="M225 160c-13-17-10-34 4-43 14-9 36-3 44 9s-2 38-16 46-27-3-32-12z" />
                <path d="M259 87c-5-16 5-32 20-37s33 2 37 18-5 32-20 37-33-2-37-18z" />
                <path d="M336 157c-5-16 5-32 20-37s33 2 37 18-5 32-20 37-33-2-37-18z" />
            </g>

            {data.map(({ name, count }) => {
                const coords = countryCoordinates[name];
                if (!coords) return null;
                const radius = 4 + (count / maxCount) * 12;

                return (
                    <g key={name}>
                        <circle
                            cx={coords.x}
                            cy={coords.y}
                            r={radius}
                            fill="#FFF"
                            fillOpacity="0.8"
                            stroke="#FFF"
                            strokeWidth="1"
                            strokeOpacity="0.9"
                        />
                         <circle
                            cx={coords.x}
                            cy={coords.y}
                            r={radius + 4}
                            fill="#FFF"
                            fillOpacity="0.3"
                        />
                    </g>
                )
            })}
        </svg>
    )
}
