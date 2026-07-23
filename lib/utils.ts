import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts AI-generated bullet text (one bullet per line, prefixed with
 * "•", "-", or "*") into a real HTML <ul><li> list. Splicing that plain
 * text straight into Tiptap's HTML content collapses every line into a
 * single paragraph, so callers must run AI output through this before
 * merging it into rich-text description fields.
 */
export function bulletTextToHtml(text: string): string {
  const items = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);

  if (items.length === 0) return "";

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<ul>${items.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>`;
}
