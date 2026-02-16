import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

export const registerServerFonts = () => {
    if (fontsRegistered) return;

    try {
        // Register Google Fonts via unpkg/fontsource (Reliable & Zero-Config)

        // Inter
        Font.register({
            family: 'Inter',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/inter/files/inter-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/inter/files/inter-latin-700-normal.woff', fontWeight: 700 },
                { src: 'https://unpkg.com/@fontsource/inter/files/inter-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Playfair Display
        Font.register({
            family: 'Playfair Display',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff', fontWeight: 700 },
                { src: 'https://unpkg.com/@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Space Grotesk
        Font.register({
            family: 'Space Grotesk',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff', fontWeight: 700 },
                // Fallback: Map Italic to Normal to prevent crash (No Italic in @fontsource)
                { src: 'https://unpkg.com/@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Crimson Pro
        Font.register({
            family: 'Crimson Pro',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/crimson-pro/files/crimson-pro-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/crimson-pro/files/crimson-pro-latin-700-normal.woff', fontWeight: 700 },
                { src: 'https://unpkg.com/@fontsource/crimson-pro/files/crimson-pro-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // DM Sans
        Font.register({
            family: 'DM Sans',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff', fontWeight: 700 },
                { src: 'https://unpkg.com/@fontsource/dm-sans/files/dm-sans-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Libre Baskerville
        Font.register({
            family: 'Libre Baskerville',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/libre-baskerville/files/libre-baskerville-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/libre-baskerville/files/libre-baskerville-latin-700-normal.woff', fontWeight: 700 },
                { src: 'https://unpkg.com/@fontsource/libre-baskerville/files/libre-baskerville-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Manrope
        Font.register({
            family: 'Manrope',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/manrope/files/manrope-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/manrope/files/manrope-latin-700-normal.woff', fontWeight: 700 },
                // Fallback: Map Italic to Normal to prevent crash (No Italic in @fontsource)
                { src: 'https://unpkg.com/@fontsource/manrope/files/manrope-latin-400-normal.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Roboto (Default)
        Font.register({
            family: 'Roboto',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/roboto/files/roboto-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/roboto/files/roboto-latin-700-normal.woff', fontWeight: 700 },
                { src: 'https://unpkg.com/@fontsource/roboto/files/roboto-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // --- NEW DISTINCT FONTS ---

        // Lora
        Font.register({
            family: 'Lora',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/lora/files/lora-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/lora/files/lora-latin-700-normal.woff', fontWeight: 700 },
                { src: 'https://unpkg.com/@fontsource/lora/files/lora-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Montserrat
        Font.register({
            family: 'Montserrat',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/montserrat/files/montserrat-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/montserrat/files/montserrat-latin-700-normal.woff', fontWeight: 700 },
                { src: 'https://unpkg.com/@fontsource/montserrat/files/montserrat-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Raleway
        Font.register({
            family: 'Raleway',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/raleway/files/raleway-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/raleway/files/raleway-latin-700-normal.woff', fontWeight: 700 },
                { src: 'https://unpkg.com/@fontsource/raleway/files/raleway-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Merriweather
        Font.register({
            family: 'Merriweather',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/merriweather/files/merriweather-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/merriweather/files/merriweather-latin-700-normal.woff', fontWeight: 700 },
                { src: 'https://unpkg.com/@fontsource/merriweather/files/merriweather-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Oswald
        Font.register({
            family: 'Oswald',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/oswald/files/oswald-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/oswald/files/oswald-latin-700-normal.woff', fontWeight: 700 },
                // Fallback: Map Italic to Normal to prevent crash (No Italic in @fontsource)
                { src: 'https://unpkg.com/@fontsource/oswald/files/oswald-latin-400-normal.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // PT Serif
        Font.register({
            family: 'PT Serif',
            fonts: [
                { src: 'https://unpkg.com/@fontsource/pt-serif/files/pt-serif-latin-400-normal.woff', fontWeight: 400 },
                { src: 'https://unpkg.com/@fontsource/pt-serif/files/pt-serif-latin-700-normal.woff', fontWeight: 700 },
                { src: 'https://unpkg.com/@fontsource/pt-serif/files/pt-serif-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        fontsRegistered = true;
    } catch (error) {
        console.error('Failed to register server fonts:', error);
    }
};
