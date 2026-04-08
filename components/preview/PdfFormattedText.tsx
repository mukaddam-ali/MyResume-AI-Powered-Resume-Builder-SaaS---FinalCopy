import React from 'react';
import Html from 'react-pdf-html';
import { Text, StyleSheet } from '@react-pdf/renderer';

interface PdfFormattedTextProps {
    text?: string;
    style?: any;
    supportsItalic?: boolean;
}

export const PdfFormattedText = ({ text = '', style, children, supportsItalic = true }: PdfFormattedTextProps & { children?: React.ReactNode }) => {
    if (!text) return null;

    // Detect if the text is plain text with newlines (legacy data) or HTML (new Tiptap data)
    const isHtml = /<[a-z][\s\S]*>/i.test(text);
    const htmlContent = isHtml ? text : text.replace(/\n/g, '<br />');

    // Remove legacy markdown bolding from plain text if present
    const cleanedContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // In case react-pdf-html gets a plain string, wrapping it in a div is safest
    const finalHtml = `<div>${cleanedContent}</div>`;

    return (
        <Html 
            style={{ 
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
