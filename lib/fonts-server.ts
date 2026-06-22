import { Font } from '@react-pdf/renderer';
import path from 'path';

let fontsRegistered = false;

export const registerServerFonts = () => {
    if (fontsRegistered) return;

    try {
        // Register Google Fonts via unpkg/fontsource (Reliable & Zero-Config)

        // Inter
        Font.register({
            family: 'Inter',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'inter-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'inter-latin-700-normal.woff'), fontWeight: 700 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'inter-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Playfair Display
        Font.register({
            family: 'Playfair Display',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'playfair-display-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'playfair-display-latin-700-normal.woff'), fontWeight: 700 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'playfair-display-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Space Grotesk
        Font.register({
            family: 'Space Grotesk',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'space-grotesk-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'space-grotesk-latin-700-normal.woff'), fontWeight: 700 },
                // Fallback: Map Italic to Normal to prevent crash (No Italic in @fontsource)
                { src: path.join(process.cwd(), 'public', 'fonts', 'space-grotesk-latin-400-normal.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Crimson Pro
        Font.register({
            family: 'Crimson Pro',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'crimson-pro-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'crimson-pro-latin-700-normal.woff'), fontWeight: 700 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'crimson-pro-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // DM Sans
        Font.register({
            family: 'DM Sans',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'dm-sans-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'dm-sans-latin-700-normal.woff'), fontWeight: 700 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'dm-sans-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Libre Baskerville
        Font.register({
            family: 'Libre Baskerville',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'libre-baskerville-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'libre-baskerville-latin-700-normal.woff'), fontWeight: 700 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'libre-baskerville-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Manrope
        Font.register({
            family: 'Manrope',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'manrope-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'manrope-latin-700-normal.woff'), fontWeight: 700 },
                // Fallback: Map Italic to Normal to prevent crash (No Italic in @fontsource)
                { src: path.join(process.cwd(), 'public', 'fonts', 'manrope-latin-400-normal.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Roboto (Default)
        Font.register({
            family: 'Roboto',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'roboto-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'roboto-latin-700-normal.woff'), fontWeight: 700 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'roboto-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // --- NEW DISTINCT FONTS ---

        // Lora
        Font.register({
            family: 'Lora',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'lora-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'lora-latin-700-normal.woff'), fontWeight: 700 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'lora-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Montserrat
        Font.register({
            family: 'Montserrat',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'montserrat-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'montserrat-latin-700-normal.woff'), fontWeight: 700 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'montserrat-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Raleway
        Font.register({
            family: 'Raleway',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'raleway-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'raleway-latin-700-normal.woff'), fontWeight: 700 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'raleway-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Merriweather
        Font.register({
            family: 'Merriweather',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'merriweather-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'merriweather-latin-700-normal.woff'), fontWeight: 700 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'merriweather-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // Oswald
        Font.register({
            family: 'Oswald',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'oswald-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'oswald-latin-700-normal.woff'), fontWeight: 700 },
                // Fallback: Map Italic to Normal to prevent crash (No Italic in @fontsource)
                { src: path.join(process.cwd(), 'public', 'fonts', 'oswald-latin-400-normal.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        // PT Serif
        Font.register({
            family: 'PT Serif',
            fonts: [
                { src: path.join(process.cwd(), 'public', 'fonts', 'pt-serif-latin-400-normal.woff'), fontWeight: 400 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'pt-serif-latin-700-normal.woff'), fontWeight: 700 },
                { src: path.join(process.cwd(), 'public', 'fonts', 'pt-serif-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
            ],
        });

        fontsRegistered = true;
    } catch (error) {
        console.error('Failed to register server fonts:', error);
    }
};
