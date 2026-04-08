import {
    Playfair_Display,
    Space_Grotesk,
    Crimson_Pro,
    DM_Sans,
    Libre_Baskerville,
    Manrope,
    Lora,
    Montserrat,
    Raleway,
    Merriweather,
    Oswald,
    PT_Serif
} from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });
const crimsonPro = Crimson_Pro({ subsets: ['latin'], variable: '--font-crimson-pro', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const libreBaskerville = Libre_Baskerville({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-libre-baskerville', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['300', '400', '700', '900'], variable: '--font-merriweather', display: 'swap' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap' });
const ptSerif = PT_Serif({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-pt-serif', display: 'swap' });

export default function EditorLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`
      ${playfair.variable} 
      ${spaceGrotesk.variable}
      ${crimsonPro.variable}
      ${dmSans.variable}
      ${libreBaskerville.variable}
      ${manrope.variable}
      ${lora.variable}
      ${montserrat.variable}
      ${raleway.variable}
      ${merriweather.variable}
      ${oswald.variable}
      ${ptSerif.variable}
      h-full w-full flex flex-col flex-1
    `}>
            {children}
        </div>
    );
}
