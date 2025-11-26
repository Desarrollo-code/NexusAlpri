// src/components/analytics/metric-card.tsx
'use client';
import { Card } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";
import React from "react";

const GRADIENT_CLASSES = {
    'bg-gradient-blue': 'from-blue-400 to-blue-500',
    'bg-gradient-green': 'from-green-400 to-green-500',
    'bg-gradient-purple': 'from-purple-400 to-purple-500',
    'bg-gradient-pink': 'from-pink-400 to-pink-500',
    'bg-gradient-orange': 'from-orange-400 to-orange-500',
};

export const MetricCard = ({ title, value, icon: Icon, description, suffix = '', index = 0, onClick, gradient }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    suffix?: string; 
    index?: number;
    onClick?: () => void;
    gradient?: keyof typeof GRADIENT_CLASSES;
}) => {
    const animatedValue = useAnimatedCounter(value, 0, 1000);
    const colorVar = `var(--chart-${(index % 5) + 1})`;
    
    // El texto ahora es siempre oscuro (negro) para un mejor contraste.
    const textColor = 'hsl(var(--card-foreground))';
    const bgColor = `hsl(${colorVar})`;

    return (
        <Card 
            onClick={onClick} 
            className={cn(
                "relative text-card-foreground p-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] rounded-2xl h-28 overflow-hidden border-2",
                onClick && "cursor-pointer"
            )}
            style={{ 
                backgroundColor: `hsl(${colorVar} / 0.1)`,
                borderColor: `hsl(${colorVar} / 0.3)`
            }}
        >
            <div className="flex justify-between items-start z-10">
                <p className="text-sm font-semibold" style={{ color: textColor }}>{title}</p>
                 <div className="h-8 w-8 flex items-center justify-center rounded-full" style={{ backgroundColor: `hsl(${colorVar} / 0.15)`}}>
                    <Icon className="h-5 w-5" style={{ color: `hsl(${colorVar})` }} />
                </div>
            </div>
            
            <div className="z-10 text-left">
                <p 
                    className="text-3xl font-bold"
                    style={{ 
                        color: textColor,
                    }}
                >
                    {animatedValue}{suffix}
                </p>
                 {description && <p className="text-xs" style={{ color: textColor, opacity: 0.8 }}>{description}</p>}
            </div>
        </Card>
    );
};
