/* eslint-disable jsx-a11y/alt-text */
"use client";
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link, Font, Image, Svg, Path } from '@react-pdf/renderer';
import { ResumeData } from '@/store/useResumeStore';
import { PdfFormattedText } from '@/components/preview/PdfFormattedText';
import { SOCIAL_ICONS } from './social-icons';
import { adjustColor, getContrastingColor } from '@/lib/colors';

// Ensure URLs always have a protocol so the PDF viewer opens them as web links
// rather than treating bare paths as local file references.
const normalizeUrl = (url: string): string => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url; // already has protocol
    if (url.startsWith('//')) return `https:${url}`;
    return `https://${url}`;
};

// Note: Custom fonts disabled due to fontkit compatibility issues with Google Fonts variable fonts
// PDF will use built-in Helvetica font instead. Live preview still uses custom Google Fonts.
// TODO: Host static TTF fonts locally for PDF compatibility

// Register Google Fonts for PDF consistency
// Font registration is handled externally:
// - Server: lib/fonts-server.ts (using local fs)
// - Client: lib/fonts-client.ts (using URLs)

// Font family mapping - maps user selection to registered PDF fonts
// IMPORTANT: Corrupted fonts (~1.6KB) are mapped to working fallbacks to prevent crashes
const PDF_FONT_MAP: Record<string, string> = {
    // Professional Fonts
    'inter': 'Inter',
    'playfair': 'Playfair Display',
    'space-grotesk': 'Space Grotesk',
    'crimson-pro': 'Crimson Pro',
    'dm-sans': 'DM Sans',
    'libre-baskerville': 'Libre Baskerville',
    'manrope': 'Manrope',
    'lora': 'Lora',
    'montserrat': 'Montserrat',
    'raleway': 'Raleway',
    'merriweather': 'Merriweather',
    'oswald': 'Oswald',
    'pt-serif': 'PT Serif',

    // Classic / Fallback
    'roboto': 'Roboto',
    'open-sans': 'Roboto', // Fallback
    'opensans': 'Roboto', // Fallback
    'lato': 'Roboto', // Fallback
    'sourcesans': 'Inter', // Sans Fallback
    'source-sans': 'Inter', // Sans Fallback
};


// Define which fonts are premium
// DISABLED: Premium fonts have corrupted files, temporarily disable premium restrictions
const PREMIUM_FONTS: string[] = [];

// List of known working fonts (verified file sizes > 2KB)
// These are guaranteed to work - all other fonts map to these via PDF_FONT_MAP
const VERIFIED_WORKING_FONTS = ['Roboto', 'Open Sans', 'Lato', 'Helvetica'];

