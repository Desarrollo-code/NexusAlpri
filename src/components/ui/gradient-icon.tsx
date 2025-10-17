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
    <Icon 
      className={cn(sizeClasses[size], className)}
      strokeWidth={isActive ? 2.5 : 2}
      {...props}
    />
  );
};
