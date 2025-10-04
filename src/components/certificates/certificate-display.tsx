// src/components/certificates/certificate-display.tsx
'use client';
import React from 'react';
import type { CertificateTemplate, Course, User } from '@prisma/client';
import Image from 'next/image';
import { fontMap } from '@/lib/fonts';

interface CertificateDisplayProps {
  template: CertificateTemplate;
  studentName: string;
  courseName: string;
  completionDate: Date;
  score?: number | null;
}

const parsePosition = (jsonPos: any, defaults: any) => {
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

export function CertificateDisplay({
  template,
  studentName,
  courseName,
  completionDate,
  score
}: CertificateDisplayProps) {
  if (!template.backgroundImageUrl) {
    return <div className="p-8 text-center">Falta la imagen de fondo para esta plantilla.</div>;
  }

  const nameStyle = parsePosition(template.studentNamePosition, { x: 50, y: 45, fontSize: 48, fontWeight: 'bold', textAlign: 'center' });
  const courseStyle = parsePosition(template.courseNamePosition, { x: 50, y: 60, fontSize: 24, fontWeight: 'normal', textAlign: 'center' });
  const dateStyle = parsePosition(template.datePosition, { x: 50, y: 75, fontSize: 18, fontWeight: 'normal', textAlign: 'center' });
  const scoreStyle = template.scorePosition && score !== undefined && score !== null ? parsePosition(template.scorePosition, { x: 80, y: 85, fontSize: 20, fontWeight: 'bold', textAlign: 'center' }) : null;

  // Define los estilos de fuente
  const headlineFont = (fontMap[template.fontFamilyHeadline || 'Space Grotesk'] as any)?.style.fontFamily || 'serif';
  const bodyFont = (fontMap[template.fontFamilyBody || 'Inter'] as any)?.style.fontFamily || 'sans-serif';
  
  return (
    <div className="relative w-full aspect-[1.414] bg-muted/30 print:shadow-none print:border-0" id="certificate-to-print">
      <Image
        src={template.backgroundImageUrl}
        alt={template.name}
        fill
        className="object-contain"
        quality={100}
        priority
      />
      <div
        className="absolute w-full"
        style={{ color: template.textColor || '#000000', fontFamily: headlineFont, ...nameStyle }}
      >
        {studentName}
      </div>
      <div
        className="absolute w-full"
        style={{ color: template.textColor || '#000000', fontFamily: bodyFont, ...courseStyle }}
      >
        Por completar exitosamente el curso
        <br />
        <span style={{ fontFamily: headlineFont }}>"{courseName}"</span>
      </div>
      <div
        className="absolute w-full"
        style={{ color: template.textColor || '#000000', fontFamily: bodyFont, ...dateStyle }}
      >
        Completado el {new Date(completionDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      {scoreStyle && (
        <div
          className="absolute"
          style={{ color: template.textColor || '#000000', fontFamily: bodyFont, ...scoreStyle }}
        >
          Calificación: {score}%
        </div>
      )}
    </div>
  );
}
