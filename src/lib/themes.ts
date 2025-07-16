
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
            background: 'hsl(220 20% 98%)',
            foreground: 'hsl(220 15% 20%)',
            primary: 'hsl(217 91% 60%)',
            accent: 'hsl(205 90% 55%)',
        }
    },
    {
        name: 'neon-dawn',
        label: 'Amanecer Neón',
        colors: {
            background: 'hsl(270 12% 8%)',
            foreground: 'hsl(270 10% 85%)',
            primary: 'hsl(310 90% 65%)',
            accent: 'hsl(190 95% 60%)',
        }
    },
    {
        name: 'deep-forest',
        label: 'Bosque Profundo',
        colors: {
            background: 'hsl(120 25% 10%)',
            foreground: 'hsl(110 15% 88%)',
            primary: 'hsl(140 65% 45%)',
            accent: 'hsl(90 55% 58%)',
        }
    },
    {
        name: 'parchment',
        label: 'Pergamino',
        colors: {
            background: 'hsl(45 50% 95%)',
            foreground: 'hsl(30 20% 15%)',
            primary: 'hsl(25 80% 45%)',
            accent: 'hsl(10 60% 50%)',
        }
    },
    {
        name: 'custom',
        label: 'Personalizado',
        colors: {
            background: '#ffffff',
            foreground: '#000000',
            primary: '#007bff',
            accent: '#00c3ff',
        }
    }
];

export const getTheme = (name: string): ColorTheme => {
    return defaultThemes.find(t => t.name === name) || defaultThemes[0];
};


export const isLight = (color: string) => {
    return colord(color).toLch().l > 60;
};
