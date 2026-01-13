// src/components/dashboard/course-progress-card.tsx
'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, PencilRuler, Monitor, Award, Layers } from "lucide-react";
import type { Course } from "@/types";
import Link from "next/link";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { cn } from "@/lib/utils";

interface CourseProgressCardProps {
    course: Course;
    index: number;
}

const ICONS = [PencilRuler, Monitor, Award, Layers];
const GRADIENTS = ['bg-gradient-blue', 'bg-gradient-green', 'bg-gradient-purple', 'bg-gradient-pink', 'bg-gradient-orange'];

export function CourseProgressCard({ course, index }: CourseProgressCardProps) {
    const averageCompletion = Math.round(course.averageCompletion || 0);

    const Icon = ICONS[index % ICONS.length];
    const gradientClass = GRADIENTS[index % GRADIENTS.length];

    return (
        <Card className={cn(
            "p-3 transition-all duration-300 hover:shadow-lg hover:border-primary/50 text-white flex flex-col h-full rounded-xl",
            gradientClass
        )}>
            <CardHeader className="flex-row items-start justify-between gap-3 p-0 mb-3">
                <div className="flex flex-col">
                    <div className="p-2 bg-white/20 rounded-lg mb-1.5 w-fit">
                        <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">{course.modulesCount} Módulos</p>
                </div>
                <CircularProgress value={averageCompletion} size={45} strokeWidth={5} className="text-white" valueTextClass="text-[10px] font-black" />
            </CardHeader>

            <CardContent className="p-0 flex-grow">
                <h3 className="font-bold text-[13px] leading-snug line-clamp-2">{course.title}</h3>
            </CardContent>

            <div className="mt-3 pt-3 border-t border-white/20">
                <Button asChild variant="secondary" size="sm" className="h-7 w-full bg-white text-primary hover:bg-slate-100 text-[10px] font-bold">
                    <Link href={`/enrollments?courseId=${course.id}`}>
                        Gestionar <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
