
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
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
