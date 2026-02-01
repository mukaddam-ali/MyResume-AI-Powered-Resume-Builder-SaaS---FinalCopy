import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

export const registerClientFonts = () => {
    if (fontsRegistered) return;

    try {
        // Register verified local static fonts (served via public/fonts)
        Font.register({
            family: 'Roboto',
            fonts: [
                { src: '/fonts/Roboto-Regular.ttf', fontWeight: 400 },
                { src: '/fonts/Roboto-Bold.ttf', fontWeight: 700 },
                { src: '/fonts/Roboto-Italic.ttf', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        fontsRegistered = true;
    } catch (error) {
        console.error('Failed to register client fonts:', error);
    }
};
