// src/components/ui/gradient-icon.tsx
'use client';

import { cn } from "@/lib/utils";
import { type LucideProps } from "lucide-react";
import React from 'react';

interface GradientIconProps extends LucideProps {
  icon: React.ComponentType<LucideProps> | React.ElementType; // Accept both Lucide and other components
  size?: 'default' | 'sm' | 'lg' | 'xl';
  isActive?: boolean;
}

export const GradientIcon = ({
  icon: Icon,
  size = 'default',
  className,
  isActive = false,
  ...props
}: GradientIconProps) => {

  const sizeClasses = {
    'sm': 'w-4 h-4',
    'default': 'w-5 h-5',
    'lg': 'w-6 h-6',
    'xl': 'w-7 h-7',
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {isActive && (
        <div className="absolute inset-0 bg-primary/40 blur-[8px] rounded-full scale-110" />
      )}
      <Icon
        className={cn(
          sizeClasses[size],
          "block mx-auto",
          className,
          isActive ? "text-primary relative z-10 drop-shadow-[0_0_5px_rgba(var(--primary),0.8)]" : "text-sidebar-muted-foreground"
        )}
        strokeWidth={isActive ? 2.5 : 2}
        {...props}
      />
    </div>
  );
};
