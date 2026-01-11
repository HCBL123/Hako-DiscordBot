const { GoogleGenerativeAI } = require('@google/generative-ai');
const { gemini_api } = require('../config');
const fs = require('fs').promises;
const path = require('path');
const { default: axios } = require('axios');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(gemini_api);

const TRANSLATION_PROMPT = `Hãy dịch đoạn văn sau từ tiếng Anh sang tiếng Việt. Chỉ trả về bản dịch tiếng Việt, sử dụng văn phong tự nhiên như truyện tiếng Việt, đảm bảo nghĩa không bị sai lệch với nguyên bản, các từ ngữ phải phù hợp với ngữ cảnh và thể loại light novel. Đảm bảo bản dịch phải Việt hóa nhất có thể.`;

async function handleFileTranslation(message, attachment) {
    const response = await axios.get(attachment.url);
    return response.data;
}

async function processGeminiResponse(text, isTranslation) {
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, `translation_${Date.now()}.txt`);
    await fs.writeFile(tempFile, text, 'utf8');
    return tempFile;
}

async function handleGeminiCommand(message, query, isTranslation = false, translationType = null) {
    try {
        if (isTranslation && translationType === '-f') {
            if (message.attachments.size === 0) {
                return message.reply('Please attach a .txt file to translate');
            }

            const attachment = message.attachments.first();
            if (!attachment.name.endsWith('.txt')) {
                return message.reply('Please provide a .txt file');
            }

            // Read and log file content
            const response = await fetch(attachment.url);
            const fileContent = await response.text();
            console.log('File content:', fileContent);
            return;
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE"
                }
            ]
        });

        let textToTranslate = query;

        const prompt = isTranslation ? `${TRANSLATION_PROMPT}\n\nUser Query: ${textToTranslate}` : textToTranslate;
        
        try {
            const result = await model.generateContent(prompt);
            const translatedText = result.response.text();
            
            if (isTranslation) {
                const tempFile = await processGeminiResponse(translatedText, isTranslation);
                await message.reply({ files: [tempFile] });
                await fs.unlink(tempFile);
            } else {
                const MAX_LENGTH = 2000;
                if (translatedText.length > MAX_LENGTH) {
                    const chunks = [];
                    for (let i = 0; i < translatedText.length; i += MAX_LENGTH) {
                        chunks.push(translatedText.slice(i, i + MAX_LENGTH));
                    }
                    await message.reply(chunks[0]);
                    for (let i = 1; i < chunks.length; i++) {
                        await message.channel.send(chunks[i]);
                    }
                } else {
                    await message.reply(translatedText);
                }
            }
        } catch (geminiError) {
            console.error('Gemini API error:', geminiError);
            return message.reply('Too long, too bad.');
        }
    } catch (error) {
        console.error('Command error:', error);
        return message.reply('Too long, too bad.');
    }
}

module.exports = { handleGeminiCommand };