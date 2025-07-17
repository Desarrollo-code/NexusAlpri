
'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CourseCard } from './course-card';
import type { Course as AppCourse, UserRole } from '@/types';

interface CourseCarouselProps {
  courses: AppCourse[];
  userRole: UserRole | null;
  onEnrollmentChange?: (courseId: string, newStatus: boolean) => void;
}

export function CourseCarousel({ courses, userRole, onEnrollmentChange }: CourseCarouselProps) {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: courses.length > 2,
      }}
      className="w-full"
    >
      <CarouselContent>
        {courses.map((course, index) => (
          <CarouselItem key={index} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
            <div className="p-1 h-full">
              <CourseCard course={course} userRole={userRole} onEnrollmentChange={onEnrollmentChange} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}
