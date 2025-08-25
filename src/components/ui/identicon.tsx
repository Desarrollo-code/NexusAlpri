// src/components/ui/identicon.tsx
'use client';
import React from 'react';

const PALETTES = [
    ["#fde047", "#facc15", "#eab308"], // Yellow
    ["#f87171", "#ef4444", "#dc2626"], // Red
    ["#a7f3d0", "#4ade80", "#22c55e"], // Green
    ["#fca5a5", "#f87171", "#ef4444"], // Red Light
    ["#93c5fd", "#60a5fa", "#3b82f6"], // Blue
    ["#a5b4fc", "#818cf8", "#6366f1"], // Indigo
    ["#d8b4fe", "#c084fc", "#a855f7"], // Purple
    ["#f9a8d4", "#f472b6", "#ec4899"], // Pink
    ["#6ee7b7", "#34d399", "#10b981"], // Emerald
    ["#5eead4", "#2dd4bf", "#14b8a6"], // Teal
];

const stringToHash = (str: string): number => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

interface IdenticonProps {
    userId: string;
    size?: number;
}

export const Identicon: React.FC<IdenticonProps> = ({ userId, size = 128 }) => {
    const hash = stringToHash(userId);
    const palette = PALETTES[hash % PALETTES.length];

    const [color1, color2, color3] = palette;
    
    // Generate patterns based on hash
    const outerRingDash = 5 + (hash % 5); // 5-9
    const innerRingDash = 3 + (hash % 4); // 3-6
    const personTranslate = -2 + (hash % 5);

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g>
                <circle cx="50" cy="50" r="48" fill="none" />
                
                {/* Background Circle */}
                <circle cx="50" cy="50" r="34" fill={color1} />
                
                {/* Decorative Rings */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={color2}
                    strokeWidth="4"
                    strokeDasharray={`${outerRingDash}, 5`}
                    transform={`rotate(${hash % 360} 50 50)`}
                />
                <circle
                    cx="50"
                    cy="50"
                    r="39"
                    fill="none"
                    stroke={color3}
                    strokeWidth="1.5"
                    strokeDasharray={`${innerRingDash}, 3`}
                     transform={`rotate(-${(hash + 180) % 360} 50 50)`}
                />
                
                {/* Person Silhouette */}
                <g fill={color3} transform={`translate(0, ${personTranslate})`}>
                    <circle cx="50" cy="40" r="9" />
                    <path d="M50 51 a18 18 0 0 1-18 18 h36 a18 18 0 0 1-18-18 z" />
                </g>
            </g>
        </svg>
    );
};
