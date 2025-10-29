// src/components/security/world-map.tsx
'use client';
import React from 'react';

// Coordinates for various countries to be placed on the 400x220 SVG map.
const countryCoordinates: Record<string, { x: number, y: number, code?: string }> = {
    "United States": { x: 85, y: 75, code: 'US' },
    "Colombia": { x: 118, y: 115, code: 'CO' },
    "Spain": { x: 195, y: 72, code: 'ES' },
    "Germany": { x: 215, y: 60, code: 'DE' },
    "China": { x: 320, y: 78, code: 'CN' },
    "India": { x: 290, y: 90, code: 'IN' },
    "Brazil": { x: 140, y: 135, code: 'BR' },
    "Australia": { x: 365, y: 155, code: 'AU' },
    "South Africa": { x: 230, y: 155, code: 'ZA' },
    "Russia": { x: 290, y: 50, code: 'RU' },
    "Canada": { x: 90, y: 55, code: 'CA' },
    "Mexico": { x: 95, y: 95, code: 'MX' },
    "Argentina": { x: 125, y: 165, code: 'AR' },
    "United Kingdom": { x: 195, y: 58, code: 'GB' },
    "France": { x: 205, y: 65, code: 'FR' },
    "Japan": { x: 360, y: 75, code: 'JP' },
    "Desconocido": { x: 200, y: 110 },
};

interface WorldMapProps {
    data: { name: string; count: number }[];
}

export const WorldMap = ({ data }: WorldMapProps) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    return (
        <svg viewBox="0 0 400 220" className="w-full h-full">
            {/* Simplified World Map SVG Paths */}
            <path 
                d="M1,1 C399,1 399,219 1,219"
                fill="#FFF"
                fillOpacity="0.1"
                stroke="#FFF"
                strokeOpacity="0.2"
                strokeWidth="0.5"
            />
            {/* Detailed Continents */}
            <g fill="#FFF" fillOpacity="0.2" stroke="#FFF" strokeOpacity="0.3" strokeWidth="0.2">
                {/* North America */}
                <path d="M110 28L82 25L37 40L16 80L39 111L72 121L107 104L130 92L134 69L110 28z" />
                {/* South America */}
                <path d="M121 125L111 143L115 162L130 178L145 167L147 141L134 126L121 125z" />
                {/* Africa */}
                <path d="M190 100L185 125L193 158L215 178L236 173L245 145L238 116L218 97L190 100z" />
                {/* Europe */}
                <path d="M205 90L193 72L194 50L216 43L234 57L230 78L215 88L205 90z" />
                {/* Asia */}
                <path d="M239 40L280 28L345 32L378 70L360 110L322 135L265 118L241 80L239 40z" />
                {/* Australia */}
                <path d="M336 157c-5-16 5-32 20-37s33 2 37 18-5 32-20 37-33-2-37-18z" />
            </g>

            {/* Data points */}
            {data.map(({ name, count }) => {
                const coords = countryCoordinates[name];
                if (!coords) return null;
                const radius = 4 + (count / maxCount) * 12;

                return (
                    <g key={name} className="animate-bloom" style={{animationDelay: `${Math.random() * 2}s`}}>
                        <circle
                            cx={coords.x}
                            cy={coords.y}
                            r={radius}
                            fill="#FFF"
                            fillOpacity="0.7"
                            stroke="#FFF"
                            strokeWidth="0.5"
                            strokeOpacity="0.8"
                        />
                         <circle
                            cx={coords.x}
                            cy={coords.y}
                            r={radius + 4}
                            fill="#FFF"
                            fillOpacity="0.2"
                        />
                    </g>
                )
            })}
        </svg>
    )
}
