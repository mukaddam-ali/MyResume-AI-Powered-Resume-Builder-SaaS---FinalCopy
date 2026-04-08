import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

// Use local font paths to avoid Chrome CORS issues with external fetches
const F = (name: string) => `/fonts/${name}`;

export const registerClientFonts = () => {
    if (fontsRegistered) return;

    try {
        // Inter
        Font.register({
            family: 'Inter',
            fonts: [
                { src: F('inter-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('inter-latin-700-normal.woff'), fontWeight: 700 },
                { src: F('inter-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Playfair Display
        Font.register({
            family: 'Playfair Display',
            fonts: [
                { src: F('playfair-display-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('playfair-display-latin-700-normal.woff'), fontWeight: 700 },
                { src: F('playfair-display-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Space Grotesk
        Font.register({
            family: 'Space Grotesk',
            fonts: [
                { src: F('space-grotesk-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('space-grotesk-latin-700-normal.woff'), fontWeight: 700 },
                // Fallback: Map Italic to Normal to prevent crash (No Italic in @fontsource)
                { src: F('space-grotesk-latin-400-normal.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Crimson Pro
        Font.register({
            family: 'Crimson Pro',
            fonts: [
                { src: F('crimson-pro-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('crimson-pro-latin-700-normal.woff'), fontWeight: 700 },
                { src: F('crimson-pro-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // DM Sans
        Font.register({
            family: 'DM Sans',
            fonts: [
                { src: F('dm-sans-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('dm-sans-latin-700-normal.woff'), fontWeight: 700 },
                { src: F('dm-sans-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Libre Baskerville
        Font.register({
            family: 'Libre Baskerville',
            fonts: [
                { src: F('libre-baskerville-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('libre-baskerville-latin-700-normal.woff'), fontWeight: 700 },
                { src: F('libre-baskerville-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Manrope
        Font.register({
            family: 'Manrope',
            fonts: [
                { src: F('manrope-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('manrope-latin-700-normal.woff'), fontWeight: 700 },
                // Fallback: Map Italic to Normal to prevent crash (No Italic in @fontsource)
                { src: F('manrope-latin-400-normal.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Roboto (Default)
        Font.register({
            family: 'Roboto',
            fonts: [
                { src: F('roboto-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('roboto-latin-700-normal.woff'), fontWeight: 700 },
                { src: F('roboto-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Lora
        Font.register({
            family: 'Lora',
            fonts: [
                { src: F('lora-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('lora-latin-700-normal.woff'), fontWeight: 700 },
                { src: F('lora-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Montserrat
        Font.register({
            family: 'Montserrat',
            fonts: [
                { src: F('montserrat-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('montserrat-latin-700-normal.woff'), fontWeight: 700 },
                { src: F('montserrat-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Raleway
        Font.register({
            family: 'Raleway',
            fonts: [
                { src: F('raleway-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('raleway-latin-700-normal.woff'), fontWeight: 700 },
                { src: F('raleway-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Merriweather
        Font.register({
            family: 'Merriweather',
            fonts: [
                { src: F('merriweather-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('merriweather-latin-700-normal.woff'), fontWeight: 700 },
                { src: F('merriweather-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Oswald
        Font.register({
            family: 'Oswald',
            fonts: [
                { src: F('oswald-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('oswald-latin-700-normal.woff'), fontWeight: 700 },
                // Fallback: Map Italic to Normal to prevent crash (No Italic in @fontsource)
                { src: F('oswald-latin-400-normal.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // PT Serif
        Font.register({
            family: 'PT Serif',
            fonts: [
                { src: F('pt-serif-latin-400-normal.woff'), fontWeight: 400 },
                { src: F('pt-serif-latin-700-normal.woff'), fontWeight: 700 },
                { src: F('pt-serif-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        fontsRegistered = true;
    } catch (error) {
        console.error('Failed to register client fonts:', error);
    }
};
