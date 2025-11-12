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
          <BadgeCheck
            className={cn("h-5 w-5 text-accent drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)]", className)}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Cuenta de Administrador</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
