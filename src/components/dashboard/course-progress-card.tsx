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
            "p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/50 text-white flex flex-col h-full",
            gradientClass
        )}>
            <CardHeader className="flex-row items-start justify-between gap-4 p-0 mb-4">
                <div className="flex flex-col">
                    <div className="p-3 bg-white/20 rounded-lg mb-2 w-fit">
                        <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-white/80">{course.modulesCount} Módulos, {course.lessonsCount || 0} Lecciones</p>
                </div>
                <CircularProgress value={averageCompletion} size={60} strokeWidth={6} className="text-white" valueTextClass="text-base font-bold" />
            </CardHeader>

            <CardContent className="p-0 flex-grow">
                <h3 className="font-bold text-lg leading-tight line-clamp-2">{course.title}</h3>
            </CardContent>

            <div className="mt-4 pt-4 border-t border-white/20">
                <Button asChild variant="secondary" size="sm" className="w-full bg-white/90 text-primary hover:bg-white">
                    <Link href={`/enrollments?courseId=${course.id}`}>
                        Ver Detalles <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
