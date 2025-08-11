'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const Cube = ({ size, top, left, animationDuration, animationDelay }: {
  size: number;
  top: string;
  left: string;
  animationDuration: string;
  animationDelay: string;
}) => {
  const faceStyle = `w-[${size}px] h-[${size}px]`;
  return (
    <div
      className="absolute isometric-cube"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        top,
        left,
        animation: `float-1 ${animationDuration} ease-in-out infinite ${animationDelay}`,
      }}
    >
      <div className={cn("face bg-primary/40", faceStyle)} style={{ transform: `rotateY(0deg) translateZ(${size / 2}px)` }} />
      <div className={cn("face bg-accent/40", faceStyle)} style={{ transform: `rotateY(90deg) translateZ(${size / 2}px)` }} />
      <div className={cn("face bg-primary/40", faceStyle)} style={{ transform: `rotateY(180deg) translateZ(${size / 2}px)` }} />
      <div className={cn("face bg-accent/40", faceStyle)} style={{ transform: `rotateY(-90deg) translateZ(${size / 2}px)` }} />
      <div className={cn("face bg-primary/60", faceStyle)} style={{ transform: `rotateX(90deg) translateZ(${size / 2}px)` }} />
      <div className={cn("face bg-accent/60", faceStyle)} style={{ transform: `rotateX(-90deg) translateZ(${size / 2}px)` }} />
    </div>
  );
};

export const IsometricBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      <div className="absolute w-full h-full" style={{ perspective: '1000px' }}>
        {/* Usamos un conjunto de cubos con diferentes tamaños, posiciones y animaciones */}
        <Cube size={60} top="15%" left="10%" animationDuration="12s" animationDelay="0s" />
        <Cube size={40} top="25%" left="80%" animationDuration="15s" animationDelay="-5s" />
        <Cube size={80} top="70%" left="20%" animationDuration="18s" animationDelay="-2s" />
        <Cube size={30} top="85%" left="90%" animationDuration="10s" animationDelay="-8s" />
        <Cube size={50} top="50%" left="50%" animationDuration="14s" animationDelay="-10s" />
         <Cube size={25} top="5%" left="40%" animationDuration="16s" animationDelay="-3s" />
        <Cube size={45} top="60%" left="65%" animationDuration="13s" animationDelay="-7s" />
      </div>
    </div>
  );
};
