export function adjustColor(hex: string, amount: number): string {
    let color = hex.replace('#', '');
    if (color.length === 3) {
        color = color.split('').map(c => c + c).join('');
    }

    const num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;

    if (r > 255) r = 255; else if (r < 0) r = 0;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    if (b > 255) b = 255; else if (b < 0) b = 0;

    return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

export function getContrastingColor(hex: string): 'black' | 'white' {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}
