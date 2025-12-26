// src/components/analytics/metric-card.tsx
'use client';
import { Card } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";

export const MetricCard = ({
    title,
    value,
    icon: Icon,
    description,
    suffix = '',
    index = 0,
    onClick,
    gradient
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    description?: string;
    suffix?: string;
    index?: number;
    onClick?: () => void;
    gradient?: string;
}) => {
    const animatedValue = useAnimatedCounter(value, 0, 1000);

    // Map index to chart variables (1-5)
    const chartIndex = (index % 5) + 1;
    const chartVar = `hsl(var(--chart-${chartIndex}))`;
    const chartVarMuted = `hsl(var(--chart-${chartIndex}) / 0.2)`;
    const chartVarBorder = `hsl(var(--chart-${chartIndex}) / 0.4)`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <Card
                onClick={onClick}
                className={cn(
                    "relative overflow-hidden h-full flex flex-col justify-between p-3.5 transition-all duration-300",
                    "bg-white/60 dark:bg-black/60 backdrop-blur-md",
                    "border transition-colors duration-500",
                    "hover:shadow-lg hover:bg-white/80 dark:hover:bg-black/80",
                    "group cursor-default rounded-xl hover:shadow-[var(--hover-shadow)]",
                    onClick && "cursor-pointer"
                )}
                style={{ borderColor: chartVarBorder } as React.CSSProperties}
            >
                {/* Background Glow - Theme Aware */}
                <div
                    className="absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full transition-opacity group-hover:opacity-40"
                    style={{ background: chartVar } as React.CSSProperties}
                />

                <div className="flex justify-between items-center z-10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors truncate pr-2">
                        {title}
                    </p>
                    {Icon && (
                        <div
                            className="p-1.5 rounded-lg bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/5 shadow-sm transition-transform group-hover:scale-110"
                            style={{ color: chartVar } as React.CSSProperties}
                        >
                            <Icon className="h-4 w-4" />
                        </div>
                    )}
                </div>

                <div className="mt-2 z-10">
                    <div className="flex items-baseline gap-1">
                        <p
                            className="text-2xl font-black tracking-tighter transition-colors duration-500"
                            style={{ color: chartVar } as React.CSSProperties}
                        >
                            {animatedValue}{suffix}
                        </p>
                    </div>
                    {description && (
                        <p className="text-[9px] text-muted-foreground mt-0.5 font-semibold uppercase opacity-70 group-hover:opacity-100 transition-opacity">
                            {description}
                        </p>
                    )}
                </div>

                {/* Bottom decorative bar */}
                <div
                    className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 group-hover:w-full w-4"
                    style={{ background: chartVar } as React.CSSProperties}
                />
            </Card>
        </motion.div>
    );
};
