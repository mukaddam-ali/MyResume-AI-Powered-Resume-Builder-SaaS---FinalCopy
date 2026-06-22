import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

async function testPdf() {
    try {
        const filePath = "C:\\Users\\alial\\OneDrive\\Desktop\\LoneStar - Copy\\Ibrahim Halil Siyli CV.pdf";
        const buffer = fs.readFileSync(filePath);
        console.log(`Buffer size: ${buffer.length} bytes`);
        
        const result = await pdfParse(buffer);
        console.log("PDF parsed successfully!");
        console.log(`Text length: ${result.text.length}`);
        console.log("Sample text:", result.text.substring(0, 200).replace(/\n/g, ' '));
    } catch (e) {
        console.error("Failed to parse PDF:");
        console.error(e);
    }
}

testPdf();
