
// Shared style constants for both HTML preview and PDF generation
export const RESUME_STYLES = {
    // A4 dimensions at 72 DPI (PDF standard)
    page: {
        width: 595.28,  // 210mm
        height: 841.89, // 297mm
        padding: 42.52, // 15mm
    },

    colors: {
        primary: '#2563EB',
        text: '#111827',
        textLight: '#6B7280',
        border: '#E5E7EB',
    },

    fonts: {
        sizes: {
            h1: 30,      // Name (increased from 24)
            h2: 18,      // Section headers (increased from 14)
            h3: 15,      // Job titles (increased from 12)
            body: 12,    // Descriptions (increased from 10)
            small: 11,   // Dates (increased from 9)
        },
        weights: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },
        lineHeight: 1.6, // Increased line height for better readability
    },

    spacing: {
        section: 16,
        item: 10,
        inline: 8,
        tight: 4,
    },
};
