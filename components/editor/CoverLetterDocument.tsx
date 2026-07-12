import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ResumeData } from "@/store/useResumeStore";

const styles = StyleSheet.create({
    page: {
        paddingTop: 56,
        paddingBottom: 56,
        paddingHorizontal: 64,
        fontFamily: "Helvetica",
        fontSize: 11,
        lineHeight: 1.55,
        color: "#1a1a1a",
    },
    name: {
        fontSize: 20,
        fontFamily: "Helvetica-Bold",
        marginBottom: 2,
    },
    jobTitle: {
        fontSize: 11,
        color: "#555555",
        marginBottom: 6,
    },
    contactRow: {
        fontSize: 9,
        color: "#555555",
        marginBottom: 2,
    },
    divider: {
        borderBottomWidth: 1.5,
        marginTop: 10,
        marginBottom: 22,
    },
    date: {
        marginBottom: 18,
        color: "#333333",
    },
    paragraph: {
        marginBottom: 10,
        textAlign: "justify",
    },
});

interface CoverLetterDocumentProps {
    resumeData: ResumeData;
    letterText: string;
    company?: string;
}

/**
 * A5-style formal letter PDF. The header (name, title, contact details) is
 * filled automatically from the resume's personal info; the body is the
 * AI-generated letter.
 */
export function CoverLetterDocument({ resumeData, letterText, company }: CoverLetterDocumentProps) {
    const info = resumeData.personalInfo || ({} as ResumeData["personalInfo"]);
    const accent = resumeData.themeColor || "#2563eb";

    const contactParts = [info.email, info.phone, info.location].filter(
        (p) => p && p.trim()
    );
    const linkParts = [info.linkedin, info.website, info.github].filter(
        (p) => p && p.trim()
    );

    const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Preserve the letter's paragraph structure
    const paragraphs = letterText
        .split(/\n\s*\n|\n/)
        .map((p) => p.trim())
        .filter(Boolean);

    return (
        <Document
            title={`${info.fullName || "Cover Letter"} — Cover Letter${company ? ` (${company})` : ""}`}
            author={info.fullName || undefined}
        >
            <Page size="A4" style={styles.page}>
                {/* Header auto-filled from the resume */}
                <View>
                    {info.fullName ? <Text style={styles.name}>{info.fullName}</Text> : null}
                    {info.jobTitle ? <Text style={styles.jobTitle}>{info.jobTitle}</Text> : null}
                    {contactParts.length > 0 ? (
                        <Text style={styles.contactRow}>{contactParts.join("   •   ")}</Text>
                    ) : null}
                    {linkParts.length > 0 ? (
                        <Text style={styles.contactRow}>{linkParts.join("   •   ")}</Text>
                    ) : null}
                    <View style={[styles.divider, { borderBottomColor: accent }]} />
                </View>

                <Text style={styles.date}>{today}</Text>

                {paragraphs.map((p, i) => (
                    <Text key={i} style={styles.paragraph}>
                        {p}
                    </Text>
                ))}
            </Page>
        </Document>
    );
}
