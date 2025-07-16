
'use client';

import { cn } from "@/lib/utils";
import { type LucideProps } from "lucide-react";

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
    'sm': 'w-4 h-4',
    'default': 'w-5 h-5',
    'lg': 'w-6 h-6',
    'xl': 'w-8 h-8',
  };

  const id = `icon-gradient-${Icon.displayName || Math.random().toString()}`;

  return (
    <svg 
      viewBox="0 0 24 24"
      className={cn(sizeClasses[size], className)}
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <Icon
        stroke={isActive ? 'hsl(var(--primary-foreground))' : `url(#${id})`}
        fill={isActive ? 'hsl(var(--primary-foreground))' : 'none'}
        className="w-full h-full"
        {...props}
      />
    </svg>
  );
};
