// Global UI Configuration
// This file contains centralized configuration for UI elements across the application

export const UI_CONFIG = {
    emptyStates: {
        resources: {
            title: 'Biblioteca vacía',
            description: 'Comienza agregando recursos a tu biblioteca. ¡Es fácil y rápido!',
            searchTitle: 'No se encontraron resultados',
            searchDescription: 'No hay recursos que coincidan con tu búsqueda. Intenta con otros términos.',
            icon: 'FolderOpen',
            iconColor: 'text-primary',
            gradientFrom: 'from-primary/10',
            gradientVia: 'via-primary/5',
            gradientTo: 'to-transparent'
        },
        courses: {
            title: 'No hay cursos disponibles',
            description: 'Explora el catálogo o espera a que se publiquen nuevos cursos.',
            searchTitle: 'No se encontraron cursos',
            searchDescription: 'Intenta ajustar los filtros o términos de búsqueda.',
            icon: 'BookOpen',
            iconColor: 'text-blue-500',
            gradientFrom: 'from-blue-500/10',
            gradientVia: 'via-blue-500/5',
            gradientTo: 'to-transparent'
        },
        analytics: {
            title: 'Sin datos disponibles',
            description: 'Los datos analíticos aparecerán aquí una vez que haya actividad.',
            icon: 'BarChart3',
            iconColor: 'text-purple-500',
            gradientFrom: 'from-purple-500/10',
            gradientVia: 'via-purple-500/5',
            gradientTo: 'to-transparent'
        }
    },

    folderBanners: {
        patterns: [
            {
                id: 'mesh-gradient',
                name: 'Mesh Gradient',
                gradient: 'from-blue-500/10 via-indigo-500/5 to-background',
                pattern: 'mesh',
                accentColor: 'text-blue-500'
            },
            {
                id: 'geometric-emerald',
                name: 'Geometric Emerald',
                gradient: 'from-emerald-500/10 via-teal-500/5 to-background',
                pattern: 'geometric',
                accentColor: 'text-emerald-500'
            },
            {
                id: 'dots-amber',
                name: 'Dots Amber',
                gradient: 'from-amber-500/10 via-orange-500/5 to-background',
                pattern: 'dots',
                accentColor: 'text-amber-500'
            },
            {
                id: 'waves-rose',
                name: 'Waves Rose',
                gradient: 'from-rose-500/10 via-pink-500/5 to-background',
                pattern: 'waves',
                accentColor: 'text-rose-500'
            },
            {
                id: 'lines-violet',
                name: 'Lines Violet',
                gradient: 'from-violet-500/10 via-fuchsia-500/5 to-background',
                pattern: 'lines',
                accentColor: 'text-violet-500'
            },
            {
                id: 'grid-cyan',
                name: 'Grid Cyan',
                gradient: 'from-cyan-500/10 via-sky-500/5 to-background',
                pattern: 'grid',
                accentColor: 'text-cyan-500'
            }
        ]
    }
} as const;

export type EmptyStateConfig = typeof UI_CONFIG.emptyStates[keyof typeof UI_CONFIG.emptyStates];
export type FolderBannerPattern = typeof UI_CONFIG.folderBanners.patterns[number];
