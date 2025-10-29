// src/components/dashboard/course-progress-card.tsx
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, PencilRuler, Monitor, Award, Layers } from "lucide-react";
import type { Course } from "@/types";
import Link from "next/link";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";

interface CourseProgressCardProps {
    course: Course;
    index: number;
}

const ICONS = [PencilRuler, Monitor, Award, Layers];
const COLORS = [
  'text-teal-500', 
  'text-purple-500', 
  'text-orange-500', 
  'text-sky-500'
];

const SegmentedProgressBar = ({ total, completed }: { total: number, completed: number }) => {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground w-12 shrink-0">
                {completed}/{total}
            </span>
            <div className="flex-grow grid gap-1" style={{gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`}}>
                {Array.from({ length: total }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full ${i < completed ? 'bg-primary' : 'bg-muted'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export function CourseProgressCard({ course, index }: CourseProgressCardProps) {
    const averageCompletion = Math.round(course.averageCompletion || 0);
    const animatedValue = useAnimatedCounter(averageCompletion, 0, 1500);

    const Icon = ICONS[index % ICONS.length];
    const colorClass = COLORS[index % COLORS.length];
    
    const completedLessons = Math.round((course.modulesCount > 0 ? (course.lessonsCount || 0) : 0) * (averageCompletion / 100));

    return (
        <Card className="p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/50">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Circular Progress */}
                <div className="flex-shrink-0">
                    <CircularProgress value={averageCompletion} size={80} strokeWidth={8} showValue={false} className={colorClass}>
                        <Icon className={`h-8 w-8 ${colorClass}`} />
                    </CircularProgress>
                </div>

                {/* Course Info */}
                <div className="flex-grow text-center sm:text-left">
                    <h3 className="font-bold text-lg">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">{course.modulesCount} Módulos, {course.lessonsCount || 0} Lecciones</p>
                </div>

                {/* Stats and Action */}
                <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{animatedValue}</span>
                        <span className="text-2xl font-semibold text-muted-foreground">%</span>
                    </div>
                     <Button asChild variant="outline" size="sm">
                        <Link href={`/enrollments?courseId=${course.id}`}>
                            Ver Detalles <ArrowRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t">
                 <SegmentedProgressBar total={course.lessonsCount || 10} completed={completedLessons} />
            </div>
        </Card>
    );
}