export const ResumeDocument = ({ data, userTier = 'free' }: { data: ResumeData, userTier?: 'free' | 'pro' }) => {
    // Data is already normalized by normalizeResumeData() in the API route
    // All arrays are guaranteed to exist and be proper arrays
    // skills is guaranteed to be string[]
    const {
        personalInfo,
        education,
        experience,
        projects,
        skills, // Now guaranteed to be string[] from normalization
        selectedTemplate,
        themeColor,
        contentScale,
        fontFamily,
        sectionOrder,
        sectionScales,
        sectionTitles,
        hideBranding,
    } = data;

    // Show branding unless the user is pro AND has explicitly hidden it
    const showBranding = !(userTier === 'pro' && hideBranding);

    const customThemeColor = themeColor;
    const fontId = fontFamily;

    const effectiveFontId = fontId || 'roboto';

    // Client-Side Rendering: Enable Custom Fonts
    // map user selection to registered font family
    let pdfFontFamily = PDF_FONT_MAP[effectiveFontId.toLowerCase()] || 'Helvetica';

    // Fallback if mapping fails
    if (!pdfFontFamily) pdfFontFamily = 'Helvetica';

    console.log(`Font "${effectiveFontId}" â†’ "${pdfFontFamily}"`);

    // Use default if not set
    const accentColor = customThemeColor || '#112e51';


    // Helper to scale styles dynamically
    const createScaledStyles = (styles: any, extraScale: number = 1) => {
        const globalScale = contentScale || 1;
        const spacingScale = data.sectionSpacing ?? 1;
        
        if (globalScale === 1 && extraScale === 1 && spacingScale === 1) return StyleSheet.create(styles);
        
        const scale = globalScale * extraScale;
        const noScaleProps = new Set(['flexGrow', 'flexShrink', 'zIndex', 'opacity', 'fontWeight', 'lineHeight', 'flex', 'top', 'bottom', 'left', 'right']);
        const spacingProps = new Set(['marginBottom', 'marginTop', 'paddingBottom', 'paddingTop', 'margin', 'padding', 'marginVertical', 'paddingVertical']);

        const mapStyles = (obj: any): any => {
            if (Array.isArray(obj)) {
                return obj.map(mapStyles);
            }
            const newObj: any = {};
            for (const key in obj) {
                const val = obj[key];
                if (typeof val === 'number' && !noScaleProps.has(key)) {
                    if (spacingProps.has(key)) {
                        newObj[key] = val * scale * spacingScale;
                    } else {
                        newObj[key] = val * scale;
                    }
                } else if (typeof val === 'object' && val !== null) {
                    newObj[key] = mapStyles(val);
                } else {
                    newObj[key] = val;
                }
            }
            return newObj;
        };
        return StyleSheet.create(mapStyles(styles));
    };

    // Branding footer (shown on all templates unless pro + hideBranding)
    const BrandingFooter = () => showBranding ? (
        <View fixed style={{
            position: 'absolute',
            bottom: 8,
            left: 0,
            right: 0,
            alignItems: 'center',
        }}>
            <Text style={{
                fontSize: 7,
                color: '#9ca3af',
                opacity: 0.7,
                letterSpacing: 0.5,
            }}>Powered by MyResume</Text>
        </View>
    ) : null;

    // Helper to render social media icons
    const renderSocialMedia = (styles: any) => {
        if (!personalInfo.socialMedia || personalInfo.socialMedia.length === 0) return null;

        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: (4 * (data.sectionSpacing ?? 1)) }}>
                {personalInfo.socialMedia.filter(s => s.enabled).map((social) => {
                    const iconPath = SOCIAL_ICONS[social.platform];
                    if (!iconPath) return null;

                    return (
                        <View key={social.id} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                            <Svg viewBox="0 0 24 24" style={{ width: 10, height: 10, marginRight: 2 }}>
                                <Path d={iconPath} fill={styles.contact?.color || '#555'} />
                            </Svg>
                            <Text style={{ fontSize: 9, color: styles.contact?.color || '#555' }}>
                                {social.username || social.url}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    const getStyles = (s = 1) => createScaledStyles({
        page: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            paddingVertical: 30,
            paddingHorizontal: 50,
            fontSize: 10,
            lineHeight: 1.5,
            fontFamily: pdfFontFamily,
        },
        section: {
            margin: 10,
            padding: 10,
            flexGrow: 1,
        },
        header: {
            marginBottom: 20,
            paddingBottom: 10,
            borderBottomWidth: 2,
            borderBottomColor: accentColor, // Dynamic
            alignItems: 'center',
        },
        name: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#000000',
            textTransform: 'uppercase',
            marginBottom: 5,
        },
        contact: {
            fontSize: 10,
            color: '#555555',
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: accentColor, // Dynamic
            marginBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            paddingBottom: 2,
            textTransform: 'uppercase',
        },
        itemGroup: {
            marginBottom: 10,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 2,
        },
        bold: {
            fontWeight: 'bold',
            fontSize: 11,
        },
        italic: {
            fontStyle: 'italic',
            color: '#4B5563',
        },
        text: {
            fontSize: 10,
            marginBottom: 2,
        },
    }, s);
    const styles = getStyles(1);


    // Modern Template Styles
    const getModernStyles = (s = 1) => createScaledStyles({
        page: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            fontFamily: pdfFontFamily,
        },
        container: {
            flexDirection: 'row',
            width: '100%',
            minHeight: '100%',
        },
        sidebar: {
            width: '32%',
            backgroundColor: accentColor,
            paddingVertical: 24, // Reduced from 32
            paddingHorizontal: 30, // Reduced from 40
            color: '#FFFFFF',
        },
        main: {
            width: '68%',
            paddingVertical: 24, // Reduced from 32
            paddingHorizontal: 36, // Reduced from 48
            paddingTop: 36, // Reduced from 48
        },
        sidebarSection: {
            marginBottom: 24, // Reduced from 32
        },
        sidebarTitle: {
            fontSize: 9, // Reduced from 10
            fontWeight: 'bold',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 12, // Reduced from 16
            textTransform: 'uppercase',
            borderBottomWidth: 0, // Removed border to eliminate green line
            paddingBottom: 6, // Reduced from 8
            letterSpacing: 1.5,
        },
        sidebarText: {
            fontSize: 8, // Reduced from 9
            color: '#FFFFFF',
            marginBottom: 4,
            lineHeight: 1.4
        },
        name: {
            fontSize: 24, // Reduced from 28
            fontWeight: 'bold',
            color: accentColor,
            textTransform: 'uppercase',
            marginBottom: 6,
            letterSpacing: -0.5,
        },
        jobTitle: {
            fontSize: 12, // Reduced from 14
            color: '#6b7280',
            marginBottom: 18, // Reduced from 24
            fontWeight: 'light'
        },
        sectionTitle: {
            fontSize: 10, // Reduced from 11
            fontWeight: 'bold',
            color: accentColor,
            marginBottom: 18, // Reduced from 24
            textTransform: 'uppercase',
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
            paddingBottom: 6,
            letterSpacing: 1.5,
        },
        itemGroup: {
            marginBottom: 18, // Reduced from 24
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 3,
        },
        bullet: {
            width: 6, // Reduced from 8
            height: 6,
            borderRadius: 3,
            backgroundColor: accentColor,
            position: 'absolute',
            left: -16, // Adjusted
            top: 5
        },
        contentWithBullet: {
            marginLeft: 0,
            borderLeftWidth: 2,
            borderLeftColor: '#f3f4f6',
            paddingLeft: 12, // Reduced from 16
            paddingBottom: 0,
            position: 'relative'
        },
        skillPill: {
            backgroundColor: 'rgba(255,255,255,0.1)',
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 4,
            marginRight: 6,
            marginBottom: 6,
            alignSelf: 'flex-start'
        },
        projectCard: {
            backgroundColor: '#f9fafb',
            borderRadius: 6,
            padding: 12, // Reduced from 16
            marginBottom: 12, // Reduced from 16
            borderWidth: 1,
            borderColor: '#f3f4f6'
        },
        techPill: {
            fontSize: 9, // Reduced from 10
            color: '#4b5563',
            backgroundColor: '#e5e7eb', // gray-200 background
            paddingHorizontal: 12,
            paddingVertical: 4, // Reduced padding for better vertical centering
            borderRadius: 12, // Rounded corners for bubble effect
            fontWeight: 'normal',
            alignSelf: 'center', // Center self
            marginBottom: 8,
            width: '100%', // Full width to allow centering
            justifyContent: 'center', // Vertically center
            alignItems: 'center', // Horizontally center
            textAlign: 'center', // Text alignment
        },
        // Custom Section Items - Sidebar
        sidebarItemName: { fontSize: 9, fontWeight: 'bold' },
        sidebarItemDate: { fontSize: 8 },
        sidebarItemCity: { fontSize: 8, color: '#666' },
        sidebarItemDesc: { fontSize: 8, lineHeight: 1.3, marginTop: 2 },
        // Custom Section Items - Main
        mainItemName: { fontSize: 10, fontWeight: 'bold' },
        mainItemDate: { fontSize: 9, color: '#666' },
        mainItemCity: { fontSize: 9, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
        mainItemDesc: { fontSize: 9, lineHeight: 1.4 },

        // Education Items (Scaled)
        eduSchool: { fontWeight: 'bold', fontSize: 10 },
        eduDegree: { fontSize: 9 },
        eduDate: { fontSize: 9, color: '#666' },

        // Experience Items (Scaled)
        expCompany: { fontWeight: 'bold', fontSize: 11 },
        expDate: { fontSize: 10, color: '#666' },
        expRole: { fontSize: 10, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },

        headerBlock: { marginBottom: 24 },
        skillText: {
            fontSize: 9,
            color: '#FFFFFF',
        },
    }, s);

    const modernStyles = getModernStyles(1);

    // Minimalist Template Styles
    const getMinimalistStyles = (s = 1) => createScaledStyles({
        page: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            paddingVertical: 36, // Reduced from 48
            paddingHorizontal: 48, // Reduced from 64
            fontSize: 9, // Reduced base
            fontFamily: pdfFontFamily,
        },
        header: {
            marginBottom: 24, // Reduced from 32
            borderBottomWidth: 2,
            borderBottomColor: '#D1D5DB', // Changed from customThemeColor to Gray
            paddingBottom: 24, // Reduced from 32
        },
        name: {
            fontSize: 30, // Reduced from 36
            fontFamily: pdfFontFamily,
            fontWeight: 'bold',
            marginBottom: 12, // Reduced from 16
            letterSpacing: -1,
            color: customThemeColor,
        },
        contact: {
            fontSize: 9, // Reduced from 10
            color: '#4b5563',
            marginTop: 3,
        },
        sectionTitle: {
            fontSize: 9.5, // Reduced from 10
            fontWeight: 'bold',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginTop: 24, // Reduced from 32
            marginBottom: 12, // Reduced from 16
            paddingBottom: 3,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            color: customThemeColor,
        },
        itemGroup: {
            marginBottom: 18, // Reduced from 24
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 3,
        },
        company: {
            fontSize: 12, // Reduced from 14
            fontWeight: 'bold',
        },
        title: {
            fontSize: 10, // Reduced from 11
            fontStyle: 'italic',
            color: '#374151',
        },
        date: {
            fontSize: 8.5, // Reduced from 9
            color: '#6b7280',
        },
        description: {
            fontSize: 9, // Reduced from 10
            paddingLeft: 0,
            lineHeight: 1.5,
            color: '#4b5563',
        },
        itemCity: { fontSize: 8.5, fontStyle: 'italic', marginBottom: 2 },
        skillPill: {
            backgroundColor: '#f3f4f6',
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#e5e7eb',
        },
        skillText: {
            fontSize: 10,
            color: '#374151',
            fontFamily: 'Times-Roman',
        },
    }, s);
    const minimalistStyles = getMinimalistStyles(1);

    // Calculate dynamic sidebar line color based on contrast
    const brightness = getContrastingColor(accentColor);
    // If background is dark (brightness=white text), lines should be lighter (adjustColor +40)
    // If background is light (brightness=black text), lines should be darker (adjustColor -40)
    // We adjust specifically to ensure visibility "like grey on black" 
    const sidebarLineColor = brightness === 'white'
        ? adjustColor(accentColor, 70) // Much lighter version of dark bg (e.g. Grey on Black)
        : adjustColor(accentColor, -40); // Much darker version of light bg

    const getCreativeStyles = (s = 1) => createScaledStyles({
        page: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            fontFamily: pdfFontFamily,
        },
        container: {
            flexDirection: 'row',
            width: '100%',
            minHeight: '100%',
        },
        sidebar: {
            width: '35%',
            backgroundColor: accentColor,
            paddingVertical: 32,
            paddingHorizontal: 24, // Reduced from 40 for more space
            color: '#FFFFFF',
        },
        main: {
            width: '65%',
            paddingVertical: 30, // Reduced from 40
            paddingHorizontal: 40, // Reduced from 56
            paddingTop: 48, // Reduced from 64
        },
        name: {
            fontSize: 24, // Reduced from 28
            fontWeight: 'bold',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: 2,
            lineHeight: 1.2, // Ensure multi-line names look good
        },
        role: {
            fontSize: 9, // Reduced from 10
            marginBottom: 18, // Reduced from 24
            letterSpacing: 1,
            opacity: 0.9,
            fontWeight: 'bold',
        },
        sidebarTitle: {
            fontSize: 8.5, // Reduced from 9
            fontWeight: 'bold',
            borderBottomWidth: 1,
            borderBottomColor: sidebarLineColor, // Dynamic color
            paddingBottom: 6,
            marginBottom: 12,
            marginTop: 24,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        sidebarText: {
            fontSize: 8, // Reduced from 9
            marginBottom: 6, // Reduced from 8
            lineHeight: 1.5,
            opacity: 0.9,
        },
        sectionTitle: {
            fontSize: 14, // Reduced from 16
            fontWeight: 'bold',
            color: accentColor,
            textTransform: 'uppercase',
            marginBottom: 18, // Reduced from 24
            borderLeftWidth: 0,
            borderLeftColor: accentColor,
            paddingLeft: 0,
            letterSpacing: 1,
        },
        mainText: {
            fontSize: 9, // Reduced from 10
            lineHeight: 1.6,
            color: '#374151',
            marginBottom: 6,
        },
        expHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 3,
        },
        companyName: {
            fontSize: 12, // Reduced from 14
            fontWeight: 'bold',
            color: '#111827',
        },
        roleName: {
            fontSize: 9, // Reduced from 10
            fontWeight: 'bold',
            color: '#6b7280',
            textTransform: 'uppercase',
            marginBottom: 6, // Reduced from 8
            letterSpacing: 1,
        },
        bullet: {
            width: 5, // Reduced from 6
            height: 5,
            borderRadius: 2.5,
            backgroundColor: accentColor,
            position: 'absolute',
            left: 0,
            top: 5
        },
        expItem: {
            paddingLeft: 18, // Reduced from 24
            position: 'relative',
            marginBottom: 24 // Reduced from 32
        },
        itemDate: { fontSize: 9, color: '#666' },
        skillPill: {
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 4,
        },
        skillText: {
            fontSize: 9,
        },
        // Education Items (Scaled)
        eduSchool: { fontWeight: 'bold', fontSize: 10 },
        eduDegree: { fontSize: 9 },
        eduDate: { fontSize: 9, opacity: 0.8 },

    }, s);
    const creativeStyles = getCreativeStyles(1);

    // Github styles remain largely static as per theme, or we can update if requested.
    // For now, keeping it dark theme consistent.
    const getClassicStyles = (s = 1) => createScaledStyles({
        page: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            paddingVertical: 30, // Reduced from 40
            paddingHorizontal: 40, // Reduced from 56
            fontFamily: pdfFontFamily,
            alignItems: 'stretch',
        },
        section: {
            margin: 8, // Reduced from 10
            paddingBottom: 8,
        },
        header: {
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 12, // Reduced from 18 to tighten layout
            borderBottomWidth: 2,
            borderBottomColor: '#d1d5db',
            paddingBottom: 12, // Reduced from 18 to tighten layout
            width: '100%',
        },
        name: {
            fontSize: 28, // Reduced from 36
            fontWeight: 'bold',
            marginBottom: 6, // Reduced from 12 to decrease space between name and contact
            textTransform: 'uppercase',
            color: customThemeColor,
            textAlign: 'center',
            lineHeight: 1.5,
        },
        contact: {
            fontSize: 9, // Reduced from 10
            textAlign: 'center',
            color: '#4b5563',
            lineHeight: 1.5,
        },
        heading: {
            fontSize: 10, // Reduced from 12
            fontWeight: 'bold',
            marginBottom: 8, // Reduced from 12
            paddingBottom: 4,
            borderBottomWidth: 2,
            borderBottomColor: '#e5e7eb',
            textTransform: 'uppercase',
            color: customThemeColor,
        },
        subheading: {
            fontSize: 10, // Reduced from 11
            fontWeight: 'bold',
            marginBottom: 2,
        },
        text: {
            fontSize: 10, // Reduced from 14
            marginBottom: 3,
            color: '#374151',
            lineHeight: 1.5,
        },
        date: {
            fontSize: 10, // Reduced from 14
            color: '#6b7280',
        },
        itemGroup: {
            marginBottom: 12, // Reduced from 16
            width: '100%',
        },
        sectionTitle: {
            fontSize: 14, // Reduced from 18
            fontWeight: 'bold',
            color: customThemeColor,
            marginBottom: 12, // Reduced from 16
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
            paddingBottom: 4,
            textTransform: 'uppercase',
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 4,
        },
        bold: {
            fontWeight: 'bold',
            fontSize: 11, // Reduced from 14
            color: '#1f2937',
        },
        italic: {
            fontStyle: 'italic',
            fontSize: 10, // Reduced from 14
            color: customThemeColor,
        },

        skillPill: {
            backgroundColor: '#f3f4f6',
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 12,
        },
        skillText: {
            fontSize: 10,
            color: '#374151',
        },
    }, s);
    const classicStyles = getClassicStyles(1);


    // --- SECTION RENDERERS (Internal Helper) ---
    const sidebarIds = ['education', 'skills'];
    const getSidebarSections = () => sectionOrder.filter(id => sidebarIds.includes(id));
    const getMainSections = () => sectionOrder.filter(id => !sidebarIds.includes(id) && id !== 'personal');


    // --- MINIMALIST TEMPLATE ---
    if (selectedTemplate === 'minimalist') {
        const leftSections = getSidebarSections();
        const rightSections = getMainSections();

        const renderMinimalistSection = (id: string) => {
            const minimalistStyles = getMinimalistStyles(sectionScales?.[id] || 1);
            const customSection = data.customSections?.find(s => s.id === id);
            if (customSection) {
                return (
                    <View key={customSection.id} style={minimalistStyles.itemGroup}>
                        <Text style={minimalistStyles.sectionTitle}>{customSection.title}</Text>
                        {customSection.items.map((item: any) => (
                            <View key={item.id} style={minimalistStyles.itemGroup}>
                                <View style={minimalistStyles.row}>
                                    <Text style={minimalistStyles.company}>{item.name}</Text>
                                    <Text style={minimalistStyles.date}>{item.date}</Text>
                                </View>
                                {item.city && <Text style={minimalistStyles.itemCity}>{item.city}</Text>}
                                <PdfFormattedText text={item.description} style={minimalistStyles.description} />
                            </View>
                        ))}
                    </View>
                );
            }

            switch (id) {
                case 'education':
                    return education.length > 0 && (
                        <View key="education" style={{ marginBottom: (20 * (data.sectionSpacing ?? 1)) }}>
                            <Text style={minimalistStyles.sectionTitle}>{sectionTitles.education || "Education"}</Text>
                            {education.map((edu: any) => (
                                <View key={edu.id} style={{ marginBottom: (8 * (data.sectionSpacing ?? 1)), flexDirection: 'column', gap: 2 }}>
                                    <Text style={minimalistStyles.company}>{edu.school}</Text>
                                    {edu.degree ? <Text style={minimalistStyles.title}>{edu.degree}</Text> : null}
                                    <Text style={minimalistStyles.date}>{edu.startDate} – {edu.endDate}</Text>
                                </View>
                            ))}
                        </View>
                    );
                case 'skills':
                    return skills && skills.length > 0 && (
                        <View key="skills" style={{ marginBottom: (20 * (data.sectionSpacing ?? 1)) }}>
                            <Text style={minimalistStyles.sectionTitle}>{sectionTitles.skills || "Skills"}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: (4 * (data.sectionSpacing ?? 1)) }}>
                                {skills.filter(s => s && s.trim()).map((skill: string, i: number) => (
                                    <View key={i} style={minimalistStyles.skillPill}>
                                        <Text style={minimalistStyles.skillText}>{skill.trim()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                case 'experience':
                    return experience.length > 0 && (
                        <View key="experience" style={minimalistStyles.itemGroup}>
                            <Text style={minimalistStyles.sectionTitle}>{sectionTitles.experience || "Professional Experience"}</Text>
                            {experience.map((exp: any) => (
                                <View key={exp.id} style={minimalistStyles.itemGroup}>
                                    <View style={minimalistStyles.row}>
                                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                            <Text style={minimalistStyles.company}>{exp.company}, </Text>
                                            <Text style={minimalistStyles.title}>{exp.role}</Text>
                                        </View>
                                        <Text style={minimalistStyles.date}>{exp.startDate} â€“ {exp.endDate}</Text>
                                    </View>
                                    <PdfFormattedText text={exp.description} style={minimalistStyles.description} />
                                </View>
                            ))}
                        </View>
                    );
                case 'projects':
                    return projects.length > 0 && (
                        <View key="projects" style={minimalistStyles.itemGroup}>
                            <Text style={minimalistStyles.sectionTitle}>{sectionTitles.projects || "Projects"}</Text>
                            {projects.map((proj: any) => (
                                <View key={proj.id} style={minimalistStyles.itemGroup}>
                                    <Text style={minimalistStyles.company}>{proj.name}</Text>
                                    {proj.technologies && (
                                        <View style={{ marginTop: 2, marginBottom: (2 * (data.sectionSpacing ?? 1)) }}>
                                            <Text style={{ fontSize: 9, backgroundColor: '#f3f4f6', color: '#374151', padding: '1 3', borderRadius: 2, alignSelf: 'flex-start' }}>
                                                {proj.technologies}
                                            </Text>
                                        </View>
                                    )}
                                    <PdfFormattedText text={proj.description} style={{ ...minimalistStyles.description, marginBottom: (4 * (data.sectionSpacing ?? 1)) }} />
                                    {proj.link && (
                                        <Link src={normalizeUrl(proj.link)} style={{ fontSize: 9, marginTop: 4, fontStyle: 'italic', color: proj.linkColor || '#2563eb', textDecoration: 'none' }}>
                                            {proj.linkText || "View Project"}
                                        </Link>
                                    )}
                                </View>
                            ))}
                        </View>
                    );
                default: return null;
            }
        }

        return (
            <Document>
                <Page size="A4" style={minimalistStyles.page}>
                    <View style={{ width: '100%', height: '100%' }} wrap={false}>
                        <View style={minimalistStyles.header}>
                            <Text style={minimalistStyles.name}>{personalInfo.fullName}</Text>
                            {personalInfo.jobTitle && <Text style={{ fontSize: 14, color: '#9ca3af', marginBottom: (16 * (data.sectionSpacing ?? 1)), fontFamily: 'Times-Roman', textTransform: 'uppercase', letterSpacing: 2 }}>{personalInfo.jobTitle}</Text>}
                            <Text style={minimalistStyles.contact}>{personalInfo.email} • {personalInfo.phone} • {personalInfo.location}</Text>
                            <Text style={minimalistStyles.contact}>
                                {[personalInfo.website, personalInfo.linkedin, personalInfo.github].filter(Boolean).map(s => s?.replace(/^https?:\/\/(www\.)?/, '')).join(' • ')}
                            </Text>
                            {/* Social Media */}
                            <View style={{ alignItems: 'center', marginTop: (4 * (data.sectionSpacing ?? 1)) }}>
                                {renderSocialMedia({ contact: { color: accentColor } })}
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ width: '35%', marginRight: 20 }}>
                                {leftSections.map(renderMinimalistSection)}
                            </View>
                            <View style={{ width: '60%' }}>
                                {personalInfo.summary && (
                                    <View style={{ marginBottom: (20 * (data.sectionSpacing ?? 1)) }}>
                                        <Text style={minimalistStyles.sectionTitle}>{sectionTitles.summary || "Profile"}</Text>
                                        <PdfFormattedText text={personalInfo.summary} style={{ fontSize: 10, lineHeight: 1.4, fontFamily: 'Times-Roman' }} />
                                    </View>
                                )}
                                {rightSections.map(renderMinimalistSection)}
                            </View>
                        </View>
                    </View>

                    <BrandingFooter />
                </Page>
            </Document >
        )
    }

    // --- MODERN TEMPLATE ---
    if (selectedTemplate === 'modern') {
        const sidebarSections = getSidebarSections();
        const mainSections = getMainSections();
        const personalStyles = getModernStyles(sectionScales?.personal || 1);

        const renderModernSection = (id: string, isSidebar: boolean) => {
            const modernStyles = getModernStyles(sectionScales?.[id] || 1);
            const customSection = data.customSections?.find(s => s.id === id);
            if (customSection) {
                if (isSidebar) {
                    return (
                        <View key={customSection.id} style={modernStyles.sidebarSection}>
                            <Text style={modernStyles.sidebarTitle}>{customSection.title}</Text>
                            {customSection.items.map((item: any) => (
                                <View key={item.id} style={{ marginBottom: (8 * (data.sectionSpacing ?? 1)) }}>
                                    <Text style={modernStyles.sidebarItemName}>{item.name}</Text>
                                    <Text style={modernStyles.sidebarItemDate}>{item.date}</Text>
                                    {item.city && <Text style={modernStyles.sidebarItemCity}>{item.city}</Text>}
                                    <PdfFormattedText text={item.description} style={modernStyles.sidebarItemDesc} />
                                </View>
                            ))}
                        </View>
                    );
                } else {
                    return (
                        <View key={customSection.id} style={modernStyles.sidebarSection}>
                            <Text style={modernStyles.sectionTitle}>{customSection.title}</Text>
                            {customSection.items.map((item: any) => (
                                <View key={item.id} style={modernStyles.contentWithBullet}>
                                    <View style={modernStyles.bullet} />
                                    <View style={modernStyles.row}>
                                        <Text style={modernStyles.mainItemName}>{item.name}</Text>
                                        <Text style={modernStyles.mainItemDate}>{item.date}</Text>
                                    </View>
                                    {item.city && <Text style={modernStyles.mainItemCity}>{item.city}</Text>}
                                    <PdfFormattedText text={item.description} style={modernStyles.mainItemDesc} />
                                </View>
                            ))}
                        </View>
                    );
                }
            }

            switch (id) {
                case 'education':
                    return education.length > 0 && (
                        <View key="education" style={modernStyles.sidebarSection}>
                            <Text style={modernStyles.sidebarTitle}>{sectionTitles.education || "Education"}</Text>
                            {education.map((edu: any) => (
                                <View key={edu.id} style={{ marginBottom: (8 * (data.sectionSpacing ?? 1)), flexDirection: 'column', gap: 2 }}>
                                    <Text style={modernStyles.eduSchool}>{edu.school}</Text>
                                    {edu.degree ? <Text style={modernStyles.eduDegree}>{edu.degree}</Text> : null}
                                    <Text style={modernStyles.eduDate}>{edu.startDate} - {edu.endDate}</Text>
                                </View>
                            ))}
                        </View>
                    );
                case 'skills':
                    return skills && skills.length > 0 && (
                        <View key="skills" style={modernStyles.sidebarSection}>
                            <Text style={modernStyles.sidebarTitle}>{sectionTitles.skills || "Skills"}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                {skills.filter(s => s && s.trim()).map((skill: string, i: number) => (
                                    <View key={i} style={modernStyles.skillPill}>
                                        <Text style={modernStyles.skillText}>{skill.trim()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                case 'experience':
                    return experience.length > 0 && (
                        <View key="experience" style={modernStyles.sidebarSection}>
                            <Text style={modernStyles.sectionTitle}>{sectionTitles.experience || "Professional Experience"}</Text>
                            {experience.map((exp: any) => (
                                <View key={exp.id} style={modernStyles.contentWithBullet}>
                                    <View style={modernStyles.bullet} />
                                    <View style={modernStyles.row}>
                                        <Text style={modernStyles.expCompany}>{exp.company}</Text>
                                        <Text style={modernStyles.expDate}>{exp.startDate} - {exp.endDate}</Text>
                                    </View>
                                    <Text style={modernStyles.expRole}>{exp.role}</Text>
                                    <PdfFormattedText text={exp.description} style={{ fontSize: 10, lineHeight: 1.4 }} />
                                </View>
                            ))}
                        </View>
                    );
                case 'projects':
                    return projects.length > 0 && (
                        <View key="projects" style={modernStyles.sidebarSection}>
                            <Text style={modernStyles.sectionTitle}>{sectionTitles.projects || "Projects"}</Text>
                            {projects.map((proj: any) => (
                                <View key={proj.id} style={modernStyles.projectCard}>
                                    <View style={{ marginBottom: (6 * (data.sectionSpacing ?? 1)) }}>
                                        <Text style={{ fontWeight: 'bold', fontSize: 11, color: '#111827' }}>{proj.name}</Text>
                                        {proj.technologies && (
                                            <View style={{ flexDirection: 'row', marginTop: (3 * (data.sectionSpacing ?? 1)) }}>
                                                <Text style={{ fontSize: 9, backgroundColor: '#e5e7eb', color: '#4b5563', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                                                    {proj.technologies}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <PdfFormattedText text={proj.description} style={{ fontSize: 10, lineHeight: 1.4, color: '#4b5563', marginBottom: (4 * (data.sectionSpacing ?? 1)) }} />
                                    {proj.link && (
                                        <Link src={normalizeUrl(proj.link)} style={{ fontSize: 9, color: proj.linkColor || '#2563eb', fontWeight: 'bold', marginTop: 4, textDecoration: 'none' }}>
                                            {proj.linkText || "View Project ->"}
                                        </Link>
                                    )}
                                </View>
                            ))}
                        </View>
                    );
                default: return null;
            }
        }

        return (
            <Document>
                <Page size="A4" style={modernStyles.page}>
                    <View style={modernStyles.container} wrap={false}>
                        <View style={modernStyles.sidebar}>
                            {/* Contact */}
                            <View style={modernStyles.sidebarSection}>
                                <Text style={personalStyles.sidebarTitle}>{sectionTitles.contact || "Contact"}</Text>
                                {personalInfo.email && <Text style={personalStyles.sidebarText}>{personalInfo.email}</Text>}
                                {personalInfo.phone && <Text style={personalStyles.sidebarText}>{personalInfo.phone}</Text>}
                                {personalInfo.location && <Text style={personalStyles.sidebarText}>{personalInfo.location}</Text>}
                                {personalInfo.linkedin && <Text style={personalStyles.sidebarText}>{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                {personalInfo.website && <Text style={personalStyles.sidebarText}>{personalInfo.website.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                {personalInfo.github && <Text style={personalStyles.sidebarText}>{personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                {/* Social Media */}
                                {renderSocialMedia({ contact: { color: '#FFFFFF' } })}
                            </View>
                            {sidebarSections.map(id => renderModernSection(id, true))}
                        </View>


                        {/* Main Content */}
                        <View style={modernStyles.main}>
                            <View style={personalStyles.headerBlock}>
                                <Text style={personalStyles.name}>{personalInfo.fullName}</Text>
                                {personalInfo.jobTitle && <Text style={personalStyles.jobTitle}>{personalInfo.jobTitle}</Text>}
                                {personalInfo.summary && <PdfFormattedText text={personalInfo.summary} style={{ fontSize: 10 * (sectionScales?.personal || 1), marginTop: 16 * (sectionScales?.personal || 1), lineHeight: 1.5, color: '#6b7280' }} />}
                            </View>
                            {mainSections.map(id => renderModernSection(id, false))}
                        </View>
                    </View>
                    <BrandingFooter />
                </Page>
            </Document>
        );
    }

    // --- CREATIVE TEMPLATE ---
    if (selectedTemplate === 'creative') {
        const sidebarSections = getSidebarSections();
        const mainSections = getMainSections();
        const personalStyles = getCreativeStyles(sectionScales?.personal || 1);

        const renderCreativeSection = (id: string) => {
            const creativeStyles = getCreativeStyles(sectionScales?.[id] || 1);
            const customSection = data.customSections?.find(s => s.id === id);
            if (customSection) {
                return (
                    <View key={customSection.id} style={{ marginBottom: (20 * (data.sectionSpacing ?? 1)) }}>
                        {/* We use different titles for sidebar vs main usually, but here simplicity is key */}
                        <Text style={sidebarSections.includes(id) ? creativeStyles.sidebarTitle : creativeStyles.sectionTitle}>
                            {customSection.title}
                        </Text>
                        {customSection.items.map((item: any) => (
                            <View key={item.id} style={creativeStyles.expItem}>
                                {(mainSections.includes(id)) && <View style={creativeStyles.bullet} />}
                                <View style={creativeStyles.expHeader}>
                                    <Text style={creativeStyles.companyName}>{item.name}</Text>
                                    <Text style={creativeStyles.itemDate}>{item.date}</Text>
                                </View>
                                {item.city && <Text style={creativeStyles.roleName}>{item.city}</Text>}
                                <PdfFormattedText text={item.description} style={creativeStyles.mainText} />
                            </View>
                        ))}
                    </View>
                );
            }

            switch (id) {
                case 'education':
                    return education.length > 0 && (
                        <View key="education" style={creativeStyles.sidebarContent}>
                            <Text style={creativeStyles.sidebarTitle}>{sectionTitles.education || "Education"}</Text>
                            {education.map((edu: any) => (
                                <View key={edu.id} style={{ marginBottom: (10 * (data.sectionSpacing ?? 1)), flexDirection: 'column', gap: 2 }}>
                                    <Text style={creativeStyles.eduSchool}>{edu.school}</Text>
                                    {edu.degree ? <Text style={creativeStyles.eduDegree}>{edu.degree}</Text> : null}
                                    <Text style={creativeStyles.eduDate}>{edu.startDate} - {edu.endDate}</Text>
                                </View>
                            ))}
                        </View>
                    );
                case 'skills':
                    return skills && skills.length > 0 && (
                        <View key="skills" style={creativeStyles.sidebarContent}>
                            <Text style={creativeStyles.sidebarTitle}>{sectionTitles.skills || "Skills"}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                {skills.filter(s => s && s.trim()).map((skill: string, i: number) => (
                                    <View key={i} style={creativeStyles.skillPill}>
                                        <Text style={creativeStyles.skillText}>{skill.trim()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                case 'experience':
                    return experience.length > 0 && (
                        <View key="experience" style={{ marginBottom: (20 * (data.sectionSpacing ?? 1)) }}>
                            <Text style={creativeStyles.sectionTitle}>{sectionTitles.experience || "Professional Experience"}</Text>
                            {experience.map((exp: any) => (
                                <View key={exp.id} style={creativeStyles.expItem}>
                                    <View style={creativeStyles.bullet} />
                                    <View style={creativeStyles.expHeader}>
                                        <Text style={creativeStyles.companyName}>{exp.company}</Text>
                                        <Text style={{ fontSize: 10, color: '#666' }}>{exp.startDate} - {exp.endDate}</Text>
                                    </View>
                                    <Text style={creativeStyles.roleName}>{exp.role}</Text>
                                    <PdfFormattedText text={exp.description} style={creativeStyles.mainText} />
                                </View>
                            ))}
                        </View>
                    );
                case 'projects':
                    return projects.length > 0 && (
                        <View key="projects" style={{ marginBottom: (20 * (data.sectionSpacing ?? 1)) }}>
                            <Text style={creativeStyles.sectionTitle}>{sectionTitles.projects || "Projects"}</Text>
                            {projects.map((proj: any) => (
                                <View key={proj.id} style={{ marginBottom: (10 * (data.sectionSpacing ?? 1)) }}>
                                    <View style={creativeStyles.expHeader}>
                                        <View style={{ flexDirection: 'column' }}>
                                            <Text style={creativeStyles.companyName}>{proj.name}</Text>
                                        </View>
                                    </View>
                                    {proj.technologies && (
                                        <View style={{ marginBottom: (4 * (data.sectionSpacing ?? 1)), marginTop: (1 * (data.sectionSpacing ?? 1)) }}>
                                            <Text style={{ fontSize: 9, color: '#6b7280', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#e5e7eb', padding: '1 3', borderRadius: 2, alignSelf: 'flex-start' }}>
                                                {proj.technologies}
                                            </Text>
                                        </View>
                                    )}
                                    <PdfFormattedText text={proj.description} style={creativeStyles.mainText} />
                                </View>
                            ))}
                        </View>
                    );
                default: return null;
            }
        }

        return (
            <Document>
                <Page size="A4" style={creativeStyles.page}>
                    <View style={creativeStyles.container} wrap={false}>
                        {/* Sidebar */}
                        <View style={creativeStyles.sidebar}>
                            <View style={{ marginTop: (16 * (data.sectionSpacing ?? 1)) }}>
                                <Text style={personalStyles.name}>{personalInfo.fullName}</Text>
                                {personalInfo.jobTitle && <Text style={personalStyles.role}>{personalInfo.jobTitle}</Text>}
                            </View>

                            {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.website || personalInfo.linkedin || personalInfo.github) && (
                                <View style={{ marginTop: (32 * (data.sectionSpacing ?? 1)) }}>
                                    <Text style={personalStyles.sidebarTitle}>{sectionTitles.contact || "Contact"}</Text>
                                    <View style={{ gap: 8 }}>
                                        {personalInfo.email && <Text style={personalStyles.sidebarText}>{personalInfo.email}</Text>}
                                        {personalInfo.phone && <Text style={personalStyles.sidebarText}>{personalInfo.phone}</Text>}
                                        {personalInfo.location && <Text style={personalStyles.sidebarText}>{personalInfo.location}</Text>}
                                        {personalInfo.website && <Text style={personalStyles.sidebarText}>{personalInfo.website}</Text>}
                                        {personalInfo.linkedin && <Text style={personalStyles.sidebarText}>{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                        {personalInfo.github && <Text style={personalStyles.sidebarText}>{personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                        {/* Social Media */}
                                        {renderSocialMedia({ contact: { color: '#FFFFFF' } })}
                                    </View>
                                </View>
                            )}

                            {sidebarSections.map(renderCreativeSection)}
                        </View>

                        {/* Main Content */}
                        <View style={creativeStyles.main}>
                            {personalInfo.summary && (
                                <View style={{ marginBottom: (32 * (data.sectionSpacing ?? 1)) }}>
                                    <Text style={personalStyles.sectionTitle}>{sectionTitles.summary || "Profile"}</Text>
                                    <PdfFormattedText text={personalInfo.summary} style={personalStyles.mainText} />
                                </View>
                            )}

                            {mainSections.map(renderCreativeSection)}
                        </View>
                    </View>
                    <BrandingFooter />
                </Page>
            </Document>
        )
    }



    // --- CORPORATE TEMPLATE ---


    // --- CLASSIC TEMPLATE (Default) ---
    const renderClassicSection = (id: string) => {
        const classicStyles = getClassicStyles(sectionScales?.[id] || 1);
        const customSection = data.customSections?.find(s => s.id === id);
        if (customSection) {
            return (
                <View key={customSection.id} style={classicStyles.itemGroup}>
                    <Text style={classicStyles.sectionTitle}>{customSection.title}</Text>
                    {customSection.items.map((item: any) => (
                        <View key={item.id} style={{ marginBottom: (5 * (data.sectionSpacing ?? 1)) }}>
                            <View style={classicStyles.row}>
                                <Text style={classicStyles.bold}>{item.name}</Text>
                                <Text style={classicStyles.text}>{item.date}</Text>
                            </View>
                            {item.city && <Text style={classicStyles.italic}>{item.city}</Text>}
                            <PdfFormattedText text={item.description} style={classicStyles.text} />
                        </View>
                    ))}
                </View>
            );
        }

        switch (id) {
            case 'education':
                return education.length > 0 && (
                    <View key="education" style={classicStyles.itemGroup}>
                        <Text style={classicStyles.sectionTitle}>{sectionTitles.education || "Education"}</Text>
                        <View style={{ flexDirection: 'column' }}>
                            {education.map((edu: any) => (
                                <View key={edu.id} style={{ marginBottom: (8 * (data.sectionSpacing ?? 1)) }}>
                                    <View style={classicStyles.row}>
                                        <Text style={{ flexShrink: 1, paddingRight: 8 }}>
                                            <Text style={classicStyles.bold}>{edu.school}</Text>
                                            <Text style={classicStyles.italic}>  {edu.degree}</Text>
                                        </Text>
                                        <Text style={classicStyles.text}>{edu.startDate} - {edu.endDate}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                );
            case 'skills':
                return skills && skills.length > 0 && (
                    <View key="skills" style={classicStyles.itemGroup}>
                        <Text style={classicStyles.sectionTitle}>{sectionTitles.skills || "Skills"}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: (4 * (data.sectionSpacing ?? 1)) }}>
                            {skills.filter(s => s && s.trim()).map((skill: string, i: number) => (
                                <View key={i} style={classicStyles.skillPill}>
                                    <Text style={classicStyles.skillText}>{skill.trim()}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                );
            case 'experience':
                return experience.length > 0 && (
                    <View key="experience" style={classicStyles.itemGroup}>
                        <Text style={classicStyles.sectionTitle}>{sectionTitles.experience || "Professional Experience"}</Text>
                        {experience.map((exp: any) => (
                            <View key={exp.id} style={{ marginBottom: (8 * (data.sectionSpacing ?? 1)) }}>
                                <View style={classicStyles.row}>
                                    <Text style={classicStyles.bold}>{exp.company}</Text>
                                    <Text style={classicStyles.text}>{exp.startDate} - {exp.endDate}</Text>
                                </View>
                                <Text style={classicStyles.italic}>{exp.role}</Text>
                                <PdfFormattedText text={exp.description} style={classicStyles.text} />
                            </View>
                        ))}
                    </View>
                );
            case 'projects':
                return projects.length > 0 && (
                    <View key="projects" style={classicStyles.itemGroup}>
                        <Text style={classicStyles.sectionTitle}>{sectionTitles.projects || "Projects"}</Text>
                        {projects.map((proj: any) => (
                            <View key={proj.id} style={{ marginBottom: (8 * (data.sectionSpacing ?? 1)) }}>
                                <View style={classicStyles.row}>
                                    <Text style={classicStyles.bold}>{proj.name}</Text>
                                    {proj.link && (
                                        <Link src={normalizeUrl(proj.link)} style={{ fontSize: 9, color: proj.linkColor || '#2563eb', textDecoration: 'none' }}>
                                            {proj.linkText || "View Project"}
                                        </Link>
                                    )}
                                </View>
                                {proj.technologies && (
                                    <Text style={{ fontSize: 9, color: '#4b5563', fontStyle: 'italic', marginBottom: (2 * (data.sectionSpacing ?? 1)) }}>
                                        {proj.technologies}
                                    </Text>
                                )}
                                <PdfFormattedText text={proj.description} style={classicStyles.text} />
                            </View>
                        ))}
                    </View>
                );
            default: return null;
        }
    }


    const personalStyles = getClassicStyles(sectionScales?.personal || 1);

    // ——————————————————————————————————————————— VELVET TEMPLATE ———————————————————————————————————————————————————————————————————
    if (selectedTemplate === 'velvet') {
        const vStyles = createScaledStyles({
            page: { flexDirection: 'column', backgroundColor: '#FFFFFF', fontFamily: pdfFontFamily, fontSize: 10, paddingHorizontal: 52, paddingVertical: 44 },
            name: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#111827', letterSpacing: -0.5, marginBottom: 3 },
            jobTitle: { fontSize: 9, textAlign: 'center', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8 },
            rule: { borderBottomWidth: 0.5, borderBottomColor: '#d1d5db', marginBottom: 2 },
            rule2: { borderBottomWidth: 0.5, borderBottomColor: '#d1d5db', marginBottom: 10 },
            contact: { fontSize: 8, color: '#6b7280', textAlign: 'center', lineHeight: 1.5, marginBottom: 18 },
            sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, marginTop: 14 },
            sectionRule: { width: 2, height: 11, backgroundColor: accentColor },
            sectionTitle: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: '#6b7280' },
            divider: { borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', marginBottom: 10 },
            itemGroup: { marginBottom: 9 },
            bold: { fontWeight: 'bold', fontSize: 9.5, color: '#111827' },
            italic: { fontStyle: 'italic', fontSize: 8.5, color: accentColor, marginBottom: 2 },
            text: { fontSize: 8.5, color: '#4b5563', lineHeight: 1.45 },
            date: { fontSize: 7.5, color: '#9ca3af' },
            row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 1 },
            summaryText: { fontSize: 8.5, color: '#4b5563', lineHeight: 1.5 },
        });

        const renderVelvetSection = (id: string) => {
            const customSection = data.customSections?.find(s => s.id === id);
            if (customSection) return (
                <View key={id} style={{ marginBottom: (10 * (data.sectionSpacing ?? 1)) }}>
                    <View style={vStyles.sectionHeader}><View style={vStyles.sectionRule} /><Text style={vStyles.sectionTitle}>{customSection.title}</Text></View>
                    <View style={vStyles.divider} />
                    {customSection.items.map((item: any) => (
                        <View key={item.id} style={vStyles.itemGroup}>
                            <View style={vStyles.row}><Text style={vStyles.bold}>{item.name}</Text><Text style={vStyles.date}>{item.date}</Text></View>
                            <PdfFormattedText text={item.description} style={vStyles.text} />
                        </View>
                    ))}
                </View>
            );
            switch (id) {
                case 'education': return education.length > 0 && (
                    <View key="education" style={{ marginBottom: (10 * (data.sectionSpacing ?? 1)) }}>
                        <View style={vStyles.sectionHeader}><View style={vStyles.sectionRule} /><Text style={vStyles.sectionTitle}>{sectionTitles.education || 'Education'}</Text></View>
                        <View style={vStyles.divider} />
                        {education.map((edu: any) => (
                            <View key={edu.id} style={vStyles.itemGroup}>
                                <View style={vStyles.row}>
                                    <Text style={{ flexShrink: 1, paddingRight: 8 }}>
                                        <Text style={vStyles.bold}>{edu.school}</Text>
                                        <Text style={{ fontSize: 8.5, fontStyle: 'italic', color: '#6b7280' }}>  {edu.degree}</Text>
                                    </Text>
                                    <Text style={vStyles.date}>{edu.startDate} – {edu.endDate}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                );
                case 'skills': return skills && skills.length > 0 && (
                    <View key="skills" style={{ marginBottom: (10 * (data.sectionSpacing ?? 1)) }}>
                        <View style={vStyles.sectionHeader}><View style={vStyles.sectionRule} /><Text style={vStyles.sectionTitle}>{sectionTitles.skills || 'Skills'}</Text></View>
                        <View style={vStyles.divider} />
                        <Text style={{ fontSize: 8.5, color: '#4b5563', lineHeight: 1.6 }}>{skills.filter(s => s && s.trim()).map(s => s.trim()).join('  ·  ')}</Text>
                    </View>
                );
                case 'experience': return experience.length > 0 && (
                    <View key="experience" style={{ marginBottom: (10 * (data.sectionSpacing ?? 1)) }}>
                        <View style={vStyles.sectionHeader}><View style={vStyles.sectionRule} /><Text style={vStyles.sectionTitle}>{sectionTitles.experience || 'Experience'}</Text></View>
                        <View style={vStyles.divider} />
                        {experience.map((exp: any) => (
                            <View key={exp.id} style={vStyles.itemGroup}>
                                <View style={vStyles.row}><Text style={vStyles.bold}>{exp.company}</Text><Text style={vStyles.date}>{exp.startDate} – {exp.endDate}</Text></View>
                                <Text style={vStyles.italic}>{exp.role}</Text>
                                <PdfFormattedText text={exp.description} style={vStyles.text} />
                            </View>
                        ))}
                    </View>
                );
                case 'projects': return projects.length > 0 && (
                    <View key="projects" style={{ marginBottom: (10 * (data.sectionSpacing ?? 1)) }}>
                        <View style={vStyles.sectionHeader}><View style={vStyles.sectionRule} /><Text style={vStyles.sectionTitle}>{sectionTitles.projects || 'Projects'}</Text></View>
                        <View style={vStyles.divider} />
                        {projects.map((proj: any) => (
                            <View key={proj.id} style={vStyles.itemGroup}>
                                <View style={vStyles.row}>
                                    <Text style={vStyles.bold}>{proj.name}</Text>
                                    {proj.link && <Link src={normalizeUrl(proj.link)} style={{ fontSize: 7.5, color: proj.linkColor || accentColor }}>{proj.linkText || 'View'}</Link>}
                                </View>
                                {proj.technologies && <Text style={{ fontSize: 7.5, fontStyle: 'italic', color: '#9ca3af', marginBottom: (2 * (data.sectionSpacing ?? 1)) }}>{proj.technologies}</Text>}
                                <PdfFormattedText text={proj.description} style={vStyles.text} />
                            </View>
                        ))}
                    </View>
                );
                default: return null;
            }
        };

        const contactLine = [personalInfo.email, personalInfo.phone, personalInfo.location,
        personalInfo.website?.replace(/^https?:\/\/(www\.)?/, ''),
        personalInfo.linkedin?.replace(/^https?:\/\/(www\.)?/, ''),
        personalInfo.github?.replace(/^https?:\/\/(www\.)?/, '')
        ].filter(Boolean).join('   ·   ');

        return (
            <Document>
                <Page size="A4" style={vStyles.page}>
                    {/* Centered header */}
                    <Text style={vStyles.name}>{personalInfo.fullName}</Text>
                    {personalInfo.jobTitle && <Text style={vStyles.jobTitle}>{personalInfo.jobTitle}</Text>}
                    {/* Double hairline rule */}
                    <View style={vStyles.rule} />
                    <View style={vStyles.rule2} />
                    {contactLine.length > 0 && <Text style={vStyles.contact}>{contactLine}</Text>}

                    {/* Summary */}
                    {personalInfo.summary && (
                        <View style={{ marginBottom: (12 * (data.sectionSpacing ?? 1)) }}>
                            <View style={vStyles.sectionHeader}><View style={vStyles.sectionRule} /><Text style={vStyles.sectionTitle}>Profile</Text></View>
                            <View style={vStyles.divider} />
                            <PdfFormattedText text={personalInfo.summary} style={vStyles.summaryText} />
                        </View>
                    )}

                    {sectionOrder.map(renderVelvetSection)}

                    <BrandingFooter />
                </Page>
            </Document>
        );
    }
    // ─── CLASSIC TEMPLATE (Default fallback) ─────────────────────────────────────────
    return (
        <Document>
            <Page size="A4" style={classicStyles.page}>
                <View style={{ width: '100%', height: '100%' }} wrap={false}>
                    <View style={classicStyles.header}>
                        <Text style={personalStyles.name}>{personalInfo.fullName}</Text>
                        {personalInfo.jobTitle && <Text style={{ fontSize: 14, color: '#4b5563', marginBottom: (8 * (data.sectionSpacing ?? 1)), textTransform: 'uppercase' }}>{personalInfo.jobTitle}</Text>}
                        <Text style={personalStyles.contact}>
                            {[
                                personalInfo.email,
                                personalInfo.phone,
                                personalInfo.location,
                                personalInfo.website,
                                personalInfo.linkedin,
                                personalInfo.github
                            ].filter(Boolean).join(' | ')}
                        </Text>
                        {/* Social Media */}
                        <View style={{ alignItems: 'center', marginTop: (4 * (data.sectionSpacing ?? 1)) }}>
                            {renderSocialMedia({ contact: { color: accentColor } })}
                        </View>
                    </View>

                    {personalInfo.summary && (
                        <View style={classicStyles.itemGroup}>
                            <Text style={personalStyles.sectionTitle}>Professional Summary</Text>
                            <PdfFormattedText text={personalInfo.summary} style={personalStyles.text} />
                        </View>
                    )}

                    {sectionOrder.map(renderClassicSection)}
                </View>

                <BrandingFooter />
            </Page>
        </Document>
    );
};
