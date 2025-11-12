// src/components/ui/verified-badge.tsx
import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import type { UserRole } from '@/types';

interface VerifiedBadgeProps {
  className?: string;
  role: UserRole;
}

export const VerifiedBadge = ({ className, role }: VerifiedBadgeProps) => {
  if (role !== 'ADMINISTRATOR') {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {/* 
            CORRECCIÓN: Se utiliza `fill` para el cuerpo del icono y `color` (que se traduce en `stroke`) 
            para el borde, garantizando contraste en cualquier fondo.
          */}
          <BadgeCheck
            className={cn(
              "h-5 w-5 fill-primary/80 text-foreground drop-shadow-md", 
              className
            )}
            strokeWidth={1.5}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Cuenta de Administrador</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
