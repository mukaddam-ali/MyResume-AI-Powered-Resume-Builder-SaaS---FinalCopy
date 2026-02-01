import { Font } from '@react-pdf/renderer';
import path from 'path';

let fontsRegistered = false;

export const registerServerFonts = () => {
    if (fontsRegistered) return;

    try {
        const fontsDir = path.join(process.cwd(), 'public/fonts');

        // Register ONLY Roboto as the default font
        Font.register({
            family: 'Roboto',
            fonts: [
                { src: path.join(fontsDir, 'Roboto-Regular.ttf'), fontWeight: 400 },
                { src: path.join(fontsDir, 'Roboto-Bold.ttf'), fontWeight: 700 },
                { src: path.join(fontsDir, 'Roboto-Italic.ttf'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        fontsRegistered = true;
    } catch (error) {
        console.error('Failed to register server fonts:', error);
    }
};
