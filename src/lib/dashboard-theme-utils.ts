// src/lib/dashboard-theme-utils.ts

/**
 * Generates theme-aware gradient styles for dashboard banners
 * Uses CSS variables from the active theme to create consistent, dynamic gradients
 */
export function getDashboardBannerGradient(role: 'admin' | 'instructor' | 'student'): string {
    // Use CSS variables that automatically adapt to the current theme
    // Each role gets a different chart color combination for visual distinction

    switch (role) {
        case 'admin':
            // Orange/Coral gradient - uses chart-5 (orange) and chart-4 (pink/coral)
            return 'linear-gradient(135deg, hsl(var(--chart-5)) 0%, hsl(var(--chart-4)) 100%)';

        case 'instructor':
            // Purple gradient - uses chart-3 (purple) and primary
            return 'linear-gradient(135deg, hsl(var(--chart-3)) 0%, hsl(var(--primary)) 100%)';

        case 'student':
            // Blue/Teal gradient - uses chart-1 (blue) and chart-2 (green/teal)
            return 'linear-gradient(135deg, hsl(var(--chart-1)) 0%, hsl(var(--chart-2)) 100%)';

        default:
            return 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--chart-1)) 100%)';
    }
}
