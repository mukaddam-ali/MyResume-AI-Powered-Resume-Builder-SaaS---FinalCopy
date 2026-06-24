import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Underline as UnderlineIcon, Code, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

interface RichTextareaProps {
    id?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export const RichTextarea = ({ id, value = '', onValueChange, className, placeholder }: RichTextareaProps) => {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                // Disable built-in strike/underline variants that may overlap
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right'],
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            // Give out HTML so it's consistent
            if (onValueChange) {
                onValueChange(editor.getHTML());
            }
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] p-3 text-sm',
            },
        },
    });

    // Sync external value changes (e.g., loading different resumes)
    React.useEffect(() => {
        if (editor) {
            const currentHTML = editor.getHTML();
            if (value !== currentHTML) {
                // Handle empty cases to avoid loops
                const isEmptyValue = value === "" || value === "<p></p>";
                const isEmptyEditor = editor.isEmpty || currentHTML === "<p></p>";
                if (isEmptyValue && isEmptyEditor) {
                    return;
                }
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);

    if (!editor) {
        return null; // or a loading skeleton
    }

    return (
        <div id={id} className={cn("relative border rounded-md overflow-hidden bg-background focus-within:ring-1 focus-within:ring-ring", className)}>
            {/* Toolbar at the top */}
            <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1">
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bold')}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                    aria-label="Toggle bold"
                    className="h-8 w-8 p-0"
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('italic')}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                    aria-label="Toggle italic"
                    className="h-8 w-8 p-0"
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('underline')}
                    onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                    aria-label="Toggle underline"
                    className="h-8 w-8 p-0"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Toggle>
                <div className="w-px h-4 bg-border mx-1" />
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: 'left' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
                    aria-label="Align left"
                    className="h-8 w-8 p-0"
                >
                    <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: 'center' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
                    aria-label="Align center"
                    className="h-8 w-8 p-0"
                >
                    <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: 'right' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
                    aria-label="Align right"
                    className="h-8 w-8 p-0"
                >
                    <AlignRight className="h-4 w-4" />
                </Toggle>
                <div className="w-px h-4 bg-border mx-1" />
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bulletList')}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                    aria-label="Toggle bullet list"
                    className="h-8 w-8 p-0"
                >
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('orderedList')}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                    aria-label="Toggle ordered list"
                    className="h-8 w-8 p-0"
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>

                <Toggle
                    size="sm"
                    pressed={editor.isActive('blockquote')}
                    onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                    aria-label="Toggle quote"
                    className="h-8 w-8 p-0"
                >
                    <Quote className="h-4 w-4" />
                </Toggle>
            </div>
            {/* Editor Area */}
            <EditorContent editor={editor} className="cursor-text" />
            {!editor.getText() && placeholder && (
                <div className="absolute top-12 left-3 text-muted-foreground text-sm pointer-events-none">
                    {placeholder}
                </div>
            )}
        </div>
    );
};
