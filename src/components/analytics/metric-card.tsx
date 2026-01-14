
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

    const chartIndex = (index % 5) + 1;
    const chartVar = `hsl(var(--chart-${chartIndex}))`;
    const chartVarBorder = `hsl(var(--chart-${chartIndex}) / 0.4)`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <Card
                onClick={onClick}
                className={cn(
                    "relative overflow-hidden h-full flex flex-col justify-center p-4 transition-all duration-300",
                    "bg-white dark:bg-slate-950",
                    "border border-slate-100 dark:border-slate-800 shadow-sm",
                    "hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700",
                    "group cursor-default rounded-xl",
                    onClick && "cursor-pointer"
                )}
                style={{
                    backgroundColor: `color-mix(in srgb, ${chartVar}, white 92%)`,
                    borderColor: `color-mix(in srgb, ${chartVar}, transparent 80%)`
                } as React.CSSProperties}
            >
                <div className="flex items-center gap-3 z-10">
                    {Icon && (
                        <div
                            className="p-2.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-transform group-hover:scale-110"
                            style={{ color: chartVar } as React.CSSProperties}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold uppercase tracking-tight text-muted-foreground group-hover:text-foreground transition-colors truncate">
                            {title}
                        </p>
                        <div className="flex items-baseline gap-1 mt-0.5">
                            <p
                                className="text-4xl font-bold tracking-tighter transition-colors duration-500"
                                style={{ color: chartVar } as React.CSSProperties}
                            >
                                {animatedValue}{suffix}
                            </p>
                        </div>
                    </div>
                </div>

                {description && (
                    <p className="text-[9px] text-muted-foreground mt-1 font-medium truncate opacity-70">
                        {description}
                    </p>
                )}

                <div
                    className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 group-hover:w-full w-4"
                    style={{ background: chartVar } as React.CSSProperties}
                />
            </Card>
        </motion.div>
    );
};