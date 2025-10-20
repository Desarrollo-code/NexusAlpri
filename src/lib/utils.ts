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
 * @param triggerEntity The associated entity (course or custom object for level).
 * @returns A user-friendly string describing the trigger.
 */
export const getMotivationalTriggerLabel = (
  triggerType: MotivationalMessageTriggerType,
  triggerEntity?: { title: string } | null
): string => {
  const labels: Record<MotivationalMessageTriggerType, string> = {
    COURSE_ENROLLMENT: "Al inscribirse a:",
    COURSE_MID_PROGRESS: "Al 50% del curso:",
    COURSE_NEAR_COMPLETION: "Al 90% del curso:",
    COURSE_COMPLETION: "Al completar el curso:",
    LEVEL_UP: "Al alcanzar el:",
  };

  const baseLabel = labels[triggerType] || "Disparador desconocido:";
  
  if (triggerEntity?.title) {
    return `${baseLabel} ${triggerEntity.title}`;
  }

  return baseLabel.replace(':', '');
};


// --- Process Color Utils ---
const PALETTES = [
    ["#fde047", "#facc15", "#eab308"], // Yellow
    ["#a7f3d0", "#4ade80", "#22c55e"], // Green
    ["#93c5fd", "#60a5fa", "#3b82f6"], // Blue
    ["#f87171", "#ef4444", "#dc2626"], // Red
    ["#a5b4fc", "#818cf8", "#6366f1"], // Indigo
    ["#d8b4fe", "#c084fc", "#a855f7"], // Purple
    ["#f9a8d4", "#f472b6", "#ec4899"], // Pink
    ["#6ee7b7", "#34d399", "#10b981"], // Emerald
    ["#5eead4", "#2dd4bf", "#14b8a6"], // Teal
];

const stringToHash = (str: string): number => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

export const getProcessColors = (id: string) => {
    const hash = stringToHash(id);
    const palette = PALETTES[hash % PALETTES.length];
    return {
        bgColor: `bg-[${palette[0]}]`,
        textColor: `text-[${palette[2]}]`,
        borderColor: `border-[${palette[1]}]`,
        raw: {
            light: palette[0],
            medium: palette[1],
            dark: palette[2],
        }
    };
};
