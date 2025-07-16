
export type ThemeName = 'corporate-blue' | 'ember-glow';

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
        name: 'ember-glow',
        label: 'Ember Glow',
        light: {
            background: '240 5% 96%',
            foreground: '240 5% 25%',
            primary: '22 95% 55%',
            accent: '45 95% 55%',
        },
        dark: {
            background: '220 3% 8%',
            foreground: '220 10% 88%',
            primary: '25 95% 60%',
            accent: '50 98% 58%',
        }
    }
];

export const getTheme = (name: ThemeName): ColorTheme | undefined => {
    return defaultThemes.find(t => t.name === name);
};
