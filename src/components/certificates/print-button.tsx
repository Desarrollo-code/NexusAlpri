// src/components/certificates/print-button.tsx
'use client';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import React from 'react';

export const PrintButton = () => {
  return (
    <Button onClick={() => window.print()}>
      <Download className="mr-2 h-4 w-4" />
      Guardar como PDF
    </Button>
  );
};
