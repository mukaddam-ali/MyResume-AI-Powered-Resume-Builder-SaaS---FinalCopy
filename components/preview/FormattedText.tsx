import React from 'react';
import { cn } from '@/lib/utils';

interface FormattedTextProps {
    text?: string;
    className?: string;
}

export const FormattedText = ({ text = '', className }: FormattedTextProps) => {
    if (!text) return null;

    // Detect if the text is plain text with newlines (legacy data) or HTML (new Tiptap data)
    const isHtml = /<[a-z][\s\S]*>/i.test(text);
    const htmlContent = isHtml ? text : text.replace(/\n/g, '<br />');

    // Remove legacy markdown bolding from plain text if present
    const cleanedContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return (
        <div 
            className={cn(
                "prose prose-sm prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0 text-current max-w-none", 
                className
            )}
            style={{ color: 'inherit' }}
            dangerouslySetInnerHTML={{ __html: cleanedContent }}
        />
    );
};
