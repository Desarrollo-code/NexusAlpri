
// src/components/ui/download-button.tsx
'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import { Input } from './input';

interface DownloadButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  url: string;
  resourceId: string;
  hasPin: boolean;
  text?: string;
  onDownloadSuccess?: () => void; // Nuevo callback
}

export const DownloadButton = React.forwardRef<HTMLButtonElement, DownloadButtonProps>(
  ({ className, text = "Descargar", url, resourceId, hasPin, onDownloadSuccess, ...props }, ref) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();

        if (hasPin) {
            let pin = prompt("Este recurso está protegido. Por favor, ingresa el PIN para descargarlo:");
            if (pin === null) return; // User cancelled
            
            setIsLoading(true);
            try {
                const response = await fetch(`/api/resources/${resourceId}/verify-pin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'PIN inválido');
                
                triggerDownload(data.url);
                onDownloadSuccess?.(); // Llamar al callback en caso de éxito
            } catch (err) {
                toast({ title: 'Error de PIN', description: (err as Error).message, variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        } else {
            triggerDownload(url);
            onDownloadSuccess?.(); // Llamar al callback en caso de éxito
        }
    };
    
    const triggerDownload = (downloadUrl: string) => {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', '');
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
      <Button ref={ref} className={cn(className)} onClick={handleDownload} disabled={isLoading} {...props}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {isLoading ? 'Verificando...' : text}
      </Button>
    );
  }
);

DownloadButton.displayName = 'DownloadButton';
