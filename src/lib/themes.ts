
import { colord, extend } from "colord";
import lchPlugin from "colord/plugins/lch";

extend([lchPlugin]);

export interface ColorTheme {
    name: string;
    label: string;
    colors: {
        background: string;
        foreground: string;
        primary: string;
        accent: string;
    };
}

export const defaultThemes: ColorTheme[] = [
    {
        name: 'corporate-blue',
        label: 'Azul Corporativo',
        colors: {
            background: '220 20% 98%',
            foreground: '220 15% 20%',
            primary: '217 91% 60%',
            accent: '205 90% 55%',
        }
    },
    {
        name: 'neon-dawn',
        label: 'Amanecer Neón',
        colors: {
            background: '270 12% 8%',
            foreground: '270 10% 85%',
            primary: '310 90% 65%',
            accent: '190 95% 60%',
        }
    },
    {
        name: 'deep-forest',
        label: 'Bosque Profundo',
        colors: {
            background: '120 25% 10%',
            foreground: '110 15% 88%',
            primary: '140 65% 45%',
            accent: '90 55% 58%',
        }
    },
    {
        name: 'parchment',
        label: 'Pergamino',
        colors: {
            background: '45 50% 95%',
            foreground: '30 20% 15%',
            primary: '25 80% 45%',
            accent: '10 60% 50%',
        }
    },
    {
        name: 'custom',
        label: 'Personalizado',
        colors: {
            background: '220 20% 98%', // Default to corporate blue
            foreground: '220 15% 20%',
            primary: '217 91% 60%',
            accent: '205 90% 55%',
        }
    }
];

export const getTheme = (name: string): ColorTheme => {
    return defaultThemes.find(t => t.name === name) || defaultThemes[0];
};


export const isLight = (hslColor: string) => {
    const lValue = parseInt(hslColor.split(' ')[2].replace('%',''));
    return lValue > 60;
};
