/* eslint-disable jsx-a11y/alt-text */
"use client";
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link, Font, Image } from '@react-pdf/renderer';
import { ResumeData } from '@/store/useResumeStore';
import { PdfFormattedText } from '@/components/preview/PdfFormattedText';

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
    // Force ALL fonts to Roboto
    'roboto': 'Roboto',
    'open-sans': 'Roboto',
    'opensans': 'Roboto',
    'lato': 'Roboto',
    'nunito': 'Roboto',
    'merriweather': 'Roboto',
    'lora': 'Roboto',
    'playfair': 'Roboto',
    'librebaskerville': 'Roboto',
    'inter': 'Roboto',
    'montserrat': 'Roboto',
    'poppins': 'Roboto',
    'source-sans': 'Roboto',
    'sourcesans': 'Roboto',
    'oswald': 'Roboto',
    'jetbrains': 'Roboto',
    'courier': 'Roboto',
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
        isBrandingEnabled,
        fontFamily,
        sectionOrder,
        sectionScales,
        sectionTitles
    } = data;

    const customThemeColor = themeColor;
    const fontId = fontFamily;

    const effectiveFontId = fontId || 'roboto';

    // Client-Side Rendering: Enable Custom Fonts
    // map user selection to registered font family
    let pdfFontFamily = PDF_FONT_MAP[effectiveFontId.toLowerCase()] || 'Helvetica';

    // Fallback if mapping fails
    if (!pdfFontFamily) pdfFontFamily = 'Helvetica';

    console.log(`Font "${effectiveFontId}" → "${pdfFontFamily}"`);

    // Use default if not set
    const accentColor = customThemeColor || '#112e51';


    // Helper to scale styles dynamically
    const createScaledStyles = (styles: any, extraScale: number = 1) => {
        const globalScale = contentScale || 1;
        if (globalScale === 1 && extraScale === 1) return StyleSheet.create(styles);
        const scale = globalScale * extraScale;
        const noScaleProps = new Set(['flexGrow', 'flexShrink', 'zIndex', 'opacity', 'fontWeight', 'lineHeight', 'flex', 'top', 'bottom', 'left', 'right']);

        const mapStyles = (obj: any): any => {
            if (Array.isArray(obj)) {
                return obj.map(mapStyles);
            }
            const newObj: any = {};
            for (const key in obj) {
                const val = obj[key];
                if (typeof val === 'number' && !noScaleProps.has(key)) {
                    newObj[key] = val * scale;
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
        branding: {
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 8,
            color: '#9ca3af',
            fontFamily: pdfFontFamily,
        }
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

    // Creative Template Styles
    // Creative Template Styles
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
            borderBottomColor: 'rgba(255,255,255,0.2)',
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
        branding: {
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 8,
            color: '#9ca3af',
            fontFamily: pdfFontFamily,
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

    const getCorporateStyles = (s = 1) => createScaledStyles({
        page: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            fontFamily: pdfFontFamily,
        },
        container: {
            flexDirection: 'row',
            width: '100%',
            flex: 1,
        },
        sidebar: {
            width: '35%',
            backgroundColor: accentColor,
            paddingVertical: 24,
            paddingHorizontal: 18,
            color: '#FFFFFF',
            flexGrow: 1,
        },
        main: {
            width: '65%',
            padding: 24,
            backgroundColor: '#f9f9f9',
            flexGrow: 1,
        },
        sidebarHeading: {
            fontSize: 8, // Reduced from 10
            fontWeight: 'bold',
            textTransform: 'uppercase',
            // Border removed here, handled by explicit line View
            marginBottom: 4,
            marginTop: 15,
            letterSpacing: 1,
        },
        sidebarText: {
            fontSize: 7, // Reduced from 9
            marginBottom: 5,
            opacity: 0.9,
            lineHeight: 1.4,
        },
        photoContainer: {
            width: 90, // Reduced from 120
            height: 90,
            borderRadius: 45,
            backgroundColor: 'rgba(255,255,255,0.2)',
            marginBottom: 18,
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        },
        photoText: {
            fontSize: 36, // Reduced from 48
            fontWeight: 'bold',
            color: 'rgba(255,255,255,0.6)',
        },
        mainHeading: {
            fontSize: 9,
            fontWeight: 'bold',
            color: accentColor,
            textTransform: 'uppercase',
            borderBottomWidth: 2,
            borderBottomColor: '#d1d5db',
            paddingBottom: 3,
            marginBottom: 9,
            marginTop: 11,
            letterSpacing: 1,
        },
        name: {
            fontSize: 18, // Reduced from 24
            fontWeight: 'bold',
            color: accentColor,
            letterSpacing: 1,
            marginBottom: 3,
        },
        jobTitle: {
            fontSize: 9, // Reduced from 12
            color: '#4b5563',
            marginBottom: 15,
        },
        itemTitle: {
            fontSize: 8, // Reduced from 10
            fontWeight: 'bold',
            color: '#111827',
        },
        itemSub: {
            fontSize: 7, // Reduced from 9
            color: '#4b5563',
        },
        itemDate: {
            fontSize: 7, // Reduced from 9
            color: '#6b7280',
        },
        itemDesc: { fontSize: 9, color: '#4b5563', marginTop: 2 },
        skillPill: {
            backgroundColor: 'rgba(255,255,255,0.15)',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.25)',
        },
        skillText: {
            fontSize: 9,
            color: '#FFFFFF',
        },
    }, s);
    const corporateStyles = getCorporateStyles(1);

    const getExecutiveStyles = (s = 1) => createScaledStyles({
        page: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            fontFamily: pdfFontFamily,
        },
        container: {
            flexDirection: 'row',
            width: '100%',
        },
        header: {
            backgroundColor: customThemeColor || '#333333',
            flexDirection: 'row',
            paddingVertical: 18,
            paddingHorizontal: 24,
            alignItems: 'center',
        },
        headerName: {
            fontSize: 20, // Reduced from 26
            fontWeight: 'bold',
            color: '#FFFFFF',
            letterSpacing: 1,
        },
        headerRole: {
            fontSize: 9, // Reduced from 12
            color: 'rgba(255,255,255,0.8)',
            marginTop: 3,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        photo: {
            width: 60, // Reduced from 80
            height: 60,
            borderRadius: 6,
            backgroundColor: 'rgba(255,255,255,0.2)',
            // Border handled dynamically
            marginRight: 18,
        },
        body: {
            flexDirection: 'row',
            flexGrow: 1,
        },
        main: {
            width: '65%',
            padding: 18,
        },
        sidebar: {
            width: '35%',
            backgroundColor: customThemeColor || '#333333',
            padding: 18,
            color: '#FFFFFF',
        },
        sectionTitle: {
            fontSize: 9, // Reduced from 12
            fontWeight: 'bold',
            color: '#4b5563', // Changed from #c9a050 (gold) to gray
            textTransform: 'uppercase',
            borderBottomWidth: 2,
            borderBottomColor: '#D1D5DB', // Changed from #c9a050 to gray
            paddingBottom: 3,
            marginBottom: 9,
            marginTop: 11,
            letterSpacing: 1,
        },
        sidebarTitle: {
            fontSize: 8, // Reduced from 10
            fontWeight: 'bold',
            color: '#D1D5DB', // Changed from #c9a050 (gold) to gray
            textTransform: 'uppercase',
            // Border removed here, replaced by explicit View
            marginBottom: 4,
            marginTop: 11,
            letterSpacing: 1,
        },
        itemTitle: { fontSize: 11, fontWeight: 'bold' },
        itemDate: { fontSize: 9 },
        itemCity: { fontSize: 9, fontStyle: 'italic' },
        itemDesc: { fontSize: 9, marginTop: 2, color: '#4b5563' },
    }, s);
    const executiveStyles = getExecutiveStyles(1);

    const getDesignerStyles = (s = 1) => createScaledStyles({
        page: {
            flexDirection: 'column',
            backgroundColor: '#f5f0e8',
            fontFamily: pdfFontFamily,
        },
        header: {
            flexDirection: 'row',
            minHeight: 105, // Reduced from 140
        },
        headerLeft: {
            width: '50%',
            backgroundColor: customThemeColor || '#1a3a3a',
            padding: 24, // Reduced from 32
            justifyContent: 'center',
        },
        headerRight: {
            width: '50%',
            backgroundColor: '#f5f0e8',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 15, // Reduced from 20
        },
        name: {
            fontSize: 24, // Reduced from 32
            fontWeight: 'bold',
            color: '#FFFFFF',
            textTransform: 'lowercase',
        },
        role: {
            fontSize: 8, // Reduced from 10
            color: 'rgba(255,255,255,0.8)',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginTop: 6,
        },
        photo: {
            width: 84, // Reduced from 112
            height: 84,
            borderRadius: 42,
            // Border handled dynamically
        },
        body: {
            flexDirection: 'row',
            minHeight: '100%',
        },
        leftCol: {
            width: '50%',
            backgroundColor: customThemeColor || '#1a3a3a',
            padding: 24, // Reduced from 32
            color: '#FFFFFF',
            minHeight: '100%',
        },
        rightCol: {
            width: '50%',
            backgroundColor: '#FFFFFF',
            padding: 24, // Reduced from 32
            color: '#1a3a3a',
            minHeight: '100%',
        },
        sectionTitle: {
            fontSize: 9, // Reduced from 12
            fontWeight: 'bold',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            marginBottom: 11,
            letterSpacing: 2,
            borderBottomWidth: 1,
            borderBottomColor: '#D1D5DB', // Changed from rgba(255,255,255,0.2) to Gray
            paddingBottom: 3,
        },
        sectionTitleRight: {
            fontSize: 9, // Reduced from 12
            fontWeight: 'bold',
            color: customThemeColor || '#1a3a3a',
            textTransform: 'uppercase',
            marginBottom: 11,
            letterSpacing: 2,
            borderBottomWidth: 1,
            borderBottomColor: customThemeColor || '#1a3a3a',
            paddingBottom: 3,
        },
        skillPill: {
            backgroundColor: '#FFFFFF',
            borderRadius: 9,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginBottom: 5,
            marginRight: 5,
        },
        skillText: {
            fontSize: 7, // Reduced from 9
            color: customThemeColor || '#1a3a3a',
            fontWeight: 'bold',
        }
    }, s);
    const designerStyles = getDesignerStyles(1);

    const getGithubStyles = (s = 1) => createScaledStyles({
        page: {
            flexDirection: 'column',
            backgroundColor: '#0d1117',
            color: '#c9d1d9',
            paddingVertical: 30, // Reduced
            paddingHorizontal: 40, // Reduced
            fontSize: 9, // Reduced from 10
            fontFamily: 'JetBrains Mono',
            alignItems: 'stretch',
        },
        header: {
            marginBottom: 24,
            paddingBottom: 18,
            borderBottomWidth: 1,
            borderBottomColor: '#30363d',
            width: '100%',
        },
        name: {
            fontSize: 24, // Reduced from 30
            color: '#58a6ff',
            fontWeight: 'bold',
            marginBottom: 6,
        },
        contact: {
            fontSize: 9, // Reduced from 12
            color: '#8b949e',
            lineHeight: 1.4,
        },
        repoBox: {
            borderWidth: 1,
            borderColor: '#30363d',
            backgroundColor: '#161b22',
            borderRadius: 4,
            padding: 12,
            marginBottom: 12,
            width: '100%',
        },
        sectionTitle: {
            fontSize: 16, // Reduced from 20
            fontWeight: 'bold',
            color: '#c9d1d9',
            marginBottom: 12, // Reduced from 16
            marginTop: 24, // Reduced from 32
            borderBottomWidth: 1,
            borderBottomColor: '#30363d',
            paddingBottom: 6,
        },
        langTag: {
            fontSize: 9, // Reduced from 12
            color: '#8b949e',
            marginLeft: 6,
            backgroundColor: '#30363d',
            borderWidth: 1,
            borderColor: '#30363d',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
        },
        techTag: {
            fontSize: 8,
            backgroundColor: '#e5e7eb',
            color: '#374151',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 2,
            alignSelf: 'flex-start'
        },

        link: {
            color: '#58a6ff',
            textDecoration: 'none',
        },
        description: {
            color: '#8b949e',
            marginTop: 3,
            lineHeight: 1.5,
            fontSize: 9, // Reduced from 12
        },
        commitGraph: {
            flexDirection: 'row',
            gap: 2,
            marginBottom: 16,
        },
        commitBox: {
            width: 8,
            height: 8,
            backgroundColor: '#21262d',
            borderRadius: 2,
        },
        itemName: { color: '#58a6ff', fontWeight: 'bold' },
        itemDate: { color: '#8b949e' },
        itemCity: { color: '#c9d1d9', marginTop: 2 },
        skillPill: {
            backgroundColor: '#161b22',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#30363d',
        },
        skillText: {
            fontSize: 9,
            color: '#8b949e',
        },
    }, s);
    const githubStyles = getGithubStyles(1);


    // --- SECTION RENDERERS (Internal Helper) ---
    const sidebarIds = ['education', 'skills'];
    const getSidebarSections = () => sectionOrder.filter(id => sidebarIds.includes(id));
    const getMainSections = () => sectionOrder.filter(id => !sidebarIds.includes(id) && id !== 'personal');

    // --- GITHUB TEMPLATE ---
    if (selectedTemplate === 'github') {
        const renderGithubSection = (id: string) => {
            const githubStyles = getGithubStyles(sectionScales?.[id] || 1);
            const customSection = data.customSections?.find(s => s.id === id);
            if (customSection) {
                return (
                    <View key={customSection.id} style={{ marginBottom: 20 }}>
                        <Text style={githubStyles.sectionTitle}>// {customSection.title}</Text>
                        {customSection.items.map((item: any) => (
                            <View key={item.id} style={githubStyles.repoBox}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={githubStyles.itemName}>{item.name}</Text>
                                    <Text style={githubStyles.itemDate}>{item.date}</Text>
                                </View>
                                {item.city && <Text style={githubStyles.itemCity}>@ {item.city}</Text>}
                                <PdfFormattedText text={`/* ${item.description} */`} style={githubStyles.description} />
                            </View>
                        ))}
                    </View>
                );
            }

            switch (id) {
                case 'experience':
                    return experience.length > 0 && (
                        <View key="experience" style={{ marginBottom: 20 }}>
                            <Text style={githubStyles.sectionTitle}>// {sectionTitles.experience || "Professional Experience"}</Text>
                            {experience.map((exp: any) => (
                                <View key={exp.id} style={githubStyles.repoBox}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ color: '#58a6ff', fontWeight: 'bold' }}>{exp.role}</Text>
                                        <Text style={{ color: '#8b949e' }}>{exp.startDate} - {exp.endDate}</Text>
                                    </View>
                                    <Text style={{ color: '#c9d1d9', marginTop: 2 }}>@ {exp.company}</Text>
                                    <PdfFormattedText text={`/* ${exp.description} */`} style={githubStyles.description} />
                                </View>
                            ))}
                        </View>
                    );
                case 'projects':
                    return projects.length > 0 && (
                        <View key="projects" style={{ marginBottom: 20 }}>
                            <Text style={githubStyles.sectionTitle}>// {sectionTitles.projects || "Projects"}</Text>
                            {projects.map((proj: any) => (
                                <View key={proj.id} style={githubStyles.repoBox}>
                                    <View style={{ flexDirection: 'column' }}>
                                        <Text style={{ color: '#58a6ff', fontWeight: 'bold', marginBottom: 2 }}>{proj.name}</Text>
                                        {proj.technologies && (
                                            <Text style={githubStyles.langTag}>// {proj.technologies}</Text>
                                        )}
                                    </View>
                                    <PdfFormattedText text={proj.description} style={githubStyles.description} />
                                    {proj.link && (
                                        <Link src={proj.link} style={{ color: '#8b949e', fontSize: 8, marginTop: 4, textDecoration: 'none' }}>
                                            {proj.linkText || "View Project"}
                                        </Link>
                                    )}
                                </View>
                            ))}
                        </View>
                    );
                case 'education':
                    return education.length > 0 && (
                        <View key="education" style={{ marginBottom: 20 }}>
                            <Text style={githubStyles.sectionTitle}>// {sectionTitles.education || "Education"}</Text>
                            {education.map((edu: any) => (
                                <View key={edu.id} style={{ marginBottom: 10 }}>
                                    <Text style={{ color: '#c9d1d9' }}>{edu.school}</Text>
                                    <Text style={{ color: '#8b949e', fontSize: 9 }}>{edu.degree}</Text>
                                    <Text style={{ color: '#8b949e', fontSize: 9 }}>{edu.startDate} - {edu.endDate}</Text>
                                </View>
                            ))}
                        </View>
                    );
                case 'skills':
                    return skills && skills.length > 0 && (
                        <View key="skills" style={{ marginBottom: 20 }}>
                            <Text style={githubStyles.sectionTitle}>// {sectionTitles.skills || "Skills"}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                {skills.filter(s => s && s.trim()).map((skill: string, i: number) => (
                                    <View key={i} style={githubStyles.skillPill}>
                                        <Text style={githubStyles.skillText}>{skill.trim()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                default: return null;
            }
        };

        // GitHub uses a 2-column layout for the bottom part (Education/Skills) in the original code,
        // but to fully support arbitrary reordering we might need to be flexible.
        // However, the user request implies they want to reorder *sections*.
        // The original logic had Experience/Projects full width, then Education/Skills split.
        // Let's stick to the original layout structure for the containers but reorder content where possible,
        // OR fully linearize it if the user wants total control.
        // Given the complex grid, let's keep the split but allow reordering *within* the split if they were in the same area,
        // or just render strictly linearly if that's safer for "Drag and Drop".
        // The previous code had: Experience (full), Projects (full), [Education, Skills] (split).
        // Let's attempt to render them all linearly for maximum flexibility if that's what DND implies,
        // OR map them to specific zones. 
        // For GitHub, let's go linear for simplicity to match the "code" aesthetic.

        return (
            <Document>
                <Page size="A4" style={githubStyles.page}>
                    <View style={{ width: '100%', height: '100%' }} wrap={false}>
                        <View style={githubStyles.header}>
                            <Text style={githubStyles.name}>function {personalInfo.fullName.replace(/\s+/g, '_')}()</Text>
                            <Text style={githubStyles.contact}>
                                "role": "{personalInfo.jobTitle}",{"\n"}
                                "email": "{personalInfo.email}",{"\n"}
                                "location": "{personalInfo.location}",{"\n"}
                                "github": "{personalInfo.github}"
                            </Text>
                        </View>

                        {sectionOrder.map(renderGithubSection)}
                    </View>
                    {isBrandingEnabled && <Text style={styles.branding} fixed>Powered by LoneStar</Text>}
                </Page>
            </Document>
        )
    }

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
                        <View key="education" style={{ marginBottom: 20 }}>
                            <Text style={minimalistStyles.sectionTitle}>{sectionTitles.education || "Education"}</Text>
                            {education.map((edu: any) => (
                                <View key={edu.id} style={{ marginBottom: 8 }}>
                                    <Text style={minimalistStyles.company}>{edu.school}</Text>
                                    <Text style={minimalistStyles.title}>{edu.degree}</Text>
                                    <Text style={minimalistStyles.date}>{edu.startDate} – {edu.endDate}</Text>
                                </View>
                            ))}
                        </View>
                    );
                case 'skills':
                    return skills && skills.length > 0 && (
                        <View key="skills" style={{ marginBottom: 20 }}>
                            <Text style={minimalistStyles.sectionTitle}>{sectionTitles.skills || "Skills"}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
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
                                        <Text style={minimalistStyles.date}>{exp.startDate} – {exp.endDate}</Text>
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
                                        <View style={{ marginTop: 2, marginBottom: 2 }}>
                                            <Text style={{ fontSize: 9, backgroundColor: '#f3f4f6', color: '#374151', padding: '1 3', borderRadius: 2, alignSelf: 'flex-start' }}>
                                                {proj.technologies}
                                            </Text>
                                        </View>
                                    )}
                                    <PdfFormattedText text={proj.description} style={{ ...minimalistStyles.description, marginBottom: 4 }} />
                                    {proj.link && (
                                        <Link src={proj.link} style={{ fontSize: 9, marginTop: 4, fontStyle: 'italic', color: '#2563eb', textDecoration: 'none' }}>
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
                            {personalInfo.jobTitle && <Text style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16, fontFamily: 'Times-Roman', textTransform: 'uppercase', letterSpacing: 2 }}>{personalInfo.jobTitle}</Text>}
                            <Text style={minimalistStyles.contact}>{personalInfo.email} • {personalInfo.phone} • {personalInfo.location}</Text>
                            <Text style={minimalistStyles.contact}>
                                {[personalInfo.website, personalInfo.linkedin, personalInfo.github].filter(Boolean).map(s => s?.replace(/^https?:\/\/(www\.)?/, '')).join(' • ')}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ width: '35%', marginRight: 20 }}>
                                {leftSections.map(renderMinimalistSection)}
                            </View>
                            <View style={{ width: '60%' }}>
                                {personalInfo.summary && (
                                    <View style={{ marginBottom: 20 }}>
                                        <Text style={minimalistStyles.sectionTitle}>{sectionTitles.summary || "Profile"}</Text>
                                        <PdfFormattedText text={personalInfo.summary} style={{ fontSize: 10, lineHeight: 1.4, fontFamily: 'Times-Roman' }} />
                                    </View>
                                )}
                                {rightSections.map(renderMinimalistSection)}
                            </View>
                        </View>
                    </View>
                    {isBrandingEnabled && <Text style={styles.branding} fixed>Powered by LoneStar</Text>}
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
                                <View key={item.id} style={{ marginBottom: 8 }}>
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
                                <View key={edu.id} style={{ marginBottom: 8 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{edu.school}</Text>
                                    <Text style={{ fontSize: 9 }}>{edu.degree}</Text>
                                    <Text style={{ fontSize: 9, color: '#666' }}>{edu.startDate} - {edu.endDate}</Text>
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
                                        <Text style={{ fontWeight: 'bold', fontSize: 11 }}>{exp.company}</Text>
                                        <Text style={{ fontSize: 10, color: '#666' }}>{exp.startDate} - {exp.endDate}</Text>
                                    </View>
                                    <Text style={{
                                        fontSize: 10,
                                        color: '#6b7280', // gray-500
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        marginBottom: 4
                                    }}>{exp.role}</Text>
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
                                    <View style={{ marginBottom: 6 }}>
                                        <Text style={{ fontWeight: 'bold', fontSize: 11, color: '#111827' }}>{proj.name}</Text>
                                        {proj.technologies && (
                                            <View style={{ flexDirection: 'row', marginTop: 3 }}>
                                                <Text style={{ fontSize: 9, backgroundColor: '#e5e7eb', color: '#4b5563', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                                                    {proj.technologies}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <PdfFormattedText text={proj.description} style={{ fontSize: 10, lineHeight: 1.4, color: '#4b5563', marginBottom: 4 }} />
                                    {proj.link && (
                                        <Link src={proj.link} style={{ fontSize: 9, color: '#2563eb', fontWeight: 'bold', marginTop: 4, textDecoration: 'none' }}>
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
                    {isBrandingEnabled && <Text style={styles.branding} fixed>Powered by LoneStar</Text>}
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
                    <View key={customSection.id} style={{ marginBottom: 20 }}>
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
                                <View key={edu.id} style={{ marginBottom: 10 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{edu.school}</Text>
                                    <Text style={{ fontSize: 9 }}>{edu.degree}</Text>
                                    <Text style={{ fontSize: 9, opacity: 0.8 }}>{edu.startDate} - {edu.endDate}</Text>
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
                        <View key="experience" style={{ marginBottom: 20 }}>
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
                        <View key="projects" style={{ marginBottom: 20 }}>
                            <Text style={creativeStyles.sectionTitle}>{sectionTitles.projects || "Projects"}</Text>
                            {projects.map((proj: any) => (
                                <View key={proj.id} style={{ marginBottom: 10 }}>
                                    <View style={creativeStyles.expHeader}>
                                        <View style={{ flexDirection: 'column' }}>
                                            <Text style={creativeStyles.companyName}>{proj.name}</Text>
                                        </View>
                                    </View>
                                    {proj.technologies && (
                                        <View style={{ marginBottom: 4, marginTop: 1 }}>
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
                            <View style={{ marginTop: 16 }}>
                                <Text style={personalStyles.name}>{personalInfo.fullName}</Text>
                                {personalInfo.jobTitle && <Text style={personalStyles.role}>{personalInfo.jobTitle}</Text>}
                            </View>

                            {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.website || personalInfo.linkedin || personalInfo.github) && (
                                <View style={{ marginTop: 32 }}>
                                    <Text style={personalStyles.sidebarTitle}>{sectionTitles.contact || "Contact"}</Text>
                                    <View style={{ gap: 8 }}>
                                        {personalInfo.email && <Text style={personalStyles.sidebarText}>{personalInfo.email}</Text>}
                                        {personalInfo.phone && <Text style={personalStyles.sidebarText}>{personalInfo.phone}</Text>}
                                        {personalInfo.location && <Text style={personalStyles.sidebarText}>{personalInfo.location}</Text>}
                                        {personalInfo.website && <Text style={personalStyles.sidebarText}>{personalInfo.website}</Text>}
                                        {personalInfo.linkedin && <Text style={personalStyles.sidebarText}>{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                        {personalInfo.github && <Text style={personalStyles.sidebarText}>{personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                    </View>
                                </View>
                            )}

                            {sidebarSections.map(renderCreativeSection)}
                        </View>

                        {/* Main Content */}
                        <View style={creativeStyles.main}>
                            {personalInfo.summary && (
                                <View style={{ marginBottom: 32 }}>
                                    <Text style={personalStyles.sectionTitle}>{sectionTitles.summary || "Profile"}</Text>
                                    <PdfFormattedText text={personalInfo.summary} style={personalStyles.mainText} />
                                </View>
                            )}

                            {mainSections.map(renderCreativeSection)}
                        </View>
                    </View>
                    {isBrandingEnabled && <Text style={styles.branding} fixed>Powered by LoneStar</Text>}
                </Page>
            </Document>
        )
    }



    // --- CORPORATE TEMPLATE ---
    if (selectedTemplate === 'corporate') {
        const personalStyles = getCorporateStyles(sectionScales?.personal || 1);
        const renderCorporateSection = (id: string, isSidebar: boolean) => {
            const corporateStyles = getCorporateStyles(sectionScales?.[id] || 1);
            const customSection = data.customSections?.find(s => s.id === id);
            if (customSection) {
                return (
                    <View key={id} style={{ marginBottom: 15 }}>
                        <Text style={isSidebar ? corporateStyles.sidebarHeading : corporateStyles.mainHeading}>
                            {customSection.title}
                        </Text>
                        <View>
                            {customSection.items.map((item: any) => (
                                <View key={item.id} style={{ marginBottom: 8 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={corporateStyles.itemTitle}>{item.name}</Text>
                                        <Text style={corporateStyles.itemDate}>{item.date}</Text>
                                    </View>
                                    {item.city && <Text style={corporateStyles.itemSub}>{item.city}</Text>}
                                    <PdfFormattedText text={item.description} style={corporateStyles.itemDesc} />
                                </View>
                            ))}
                        </View>
                    </View>
                );
            }

            switch (id) {
                case 'education':
                    return education.length > 0 && (
                        <View key="education" style={{ marginBottom: 15 }}>
                            <Text style={corporateStyles.mainHeading}>{sectionTitles.education || "Education"}</Text>
                            <View>
                                {education.map((edu: any) => (
                                    <View key={edu.id} style={{ marginBottom: 10 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={corporateStyles.itemTitle}>{edu.degree}</Text>
                                            <Text style={corporateStyles.itemDate}>{edu.startDate} - {edu.endDate}</Text>
                                        </View>
                                        <Text style={corporateStyles.itemSub}>{edu.school}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                case 'experience':
                    return experience.length > 0 && (
                        <View key="experience" style={{ marginBottom: 15 }}>
                            <Text style={corporateStyles.mainHeading}>{sectionTitles.experience || "Professional Experience"}</Text>
                            <View>
                                {experience.map((exp: any) => (
                                    <View key={exp.id} style={{ marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={corporateStyles.itemTitle}>{exp.role}</Text>
                                            <Text style={corporateStyles.itemDate}>{exp.startDate} - {exp.endDate}</Text>
                                        </View>
                                        <Text style={corporateStyles.itemSub}>{exp.company}</Text>
                                        <PdfFormattedText text={exp.description} style={corporateStyles.itemDesc} />
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                case 'projects':
                    return projects.length > 0 && (
                        <View key="projects" style={{ marginBottom: 15 }}>
                            <Text style={corporateStyles.mainHeading}>{sectionTitles.projects || "Projects"}</Text>
                            <View>
                                {projects.map((proj: any) => (
                                    <View key={proj.id} style={{ marginBottom: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={corporateStyles.itemTitle}>{proj.name}</Text>
                                        </View>
                                        {proj.technologies && (
                                            <View style={{ marginTop: 2, marginBottom: 2 }}>
                                                <Text style={corporateStyles.techTag}>
                                                    {proj.technologies}
                                                </Text>
                                            </View>
                                        )}
                                        <PdfFormattedText text={proj.description} style={corporateStyles.itemDesc} />
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                default: return null;
            }
        };

        return (
            <Document>
                <Page size="A4" style={corporateStyles.page}>
                    <View style={corporateStyles.container} wrap={false}>
                        <View style={corporateStyles.sidebar}>
                            <View style={[
                                corporateStyles.photoContainer,
                                {
                                    borderRadius: 64,
                                    borderTopWidth: (personalInfo.photoFilters?.borderWidth !== undefined && personalInfo.photoFilters?.borderWidth !== null) ? Number(personalInfo.photoFilters.borderWidth) : 0,
                                    borderRightWidth: (personalInfo.photoFilters?.borderWidth !== undefined && personalInfo.photoFilters?.borderWidth !== null) ? Number(personalInfo.photoFilters.borderWidth) : 0,
                                    borderBottomWidth: (personalInfo.photoFilters?.borderWidth !== undefined && personalInfo.photoFilters?.borderWidth !== null) ? Number(personalInfo.photoFilters.borderWidth) : 0,
                                    borderLeftWidth: (personalInfo.photoFilters?.borderWidth !== undefined && personalInfo.photoFilters?.borderWidth !== null) ? Number(personalInfo.photoFilters.borderWidth) : 0,
                                    borderColor: personalInfo.photoFilters?.borderColor || 'transparent',
                                    borderStyle: 'solid',
                                    overflow: 'hidden'
                                }
                            ]}>
                                {personalInfo.photo ? (
                                    <Image
                                        src={personalInfo.photo}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 30, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>
                                            {personalInfo.fullName?.charAt(0) || '?'}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.website || personalInfo.linkedin || personalInfo.github) && (
                                <View style={{ marginBottom: 15 }}>
                                    <Text style={corporateStyles.sidebarHeading}>{sectionTitles.contact || "Contact"}</Text>
                                    <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 9 }} />
                                    <View>
                                        {personalInfo.email && <Text style={[corporateStyles.sidebarText, { marginBottom: 6 }]}>{personalInfo.email}</Text>}
                                        {personalInfo.phone && <Text style={[corporateStyles.sidebarText, { marginBottom: 6 }]}>{personalInfo.phone}</Text>}
                                        {personalInfo.location && <Text style={[corporateStyles.sidebarText, { marginBottom: 6 }]}>{personalInfo.location}</Text>}
                                        {personalInfo.website && <Text style={[corporateStyles.sidebarText, { marginBottom: 6 }]}>{personalInfo.website.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                        {personalInfo.linkedin && <Text style={[corporateStyles.sidebarText, { marginBottom: 6 }]}>{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                        {personalInfo.github && <Text style={corporateStyles.sidebarText}>{personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                    </View>
                                </View>
                            )}

                            {skills && skills.length > 0 && (
                                <View style={{ marginBottom: 15 }}>
                                    <Text style={corporateStyles.sidebarHeading}>{sectionTitles.skills || "Skills"}</Text>
                                    <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 9 }} />
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                        {skills.filter(s => s && s.trim()).map((skill, i) => (
                                            <View key={i} style={corporateStyles.skillPill}>
                                                <Text style={corporateStyles.skillText}>{skill.trim()}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={corporateStyles.main}>
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ fontSize: 24 * (sectionScales?.personal || 1), fontWeight: 'bold', color: accentColor }}>{personalInfo.fullName}</Text>
                                <Text style={{ fontSize: 12 * (sectionScales?.personal || 1), color: '#4b5563', marginTop: 4 }}>{personalInfo.jobTitle}</Text>
                            </View>

                            {personalInfo.summary && (
                                <View style={{ marginBottom: 15 }}>
                                    <Text style={personalStyles.mainHeading}>{sectionTitles.summary || "Summary"}</Text>
                                    <PdfFormattedText text={personalInfo.summary} style={{ fontSize: 9 * (sectionScales?.personal || 1), color: '#4b5563', lineHeight: 1.4 }} />
                                </View>
                            )}

                            {sectionOrder.filter(id => !['personal', 'skills'].includes(id)).map(id => renderCorporateSection(id, false))}
                        </View>
                    </View>
                    {isBrandingEnabled && <Text style={styles.branding} fixed>Powered by LoneStar</Text>}
                </Page>
            </Document>
        );
    }

    // --- EXECUTIVE TEMPLATE ---
    if (selectedTemplate === 'executive') {
        const goldColor = '#D1D5DB'; // Changed from #c9a050 to Gray
        const darkGray = customThemeColor || '#333333';
        const personalStyles = getExecutiveStyles(sectionScales?.personal || 1);

        const renderExecutiveSection = (id: string) => {
            const executiveStyles = getExecutiveStyles(sectionScales?.[id] || 1);
            const customSection = data.customSections?.find(s => s.id === id);
            if (customSection) {
                return (
                    <View key={id} style={{ marginBottom: 15 }}>
                        <Text style={executiveStyles.sectionTitle}>{customSection.title}</Text>
                        <View>
                            {customSection.items.map((item: any) => (
                                <View key={item.id} style={{ marginBottom: 8 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={executiveStyles.itemTitle}>{item.name}</Text>
                                        <Text style={executiveStyles.itemDate}>{item.date}</Text>
                                    </View>
                                    {item.city && <Text style={executiveStyles.itemCity}>{item.city}</Text>}
                                    <PdfFormattedText text={item.description} style={executiveStyles.itemDesc} />
                                </View>
                            ))}
                        </View>
                    </View>
                );
            }

            switch (id) {
                case 'experience':
                    return experience.length > 0 && (
                        <View key="experience" style={{ marginBottom: 15 }}>
                            <Text style={executiveStyles.sectionTitle}>{sectionTitles.experience || "Professional Experience"}</Text>
                            <View>
                                {experience.map((exp: any) => (
                                    <View key={exp.id} style={{ marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <View style={{ flexDirection: 'row', gap: 5 }}>
                                                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{exp.company}</Text>
                                                <Text style={{ fontSize: 10, color: '#666' }}>|</Text>
                                                <Text style={{ fontSize: 10, color: '#4b5563' }}>{exp.role}</Text>
                                            </View>
                                            <Text style={{ fontSize: 9, color: '#666' }}>{exp.startDate} - {exp.endDate}</Text>
                                        </View>
                                        <PdfFormattedText text={exp.description} style={{ fontSize: 9, color: '#4b5563', marginTop: 4 }} />
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                case 'education':
                    return education.length > 0 && (
                        <View key="education" style={{ marginBottom: 15 }}>
                            <Text style={executiveStyles.sectionTitle}>{sectionTitles.education || "Education"}</Text>
                            <View>
                                {education.map((edu: any) => (
                                    <View key={edu.id} style={{ marginBottom: 10 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{edu.school}</Text>
                                            <Text style={{ fontSize: 9, color: '#666' }}>{edu.startDate} - {edu.endDate}</Text>
                                        </View>
                                        <Text style={{ fontSize: 9, color: '#4b5563' }}>{edu.degree}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                case 'projects':
                    return projects.length > 0 && (
                        <View key="projects" style={{ marginBottom: 15 }}>
                            <Text style={executiveStyles.sectionTitle}>{sectionTitles.projects || "Projects"}</Text>
                            <View>
                                {projects.map((proj: any) => (
                                    <View key={proj.id} style={{ marginBottom: 10 }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{proj.name}</Text>
                                        {proj.technologies && (
                                            <Text style={{ fontSize: 8, color: goldColor, marginTop: 1, marginBottom: 1 }}>
                                                {proj.technologies}
                                            </Text>
                                        )}
                                        <PdfFormattedText text={proj.description} style={{ fontSize: 9, color: '#4b5563', marginTop: 2 }} />
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                default: return null;
            }
        };

        return (
            <Document>
                <Page size="A4" style={executiveStyles.page}>
                    <View style={{ width: '100%', height: '100%' }} wrap={false}>
                        {/* Header */}
                        <View style={{ ...executiveStyles.header, backgroundColor: darkGray }}>
                            <View style={{
                                ...executiveStyles.photo,
                                borderWidth: (personalInfo.photoFilters?.borderWidth !== undefined && personalInfo.photoFilters?.borderWidth !== null) ? Number(personalInfo.photoFilters.borderWidth) : 2,
                                borderColor: personalInfo.photoFilters?.borderColor || '#c9a050',
                                borderStyle: 'solid'
                            }}>
                                {personalInfo.photo ? (
                                    <Image
                                        src={personalInfo.photo}
                                        style={{ width: '100%', height: '100%', borderRadius: 6, objectFit: 'cover' }}
                                    />
                                ) : (
                                    <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ color: 'white', fontSize: 24, textAlign: 'center' }}>
                                            {personalInfo.fullName?.charAt(0)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View>
                                <Text style={personalStyles.headerName}>{personalInfo.fullName}</Text>
                                <Text style={personalStyles.headerRole}>{personalInfo.jobTitle}</Text>
                            </View>
                        </View>

                        <View style={executiveStyles.body}>
                            {/* Main Content (65%) */}
                            <View style={executiveStyles.main}>
                                {personalInfo.summary && (
                                    <View style={{ marginBottom: 15 }}>
                                        <Text style={personalStyles.sectionTitle}>{sectionTitles.summary || "Profile"}</Text>
                                        <PdfFormattedText text={personalInfo.summary} style={{ fontSize: 9 * (sectionScales?.personal || 1), color: '#4b5563', lineHeight: 1.5 }} />
                                    </View>
                                )}
                                {sectionOrder.filter(id => !['personal', 'skills'].includes(id)).map(id => renderExecutiveSection(id))}
                            </View>

                            {/* Sidebar (35%) */}
                            <View style={executiveStyles.sidebar}>
                                {/* Contact */}
                                {(personalInfo.email || personalInfo.phone || personalInfo.location) && (
                                    <View style={{ marginBottom: 15 }}>
                                        <Text style={personalStyles.sidebarTitle}>{sectionTitles.contact || "Contact"}</Text>
                                        <View style={{ height: 1, backgroundColor: goldColor, marginBottom: 9 }} />
                                        <View style={{ gap: 4 }}>
                                            {personalInfo.email && <Text style={{ fontSize: 9 * (sectionScales?.personal || 1) }}>{personalInfo.email}</Text>}
                                            {personalInfo.phone && <Text style={{ fontSize: 9 * (sectionScales?.personal || 1) }}>{personalInfo.phone}</Text>}
                                            {personalInfo.location && <Text style={{ fontSize: 9 * (sectionScales?.personal || 1) }}>{personalInfo.location}</Text>}
                                            {personalInfo.website && <Text style={{ fontSize: 9 * (sectionScales?.personal || 1) }}>{personalInfo.website.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                            {personalInfo.linkedin && <Text style={{ fontSize: 9 * (sectionScales?.personal || 1) }}>LI: {personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                            {personalInfo.github && <Text style={{ fontSize: 9 * (sectionScales?.personal || 1) }}>GH: {personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}</Text>}
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    {isBrandingEnabled && <Text style={styles.branding} fixed>Powered by LoneStar</Text>}
                </Page>
            </Document>
        );
    }




    // --- DESIGNER TEMPLATE ---
    if (selectedTemplate === 'designer') {
        const designerStyles = getDesignerStyles(sectionScales?.personal || 1);

        const renderDesignerSection = (id: string, isLeft: boolean) => {
            const sectionStyles = getDesignerStyles(sectionScales?.[id] || 1);
            const customSection = data.customSections?.find(s => s.id === id);
            const titleStyle = isLeft ? sectionStyles.sectionTitle : sectionStyles.sectionTitleRight;

            if (customSection) {
                return (
                    <View key={id} style={{ marginBottom: 20 }}>
                        <Text style={titleStyle}>{customSection.title}</Text>
                        {customSection.items.map((item: any) => (
                            <View key={item.id} style={{ marginBottom: 10 }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 10, color: isLeft ? 'white' : '#333' }}>{item.name}</Text>
                                <Text style={{ fontSize: 9, color: isLeft ? 'rgba(255,255,255,0.7)' : '#666' }}>{item.date}</Text>
                                <PdfFormattedText text={item.description} style={{ fontSize: 9, color: isLeft ? 'rgba(255,255,255,0.9)' : '#4b5563', marginTop: 2 }} />
                            </View>
                        ))}
                    </View>
                );
            }

            switch (id) {
                case 'education':
                    return education.length > 0 && (
                        <View key="education" style={{ marginBottom: 20 }}>
                            <Text style={titleStyle}>{sectionTitles.education || "Education"}</Text>
                            {education.map((edu: any) => (
                                <View key={edu.id} style={{ marginBottom: 10 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 10, color: isLeft ? 'white' : '#333' }}>{edu.school}</Text>
                                    <Text style={{ fontSize: 9, color: isLeft ? 'rgba(255,255,255,0.9)' : '#555' }}>{edu.degree}</Text>
                                    <Text style={{ fontSize: 9, color: isLeft ? 'rgba(255,255,255,0.7)' : '#666' }}>{edu.startDate} - {edu.endDate}</Text>
                                </View>
                            ))}
                        </View>
                    );
                case 'skills':
                    return skills && skills.length > 0 && (
                        <View key="skills" style={{ marginBottom: 20 }}>
                            <Text style={titleStyle}>{sectionTitles.skills || "Skills"}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {skills.filter(s => s && s.trim()).map((skill: any, i: any) => (
                                    <View key={i} style={sectionStyles.skillPill}>
                                        <Text style={sectionStyles.skillText}>{skill.trim()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                case 'experience':
                    return experience.length > 0 && (
                        <View key="experience" style={{ marginBottom: 20 }}>
                            <Text style={titleStyle}>{sectionTitles.experience || "Experience"}</Text>
                            {experience.map((exp: any) => (
                                <View key={exp.id} style={{ marginBottom: 15 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                                        <Text style={{ fontWeight: 'bold', fontSize: 11, color: isLeft ? 'white' : '#333' }}>{exp.company}</Text>
                                        <Text style={{ fontSize: 9, color: isLeft ? 'rgba(255,255,255,0.7)' : '#666' }}>{exp.startDate} - {exp.endDate}</Text>
                                    </View>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: isLeft ? 'rgba(255,255,255,0.9)' : '#555', marginBottom: 4 }}>{exp.role}</Text>
                                    <PdfFormattedText text={exp.description} style={{ fontSize: 9, color: isLeft ? 'rgba(255,255,255,0.8)' : '#4b5563', lineHeight: 1.4 }} />
                                </View>
                            ))}
                        </View>
                    );
                case 'projects':
                    return projects.length > 0 && (
                        <View key="projects" style={{ marginBottom: 20 }}>
                            <Text style={titleStyle}>{sectionTitles.projects || "Projects"}</Text>
                            {projects.map((proj: any) => (
                                <View key={proj.id} style={{ marginBottom: 12 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 10, color: isLeft ? 'white' : '#333' }}>{proj.name}</Text>
                                    {proj.technologies && (
                                        <Text style={{ fontSize: 9, color: isLeft ? 'rgba(255,255,255,0.7)' : '#666', marginBottom: 2 }}>{proj.technologies}</Text>
                                    )}
                                    <PdfFormattedText text={proj.description} style={{ fontSize: 9, color: isLeft ? 'rgba(255,255,255,0.8)' : '#4b5563' }} />
                                    {proj.link && (
                                        <Link src={proj.link} style={{ fontSize: 9, color: isLeft ? '#8ab4f8' : '#2563eb', marginTop: 2, textDecoration: 'none' }}>
                                            {proj.linkText || "View Project"}
                                        </Link>
                                    )}
                                </View>
                            ))}
                        </View>
                    );
                default: return null;
            }
        };

        const leftSections = ['skills', 'education', 'contact'];
        const rightSections = sectionOrder.filter(id => !leftSections.includes(id) && id !== 'personal');
        const leftSectionsToMap = sectionOrder.filter(id => leftSections.includes(id) && id !== 'contact');

        return (
            <Document>
                <Page size="A4" style={designerStyles.page}>
                    <View style={designerStyles.body} wrap={false}>
                        {/* Left Column (Dark) */}
                        <View style={designerStyles.leftCol}>
                            <View style={{ alignItems: 'center', marginBottom: 30 }}>
                                <View style={{
                                    ...designerStyles.photo,
                                    borderWidth: (personalInfo.photoFilters?.borderWidth !== undefined && personalInfo.photoFilters?.borderWidth !== null) ? Number(personalInfo.photoFilters.borderWidth) : 3,
                                    borderColor: personalInfo.photoFilters?.borderColor || '#FFFFFF',
                                    borderStyle: 'solid'
                                }}>
                                    {personalInfo.photo ? (
                                        <Image
                                            src={personalInfo.photo}
                                            style={{ width: '100%', height: '100%', borderRadius: 42, objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Text style={{ color: 'white', fontSize: 30, textAlign: 'center', marginTop: 20, fontWeight: 'bold' }}>
                                            {personalInfo.fullName?.charAt(0)}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View style={{ marginBottom: 30 }}>
                                <Text style={designerStyles.sectionTitle}>{sectionTitles.contact || "Contact"}</Text>
                                <View style={{ gap: 6 }}>
                                    {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.website, personalInfo.linkedin, personalInfo.github]
                                        .filter(Boolean).map((item, i) => (
                                            <Text key={i} style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>{item}</Text>
                                        ))}
                                </View>
                            </View>

                            {leftSectionsToMap.map(id => renderDesignerSection(id, true))}
                            {data.customSections?.map(s => renderDesignerSection(s.id, true))}
                        </View>

                        {/* Right Column (Light) */}
                        <View style={designerStyles.rightCol}>
                            <View style={{ backgroundColor: '#f5f0e8', padding: 20, margin: -24, marginBottom: 24 }}>
                                <Text style={designerStyles.name}>{personalInfo.fullName}</Text>
                                <Text style={designerStyles.role}>{personalInfo.jobTitle}</Text>
                            </View>

                            {personalInfo.summary && (
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={designerStyles.sectionTitleRight}>{sectionTitles.summary || "Profile"}</Text>
                                    <PdfFormattedText text={personalInfo.summary} style={{ fontSize: 9, lineHeight: 1.5, color: '#4b5563' }} />
                                </View>
                            )}

                            {rightSections.map(id => renderDesignerSection(id, false))}
                        </View>
                    </View>
                    {isBrandingEnabled && <Text style={styles.branding} fixed>Powered by LoneStar</Text>}
                </Page>
            </Document>
        )
    }

    // --- CLASSIC TEMPLATE (Default) ---
    const renderClassicSection = (id: string) => {
        const classicStyles = getClassicStyles(sectionScales?.[id] || 1);
        const customSection = data.customSections?.find(s => s.id === id);
        if (customSection) {
            return (
                <View key={customSection.id} style={classicStyles.itemGroup}>
                    <Text style={classicStyles.sectionTitle}>{customSection.title}</Text>
                    {customSection.items.map((item: any) => (
                        <View key={item.id} style={{ marginBottom: 5 }}>
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
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {education.map((edu: any) => (
                                <View key={edu.id} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                                    <Text style={classicStyles.bold}>{edu.school}</Text>
                                    <Text style={classicStyles.italic}>{edu.degree}</Text>
                                    <Text style={{ fontSize: 9, color: '#6b7280' }}>({edu.startDate} - {edu.endDate})</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                );
            case 'skills':
                return skills && skills.length > 0 && (
                    <View key="skills" style={classicStyles.itemGroup}>
                        <Text style={classicStyles.sectionTitle}>{sectionTitles.skills || "Skills"}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
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
                            <View key={exp.id} style={{ marginBottom: 8 }}>
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
                            <View key={proj.id} style={{ marginBottom: 8 }}>
                                <View style={classicStyles.row}>
                                    <Text style={classicStyles.bold}>{proj.name}</Text>
                                    {proj.link && (
                                        <Link src={proj.link} style={{ fontSize: 9, color: 'blue', textDecoration: 'none' }}>
                                            {proj.linkText || "View Project"}
                                        </Link>
                                    )}
                                </View>
                                {proj.technologies && (
                                    <Text style={{ fontSize: 9, color: '#4b5563', fontStyle: 'italic', marginBottom: 2 }}>
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

    return (
        <Document>
            <Page size="A4" style={classicStyles.page}>
                <View style={{ width: '100%', height: '100%' }} wrap={false}>
                    <View style={classicStyles.header}>
                        <Text style={personalStyles.name}>{personalInfo.fullName}</Text>
                        {personalInfo.jobTitle && <Text style={{ fontSize: 14, color: '#4b5563', marginBottom: 8, textTransform: 'uppercase' }}>{personalInfo.jobTitle}</Text>}
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
                    </View>

                    {personalInfo.summary && (
                        <View style={classicStyles.itemGroup}>
                            <Text style={personalStyles.sectionTitle}>Professional Summary</Text>
                            <PdfFormattedText text={personalInfo.summary} style={personalStyles.text} />
                        </View>
                    )}

                    {sectionOrder.map(renderClassicSection)}
                </View>

                {isBrandingEnabled && (
                    <Text style={classicStyles.branding} fixed>Powered by LoneStar</Text>
                )}
            </Page>
        </Document>
    );
};
