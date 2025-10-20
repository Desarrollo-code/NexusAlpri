// src/components/analytics/animated-globe.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';

export function AnimatedGlobe() {
  const globeRadius = 45;
  const connections = [
    { start: { lat: 34.0522, lon: -118.2437 }, end: { lat: 51.5074, lon: -0.1278 } }, // LA to London
    { start: { lat: 40.7128, lon: -74.0060 }, end: { lat: 35.6895, lon: 139.6917 } }, // NYC to Tokyo
    { start: { lat: -33.8688, lon: 151.2093 }, end: { lat: 19.4326, lon: -99.1332 } }, // Sydney to Mexico City
    { start: { lat: 55.7558, lon: 37.6173 }, end: { lat: -23.5505, lon: -46.6333 } }, // Moscow to Sao Paulo
    { start: { lat: 39.9042, lon: 116.4074 }, end: { lat: 28.6139, lon: 77.2090 } }, // Beijing to New Delhi
  ];

  const latLonToXyz = (lat: number, lon: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return { x: x + 50, y: y + 50, z: z + 50 }; // Center in 100x100 box
  };

  return (
    <div className="w-48 h-48">
      <motion.svg
        viewBox="0 0 100 100"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        {/* Globe Sphere */}
        <defs>
            <radialGradient id="globe-gradient" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="hsl(var(--primary) / 0.5)" />
                <stop offset="100%" stopColor="hsl(var(--primary) / 0.2)" />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r={globeRadius} fill="url(#globe-gradient)" stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.5" />

        {/* Meridians and Parallels */}
        {[...Array(6)].map((_, i) => (
          <ellipse
            key={`meridian-${i}`}
            cx="50"
            cy="50"
            rx={globeRadius * Math.sin((i * 30 * Math.PI) / 180)}
            ry={globeRadius}
            fill="none"
            stroke="hsl(var(--primary) / 0.2)"
            strokeWidth="0.3"
            transform={`rotate(${i * 30}, 50, 50)`}
          />
        ))}
        {[...Array(5)].map((_, i) => (
          <ellipse
            key={`parallel-${i}`}
            cx="50"
            cy="50"
            rx={globeRadius}
            ry={globeRadius * Math.abs(Math.cos((i * 30 * Math.PI) / 180))}
            fill="none"
            stroke="hsl(var(--primary) / 0.2)"
            strokeWidth="0.3"
          />
        ))}
        
        {/* Connections and Pulses */}
        {connections.map((conn, i) => {
            const startPoint = latLonToXyz(conn.start.lat, conn.start.lon, globeRadius);
            const endPoint = latLonToXyz(conn.end.lat, conn.end.lon, globeRadius);
            
            const controlPoint = {
                x: (startPoint.x + endPoint.x) / 2 + (startPoint.y - endPoint.y) * 0.4,
                y: (startPoint.y + endPoint.y) / 2 + (endPoint.x - startPoint.x) * 0.4,
            };
            
            const pathData = `M ${startPoint.x} ${startPoint.y} Q ${controlPoint.x} ${controlPoint.y} ${endPoint.x} ${endPoint.y}`;

            return (
              <g key={i}>
                <motion.path
                  d={pathData}
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="0.5"
                  strokeDasharray="1 2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
                />
                <motion.circle
                  cx={startPoint.x}
                  cy={startPoint.y}
                  r="1.5"
                  fill="hsl(var(--accent))"
                  style={{ animation: 'pulse 2s infinite', animationDelay: `${i * 0.8}s` }}
                />
              </g>
            );
        })}
      </motion.svg>
    </div>
  );
}
