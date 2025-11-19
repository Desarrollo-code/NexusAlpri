// src/components/certificates/certificate-interactable-preview.tsx
'use client';
import React, { useRef, useState } from 'react';
import { DndContext, useDraggable } from '@dnd-kit/core';
import type { CertificateTemplate } from '@/types';
import Image from 'next/image';
import { fontMap } from '@/lib/fonts';

interface InteractableElementProps {
  id: string;
  position: { x: number, y: number, fontSize: number, fontWeight: string, textAlign: 'center' | 'left' | 'right' };
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
  fontFamily: any;
  color: string;
  isLogo?: boolean;
}

const DraggableElement = ({ id, position, children, containerRef, fontFamily, color, isLogo = false }: InteractableElementProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: 'translate(-50%, -50%)',
    cursor: 'move',
    fontFamily: fontFamily,
    color: color,
  };
  
  if (isLogo) {
      style.width = `${position.width}%`;
      style.height = `${position.height}%`;
      style.transform = 'translate(0, 0)'; // Logos se posicionan desde la esquina superior izquierda
  } else {
      style.fontSize = `${position.fontSize}px`;
      style.fontWeight = position.fontWeight;
      style.textAlign = position.textAlign;
      style.width = '100%';
      style.padding = '0 20px';
  }

  if (transform) {
    style.transform = isLogo 
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : `translate3d(${transform.x}px, ${transform.y}px, 0) translate(-50%, -50%)`;
  }


  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};


interface CertificateInteractablePreviewProps {
  template: Partial<CertificateTemplate>;
  positions: any;
  onPositionsChange: (positions: any) => void;
  showScore: boolean;
}

export function CertificateInteractablePreview({ template, positions, onPositionsChange, showScore }: CertificateInteractablePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: any) => {
    const { active, delta } = event;
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const dxPercent = (delta.x / containerWidth) * 100;
    const dyPercent = (delta.y / containerHeight) * 100;

    onPositionsChange((prev: any) => {
        const newPos = {
            ...prev[active.id],
            x: prev[active.id].x + dxPercent,
            y: prev[active.id].y + dyPercent
        };
        return {
            ...prev,
            [active.id]: newPos
        };
    });
  };

  const headlineFont = (fontMap[template.fontFamilyHeadline || 'Space Grotesk'] as any)?.style.fontFamily || 'serif';
  const bodyFont = (fontMap[template.fontFamilyBody || 'Inter'] as any)?.style.fontFamily || 'sans-serif';

  return (
    <div ref={containerRef} className="relative w-full aspect-[1.414] bg-muted/30">
        {template.backgroundImageUrl && (
            <Image
                src={template.backgroundImageUrl}
                alt={template.name || 'Fondo del certificado'}
                fill
                className="object-contain"
                quality={100}
                priority
            />
        )}
        {template.watermarkUrl && (
            <div className="absolute inset-0 pointer-events-none" style={{ opacity: template.watermarkOpacity || 0.1 }}>
                <Image src={template.watermarkUrl} alt="Marca de agua" layout="fill" className="object-cover" />
            </div>
        )}
        <DndContext onDragEnd={handleDragEnd}>
             {template.logoUrl && (
                <DraggableElement 
                    id="logo"
                    position={positions.logo}
                    containerRef={containerRef}
                    fontFamily="" color="" isLogo={true}
                >
                    <div className="relative w-full h-full border-2 border-dashed border-primary/50">
                        <Image src={template.logoUrl} alt="Logo" fill className="object-contain p-1"/>
                    </div>
                </DraggableElement>
             )}
            <DraggableElement 
                id="studentName" 
                position={positions.studentName} 
                containerRef={containerRef}
                fontFamily={headlineFont}
                color={template.textColor || '#000000'}
            >
                Nombre del Estudiante
            </DraggableElement>
            <DraggableElement 
                id="courseName" 
                position={positions.courseName} 
                containerRef={containerRef}
                fontFamily={bodyFont}
                color={template.textColor || '#000000'}
            >
                Por completar el curso de "Nombre del Curso"
            </DraggableElement>
            <DraggableElement 
                id="date" 
                position={positions.date} 
                containerRef={containerRef}
                fontFamily={bodyFont}
                color={template.textColor || '#000000'}
            >
                Completado el 1 de Enero de 2025
            </DraggableElement>
            <DraggableElement
                id="footerText"
                position={positions.footerText}
                containerRef={containerRef}
                fontFamily={bodyFont}
                color={template.textColor || '#000000'}
            >
                {template.footerText || "Certificado Interno de Capacitación"}
            </DraggableElement>
             {showScore && (
                 <DraggableElement 
                    id="score" 
                    position={positions.score} 
                    containerRef={containerRef}
                    fontFamily={bodyFont}
                    color={template.textColor || '#000000'}
                >
                    Calificación: 95%
                </DraggableElement>
             )}
        </DndContext>
    </div>
  );
}
