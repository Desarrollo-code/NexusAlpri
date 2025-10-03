
// src/components/certificates/certificate-preview.tsx
'use client';
import React, { CSSProperties } from 'react';
import type { CertificateTemplate } from '@prisma/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { fontMap } from '@/lib/fonts';

interface CertificatePreviewProps {
    template: Partial<CertificateTemplate>;
    studentName?: string;
    courseName?: string;
    completionDate?: Date;
    score?: number;
}

const parsePosition = (jsonPos: any, defaults: any): CSSProperties => {
  const pos = typeof jsonPos === 'object' && jsonPos !== null ? jsonPos : defaults;
  return {
    left: `${pos.x || defaults.x}%`,
    top: `${pos.y || defaults.y}%`,
    transform: 'translate(-50%, -50%)',
    fontSize: `${pos.fontSize || defaults.fontSize}px`,
    fontWeight: pos.fontWeight || defaults.fontWeight,
    textAlign: pos.textAlign || defaults.textAlign,
  };
};

export function CertificatePreview({
    template,
    studentName = "Nombre del Estudiante",
    courseName = "Nombre del Curso Completado",
    completionDate = new Date(),
    score
}: CertificatePreviewProps) {
    if (!template.backgroundImageUrl) {
        return <div className="text-center p-8">No hay imagen de fondo para esta plantilla.</div>;
    }

    const nameStyle = parsePosition(template.studentNamePosition, { x: 50, y: 45, fontSize: 48, fontWeight: 'bold', textAlign: 'center' });
    const courseStyle = parsePosition(template.courseNamePosition, { x: 50, y: 60, fontSize: 24, fontWeight: 'normal', textAlign: 'center' });
    const dateStyle = parsePosition(template.datePosition, { x: 50, y: 75, fontSize: 18, fontWeight: 'normal', textAlign: 'center' });
    const scoreStyle = template.scorePosition ? parsePosition(template.scorePosition, { x: 80, y: 85, fontSize: 20, fontWeight: 'bold', textAlign: 'center' }) : null;

    return (
        <div className="relative w-full aspect-[1.414] bg-muted/30">
            <Image
                src={template.backgroundImageUrl}
                alt={template.name || 'Fondo del certificado'}
                fill
                className="object-contain"
                quality={100}
            />
            <div 
                className="absolute text-center w-full"
                style={{
                    color: template.textColor || '#000000',
                    fontFamily: (fontMap['Space Grotesk'] as any)?.style.fontFamily || 'serif',
                    ...nameStyle
                }}
            >
                {studentName}
            </div>
            <div 
                className="absolute text-center w-full"
                style={{
                    color: template.textColor || '#000000',
                    fontFamily: (fontMap['Inter'] as any)?.style.fontFamily || 'sans-serif',
                    ...courseStyle
                }}
            >
                {courseName}
            </div>
            <div 
                className="absolute text-center w-full"
                style={{
                    color: template.textColor || '#000000',
                    fontFamily: (fontMap['Inter'] as any)?.style.fontFamily || 'sans-serif',
                    ...dateStyle
                }}
            >
                Completado el {completionDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {score !== undefined && scoreStyle && (
                 <div
                    className="absolute text-center"
                    style={{
                        color: template.textColor || '#000000',
                        fontFamily: (fontMap['Inter'] as any)?.style.fontFamily || 'sans-serif',
                        ...scoreStyle
                    }}
                 >
                    Calificación: {score}%
                 </div>
            )}
        </div>
    );
}
