
export type ThemeName = 'corporate-blue' | 'neon-dawn' | 'deep-forest' | 'parchment';

export interface ColorDefinition {
    background: string;
    foreground: string;
    primary: string;
    accent: string;
}

export interface ColorTheme {
    name: ThemeName;
    label: string;
    light: ColorDefinition;
    dark: ColorDefinition;
}

export const defaultThemes: ColorTheme[] = [
    {
        name: 'corporate-blue',
        label: 'Azul Corporativo',
        light: {
            background: '220 20% 98%',
            foreground: '220 15% 20%',
            primary: '217 91% 60%',
            accent: '205 90% 55%',
        },
        dark: {
            background: '220 18% 12%',
            foreground: '210 20% 94%',
            primary: '217 91% 60%',
            accent: '205 90% 55%',
        }
    },
    {
        name: 'neon-dawn',
        label: 'Amanecer Neón',
        light: { // Same as dark for neon, as it's an inherently dark theme
            background: '270 12% 8%',
            foreground: '270 10% 85%',
            primary: '310 90% 65%',
            accent: '190 95% 60%',
        },
        dark: {
            background: '270 12% 8%',
            foreground: '270 10% 85%',
            primary: '310 90% 65%',
            accent: '190 95% 60%',
        }
    },
    {
        name: 'deep-forest',
        label: 'Bosque Profundo',
        light: { // Same as dark for forest, inherently dark
            background: '120 25% 10%',
            foreground: '110 15% 88%',
            primary: '140 65% 45%',
            accent: '90 55% 58%',
        },
        dark: {
            background: '120 25% 10%',
            foreground: '110 15% 88%',
            primary: '140 65% 45%',
            accent: '90 55% 58%',
        }
    },
    {
        name: 'parchment',
        label: 'Pergamino',
        light: {
            background: '45 50% 96%',
            foreground: '30 20% 15%',
            primary: '25 80% 45%',
            accent: '10 60% 50%',
        },
        dark: { // Dark variant for parchment
            background: '30 20% 12%',
            foreground: '45 50% 92%',
            primary: '25 70% 55%',
            accent: '10 50% 60%',
        }
    },
];

export const getTheme = (name: ThemeName): ColorTheme | undefined => {
    return defaultThemes.find(t => t.name === name);
};
