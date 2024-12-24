const { GoogleGenerativeAI } = require('@google/generative-ai');
const { gemini_api } = require('../config');
const fs = require('fs').promises;
const path = require('path');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(gemini_api);

const TRANSLATION_PROMPT = `Hãy dịch đoạn văn sau từ tiếng Anh sang tiếng Việt. Chỉ trả về bản dịch tiếng Việt, sử dụng văn phong tự nhiên như truyện tiếng Việt, đảm bảo nghĩa không bị sai lệch với nguyên bản, các từ ngữ phải phù hợp với ngữ cảnh và thể loại light novel. Đảm bảo bản dịch phải Việt hóa nhất có thể.`;

async function handleGeminiCommand(message, query, isTranslation = false) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE"
                }
            ]
        });

        const prompt = isTranslation ? `${TRANSLATION_PROMPT}\n\nUser Query: ${query}` : query;
        
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            if (isTranslation) {
                // Create temp directory if it doesn't exist
                const tempDir = path.join(__dirname, '../../temp');
                await fs.mkdir(tempDir, { recursive: true });

                // Create temp file with translation
                const tempFile = path.join(tempDir, `translation_${Date.now()}.txt`);
                await fs.writeFile(tempFile, text, 'utf8');

                // Send file and then delete it
                await message.reply({ 
                    files: [tempFile]
                });
                await fs.unlink(tempFile);
                return;
            }
            
            // For non-translation queries, handle long messages
            const MAX_LENGTH = 2000;
            if (text.length > MAX_LENGTH) {
                const chunks = [];
                for (let i = 0; i < text.length; i += MAX_LENGTH) {
                    chunks.push(text.slice(i, i + MAX_LENGTH));
                }
                
                // Send first chunk as reply
                await message.reply(chunks[0]);
                
                // Send remaining chunks as normal messages
                for (let i = 1; i < chunks.length; i++) {
                    await message.channel.send(chunks[i]);
                }
                return;
            }
            
            // Send as normal message if within limit
            return message.reply(text);

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