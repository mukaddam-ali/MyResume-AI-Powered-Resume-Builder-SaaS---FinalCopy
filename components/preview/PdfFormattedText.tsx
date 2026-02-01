
import React from 'react';
import { Text } from '@react-pdf/renderer';

interface PdfFormattedTextProps {
    text?: string;
    style?: any;
    supportsItalic?: boolean;
}

export const PdfFormattedText = ({ text = '', style, children, supportsItalic = true }: PdfFormattedTextProps & { children?: React.ReactNode }) => {
    // TEMPORARY DEBUG: Simple pass-through to rule out parser crashes
    const safeText = typeof text === 'string' ? text : '';
    return (
        <Text style={style}>
            {safeText}
            {children}
        </Text>
    );
};
