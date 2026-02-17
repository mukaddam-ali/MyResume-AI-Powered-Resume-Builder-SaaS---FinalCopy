import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import fs from 'fs';
import path from 'path';

// Manual .env.local loading
try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                process.env[match[1].trim()] = match[2].trim();
            }
        });
        console.log("Loaded .env.local");
    } else {
        console.log(".env.local not found");
    }
} catch (e) {
    console.error("Error loading .env.local:", e);
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing in process.env");
    process.exit(1);
} else {
    // obscure the key for logging
    console.log(`✅ GEMINI_API_KEY found (starts with ${apiKey.substring(0, 4)}...)`);
}

const google = createGoogleGenerativeAI({
    apiKey: apiKey,
});

async function testGemini() {
    console.log("Testing Gemini API connection...");
    try {
        const { text } = await generateText({
            model: google("gemini-pro"),
            prompt: "Say hello!",
        });
        console.log("✅ Success! Response:", text);
    } catch (error) {
        console.error("❌ Error:");
        console.error(error);
    }
}

testGemini();
