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
    'sm': 'w-5 h-5',
    'default': 'w-6 h-6', // Increased default size
    'lg': 'w-7 h-7',
    'xl': 'w-8 h-8',
  };
  
  return (
    <Icon
      className={cn(
        "shrink-0", // Prevent icon from shrinking
        sizeClasses[size],
        "transition-colors duration-200",
        isActive ? 'text-primary' : 'text-muted-foreground group-hover/menu-item:text-foreground',
        className
      )}
      {...props}
    />
  );
};
