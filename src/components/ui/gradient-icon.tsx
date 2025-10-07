// src/components/ui/gradient-icon.tsx
'use client';

import { cn } from "@/lib/utils";
import { type LucideProps } from "lucide-react";
import React from 'react';

interface GradientIconProps extends LucideProps {
  icon: React.ComponentType<LucideProps>;
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
    'sm': 'w-5 h-5',
    'default': 'w-6 h-6',
    'lg': 'w-7 h-7',
    'xl': 'w-8 h-8',
  };

  const gradientId = React.useId();

  return (
    <svg 
        className={cn(sizeClasses[size], "shrink-0", className)}
        fill="none" 
        strokeWidth="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isActive ? (
            <>
              <stop offset="0%" style={{ stopColor: 'hsl(var(--primary-foreground))', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'hsl(var(--primary-foreground))', stopOpacity: 0.8 }} />
            </>
          ) : (
             <>
              <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
            </>
          )}
        </linearGradient>
      </defs>
      <Icon
        stroke={`url(#${gradientId})`}
        {...props}
        className={cn(
            "transition-colors duration-200",
            !isActive && "group-hover/menu-item:stroke-[hsl(var(--primary))]"
        )}
      />
    </svg>
  );
};
