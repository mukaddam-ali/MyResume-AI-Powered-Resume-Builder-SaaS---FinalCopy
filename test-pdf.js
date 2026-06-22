const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
    try {
        const dataBuffer = fs.readFileSync('test.pdf');
        const data = await pdfParse(dataBuffer);
        console.log("Success! Extracted text length:", data.text.length);
    } catch (e) {
        console.error("Failed:", e);
    }
}
test();
