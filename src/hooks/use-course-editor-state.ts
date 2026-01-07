// src/hooks/use-course-editor-state.ts
'use client';

import { useState, useCallback } from 'react';
import type { Course, Module, Lesson, ContentBlock } from '@/types';

export type ViewportMode = 'mobile' | 'tablet' | 'desktop';

interface CourseEditorState {
    course: Course | null;
    selectedModuleId: string | null;
    selectedLessonId: string | null;
    selectedBlockId: string | null;
    viewportMode: ViewportMode;
    isDirty: boolean;
}

export function useCourseEditorState(initialCourse?: Course | null) {
    const [state, setState] = useState<CourseEditorState>({
        course: initialCourse || null,
        selectedModuleId: null,
        selectedLessonId: null,
        selectedBlockId: null,
        viewportMode: 'desktop',
        isDirty: false,
    });

    const updateCourse = useCallback((updater: (course: Course) => Course) => {
        setState(prev => {
            if (!prev.course) return prev;
            return {
                ...prev,
                course: updater(prev.course),
                isDirty: true,
            };
        });
    }, []);

    const selectModule = useCallback((moduleId: string | null) => {
        setState(prev => ({
            ...prev,
            selectedModuleId: moduleId,
            selectedLessonId: null,
            selectedBlockId: null,
        }));
    }, []);

    const selectLesson = useCallback((moduleId: string, lessonId: string) => {
        setState(prev => ({
            ...prev,
            selectedModuleId: moduleId,
            selectedLessonId: lessonId,
            selectedBlockId: null,
        }));
    }, []);

    const selectBlock = useCallback((moduleId: string, lessonId: string, blockId: string) => {
        setState(prev => ({
            ...prev,
            selectedModuleId: moduleId,
            selectedLessonId: lessonId,
            selectedBlockId: blockId,
        }));
    }, []);

    const setViewportMode = useCallback((mode: ViewportMode) => {
        setState(prev => ({ ...prev, viewportMode: mode }));
    }, []);

    const addModule = useCallback((module: Module) => {
        updateCourse(course => ({
            ...course,
            modules: [...course.modules, module],
        }));
        selectModule(module.id);
    }, [updateCourse, selectModule]);

    const updateModule = useCallback((moduleId: string, updates: Partial<Module>) => {
        updateCourse(course => ({
            ...course,
            modules: course.modules.map(m =>
                m.id === moduleId ? { ...m, ...updates } : m
            ),
        }));
    }, [updateCourse]);

    const deleteModule = useCallback((moduleId: string) => {
        updateCourse(course => ({
            ...course,
            modules: course.modules.filter(m => m.id !== moduleId),
        }));
        selectModule(null);
    }, [updateCourse, selectModule]);

    const addLesson = useCallback((moduleId: string, lesson: Lesson) => {
        updateCourse(course => ({
            ...course,
            modules: course.modules.map(m =>
                m.id === moduleId
                    ? { ...m, lessons: [...m.lessons, lesson] }
                    : m
            ),
        }));
        selectLesson(moduleId, lesson.id);
    }, [updateCourse, selectLesson]);

    const updateLesson = useCallback((moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
        updateCourse(course => ({
            ...course,
            modules: course.modules.map(m =>
                m.id === moduleId
                    ? {
                        ...m,
                        lessons: m.lessons.map(l =>
                            l.id === lessonId ? { ...l, ...updates } : l
                        ),
                    }
                    : m
            ),
        }));
    }, [updateCourse]);

    const deleteLesson = useCallback((moduleId: string, lessonId: string) => {
        updateCourse(course => ({
            ...course,
            modules: course.modules.map(m =>
                m.id === moduleId
                    ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
                    : m
            ),
        }));
        setState(prev => ({
            ...prev,
            selectedLessonId: prev.selectedLessonId === lessonId ? null : prev.selectedLessonId,
        }));
    }, [updateCourse]);

    const markClean = useCallback(() => {
        setState(prev => ({ ...prev, isDirty: false }));
    }, []);

    const selectedModule = state.course?.modules.find(
        m => m.id === state.selectedModuleId
    ) || null;

    const selectedLesson = selectedModule?.lessons.find(
        l => l.id === state.selectedLessonId
    ) || null;

    const selectedBlock = selectedLesson?.contentBlocks.find(
        b => b.id === state.selectedBlockId
    ) || null;

    return {
        course: state.course,
        selectedModule,
        selectedLesson,
        selectedBlock,
        selectedModuleId: state.selectedModuleId,
        selectedLessonId: state.selectedLessonId,
        selectedBlockId: state.selectedBlockId,
        viewportMode: state.viewportMode,
        isDirty: state.isDirty,
        updateCourse,
        selectModule,
        selectLesson,
        selectBlock,
        setViewportMode,
        addModule,
        updateModule,
        deleteModule,
        addLesson,
        updateLesson,
        deleteLesson,
        markClean,
    };
}
