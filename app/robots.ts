import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/', '/debug-auth/'],
            },
        ],
        sitemap: 'https://my-resume-ai-powered-resume-builder-orpin.vercel.app/sitemap.xml',
    };
}
