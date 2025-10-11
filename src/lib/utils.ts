// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { MotivationalMessageTriggerType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get user initials from name or role.
 * @param name User's full name or role string
 * @returns User's initials
 */
export const getInitials = (name?: string | null): string => {
  if (!name) return '??';
  const names = name.trim().split(/\s+/); // Use regex to handle multiple spaces
  if (names.length > 1 && names[0] && names[names.length - 1]) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  if (names.length === 1 && names[0]) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Gets a descriptive label for a motivational message trigger.
 * @param triggerType The type of the trigger.
 * @param triggerCourse The course associated with the trigger, if any.
 * @returns A user-friendly string describing the trigger.
 */
export const getMotivationalTriggerLabel = (
  triggerType: MotivationalMessageTriggerType,
  triggerCourse?: { title: string } | null
): string => {
  const labels: Record<MotivationalMessageTriggerType, string> = {
    COURSE_ENROLLMENT: "Al inscribirse a:",
    COURSE_MID_PROGRESS: "Al 50% del curso:",
    COURSE_NEAR_COMPLETION: "Al 90% del curso:",
    COURSE_COMPLETION: "Al completar el curso:",
    LEVEL_UP: "Al alcanzar el:",
  };

  const baseLabel = labels[triggerType] || "Disparador desconocido:";

  if (triggerType.startsWith('COURSE_') && triggerCourse) {
    return `${baseLabel} ${triggerCourse.title}`;
  }

  if (triggerType === 'LEVEL_UP' && triggerCourse?.title) {
    return `${baseLabel} ${triggerCourse.title}`;
  }

  return baseLabel.replace(':', '');
};
