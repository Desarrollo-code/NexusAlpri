// src/components/ui/confetti.tsx
'use client';

import React, { useEffect, useState } from 'react';

const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef"];

const createConfettiPiece = () => {
  const x = Math.random() * 100; // %
  const y = -10 - Math.random() * 20; // start off-screen
  const rotation = Math.random() * 360;
  const scale = 0.5 + Math.random();
  const speed = 0.5 + Math.random();
  const color = colors[Math.floor(Math.random() * colors.length)];
  const delay = Math.random() * 2; // seconds
  const sway = Math.random() * 2 - 1; // -1 to 1

  return { x, y, rotation, scale, speed, color, delay, sway };
};

export const Confetti = () => {
    const [pieces, setPieces] = useState<any[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        setPieces(Array.from({ length: 150 }, createConfettiPiece));

        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 6000); // confetti lasts for 6 seconds

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map((piece, index) => (
                <div
                    key={index}
                    className="absolute"
                    style={{
                        left: `${piece.x}%`,
                        top: '-10px', // start from top
                        width: '8px',
                        height: '16px',
                        backgroundColor: piece.color,
                        transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
                        animation: `fall ${4 / piece.speed}s linear ${piece.delay}s forwards, sway ${1 / piece.speed}s ease-in-out ${piece.delay}s infinite`,
                        animationName: 'fall, sway',
                        '--sway-amount': `${piece.sway * 30}px`,
                    } as React.CSSProperties}
                />
            ))}
            <style jsx>{`
                @keyframes fall {
                    to {
                        transform: translateY(110vh) rotate(720deg) scale(var(--scale));
                    }
                }
                 @keyframes sway {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    50% {
                        transform: translateX(var(--sway-amount));
                    }
                }
            `}</style>
        </div>
    );
};
