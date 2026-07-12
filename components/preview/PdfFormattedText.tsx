import React from 'react';
import Html from 'react-pdf-html';
import { Text, StyleSheet } from '@react-pdf/renderer';

interface PdfFormattedTextProps {
    text?: string;
    style?: any;
    supportsItalic?: boolean;
}

/**
 * Sanitize text for React-PDF. Replaces problematic unicode characters
 * that cause mojibake (â€¢, â€", etc.) with safe ASCII equivalents.
 */
function sanitizeForPdf(text: string): string {
    return text
        // Mojibake bullet variants → plain hyphen bullet
        .replace(/â€¢/g, '-')
        .replace(/\u2022/g, '-')   // actual bullet •
        .replace(/â€"/g, '-')       // em dash mojibake
        .replace(/\u2013/g, '-')   // en dash –
        .replace(/\u2014/g, '-')   // em dash —
        .replace(/\u2018|\u2019/g, "'") // smart single quotes
        .replace(/\u201c|\u201d/g, '"') // smart double quotes
        // Strip any remaining non-Latin-Extended characters that may cause issues
        .replace(/[^\x00-\xFF]/g, '');
}

export const PdfFormattedText = ({ text = '', style, children, supportsItalic = true }: PdfFormattedTextProps & { children?: React.ReactNode }) => {
    if (!text) return null;

    // Sanitize before parsing
    const safeText = sanitizeForPdf(text);

    // Detect if the text is plain text with newlines (legacy data) or HTML (new Tiptap data)
    const isHtml = /<[a-z][\s\S]*>/i.test(safeText);
    const htmlContent = isHtml ? safeText : safeText.replace(/\n/g, '<br />');

    // Force empty paragraphs to render correctly by adding a break tag
    let cleanedContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    cleanedContent = cleanedContent.replace(/<p><\/p>/g, '<p><br/></p>').replace(/<p>\s*<\/p>/g, '<p><br/></p>');

    // In case react-pdf-html gets a plain string, wrapping it in a div is safest
    const finalHtml = `<div>${cleanedContent}</div>`;

    return (
        <Html
            style={{
                // Bottom padding guards the last line's descenders from being
                // clipped/merged into the next sibling (react-pdf-html measures
                // the root height slightly short with unitless lineHeight).
                paddingBottom: 3,
                ...style,
                // These are passed down so `<p>`, `<ul>`, etc inherit the base style
                fontSize: style?.fontSize,
                color: style?.color,
                fontFamily: style?.fontFamily,
                lineHeight: style?.lineHeight,
            }}
            stylesheet={{
                p: { margin: 0 },
                ul: { margin: 0, padding: 0, paddingLeft: 10 },
                ol: { margin: 0, padding: 0, paddingLeft: 10 },
                li: { margin: 0, padding: 0, marginBottom: 2 },
            }}
        >
            {finalHtml}
        </Html>
    );
};
