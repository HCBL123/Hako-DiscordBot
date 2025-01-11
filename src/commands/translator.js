const OpenAI = require('openai');
const { deepseek_api } = require('../config');
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: deepseek_api
});

const TRANSLATION_PROMPT = `You are a professional Vietnamese light novel translator. Translate the following English text to Vietnamese. Keep the translation natural, accurate, and appropriate for light novels. Ensure proper context and maintain the original meaning. Only return the Vietnamese translation.`;

async function handleTranslation(message, query, translationType = null) {
    try {
        if (translationType === '-f') {
            if (message.attachments.size === 0) {
                return message.reply('Please attach a .txt file to translate');
            }

            const attachment = message.attachments.first();
            if (!attachment.name.endsWith('.txt')) {
                return message.reply('Please provide a .txt file');
            }

            const response = await fetch(attachment.url);
            query = await response.text();
        }

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: TRANSLATION_PROMPT },
                { role: "user", content: query }
            ],
            model: "deepseek-chat",
            temperature: 1.3  // Added temperature for more creative translations
        });

        const translatedText = completion.choices[0].message.content;

        // Handle file output for large translations
        if (translationType === '-f' || translatedText.length > 1900) {
            const tempDir = path.join(__dirname, '../../temp');
            await fs.mkdir(tempDir, { recursive: true });
            const tempFile = path.join(tempDir, `translation_${Date.now()}.txt`);
            await fs.writeFile(tempFile, translatedText, 'utf8');
            await message.reply({ files: [tempFile] });
            await fs.unlink(tempFile);
        } else {
            await message.reply(translatedText);
        }
    } catch (error) {
        console.error('Translation error:', error);
        return message.reply('An error occurred during translation. Please try again.');
    }
}

module.exports = { handleTranslation };