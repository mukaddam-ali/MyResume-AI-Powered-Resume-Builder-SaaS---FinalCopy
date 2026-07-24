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

    // Force empty paragraphs to render correctly by adding a break tag
    let cleanedContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    cleanedContent = cleanedContent.replace(/<p><\/p>/g, '<p><br/></p>').replace(/<p>\s*<\/p>/g, '<p><br/></p>');

    return (
        <div 
            className={cn(
                "prose prose-sm prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0 prose-ul:pl-3 prose-ol:pl-3 text-current max-w-none",
                className
            )}
            style={{ color: 'inherit' }}
            dangerouslySetInnerHTML={{ __html: cleanedContent }}
        />
    );
};
