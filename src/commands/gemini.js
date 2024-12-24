const { GoogleGenerativeAI } = require('@google/generative-ai');
const { gemini_api } = require('../config');

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
            
            // Split response if it exceeds Discord's character limit
            const MAX_LENGTH = 1900; // Leave room for code block formatting
            if (text.length > MAX_LENGTH) {
                const chunks = [];
                for (let i = 0; i < text.length; i += MAX_LENGTH) {
                    const chunk = text.slice(i, i + MAX_LENGTH);
                    chunks.push(isTranslation ? `\`\`\`${chunk}\`\`\`` : chunk);
                }
                // Send each chunk as a separate message
                for (const chunk of chunks) {
                    await message.reply(chunk);
                }
                return;
            }
            
            // Send single message if within limit
            return message.reply(isTranslation ? `\`\`\`${text}\`\`\`` : text);
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