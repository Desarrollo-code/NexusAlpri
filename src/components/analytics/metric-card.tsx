// src/components/analytics/metric-card.tsx
'use client';
import { Card } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn, getContrastingTextColor } from "@/lib/utils";
import React from "react";

export const MetricCard = ({ title, value, icon: Icon, description, suffix = '', index = 0, onClick }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    suffix?: string; 
    index?: number;
    onClick?: () => void;
}) => {
    const animatedValue = useAnimatedCounter(value, 0, 1000);
    const colorVar = `--chart-${(index % 5) + 1}`;
    
    // Este es un truco para leer el valor de la variable CSS en JS
    const [bgColor, setBgColor] = React.useState('hsl(var(--primary))');
    const cardRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (cardRef.current) {
            const color = getComputedStyle(cardRef.current).getPropertyValue(colorVar);
            if (color) {
                setBgColor(`hsl(${color.trim()})`);
            }
        }
    }, [colorVar]);
    
    const textColor = getContrastingTextColor(bgColor);

    return (
        <Card 
            ref={cardRef}
            onClick={onClick} 
            className={cn(
                "relative text-white p-4 flex flex-col justify-between transition-transform duration-300 hover:scale-[1.03] rounded-2xl h-28 overflow-hidden",
                onClick && "cursor-pointer"
            )}
            style={{ backgroundColor: `hsl(var(${colorVar}))` }}
        >
            <div className="absolute -right-4 -top-2 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-white/5" />

            <div className="flex justify-between items-start z-10">
                <p className="text-sm font-medium" style={{ color: textColor }}>{title}</p>
                 <div className="h-8 w-8 flex items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)'}}>
                    <Icon className="h-5 w-5" style={{ color: textColor }} />
                </div>
            </div>
            
            <div className="z-10 text-left">
                <p 
                    className="text-3xl font-bold"
                    style={{ 
                        color: textColor,
                        textShadow: '0px 1px 3px rgba(0,0,0,0.1)' 
                    }}
                >
                    {animatedValue}{suffix}
                </p>
                 {description && <p className="text-xs" style={{ color: textColor, opacity: 0.8 }}>{description}</p>}
            </div>
        </Card>
    );
};
