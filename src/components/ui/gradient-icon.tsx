
'use client';

import { cn } from "@/lib/utils";
import { type LucideProps } from "lucide-react";

interface GradientIconProps extends LucideProps {
  icon: React.ComponentType<LucideProps>;
  size?: 'default' | 'sm' | 'lg' | 'xl';
  isActive?: boolean;
  color?: string; // Propiedad de color personalizada
}

export const GradientIcon = ({ 
  icon: Icon, 
  size = 'default', 
  className,
  isActive = false,
  color, // Recibir el color
  ...props 
}: GradientIconProps) => {

  const sizeClasses = {
    'sm': 'w-5 h-5',
    'default': 'w-6 h-6', // Increased default size
    'lg': 'w-7 h-7',
    'xl': 'w-8 h-8',
  };
  
  // Determinar el color final del icono
  const iconColor = color 
    ? color // Si se proporciona un color personalizado, usarlo
    : isActive 
      ? 'hsl(var(--sidebar-foreground))' 
      : 'hsl(var(--sidebar-muted-foreground))';

  return (
    <Icon
      className={cn(
        "shrink-0", // Prevent icon from shrinking
        sizeClasses[size],
        "transition-colors duration-200",
        !color && "group-hover/menu-item:text-sidebar-foreground",
        className
      )}
      style={{ color: iconColor }}
      {...props}
    />
  );
};
