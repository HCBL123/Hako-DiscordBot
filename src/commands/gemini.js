const { GoogleGenerativeAI } = require('@google/generative-ai');
const { gemini_api } = require('../config');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(gemini_api);

const SYSTEM_PROMPT = `Hãy dịch đoạn văn sau từ tiếng Anh sang tiếng Việt. Chỉ trả về bản dịch tiếng Việt, sử dụng văn phong tự nhiên như truyện tiếng Việt, đảm bảo nghĩa không bị sai lệch với nguyên bản, các từ ngữ phải phù hợp với ngữ cảnh và thể loại light novel. Đảm bảo bản dịch phải Việt hóa nhất có thể.`;

async function handleGeminiCommand(message, query) {
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
        const fullPrompt = `${SYSTEM_PROMPT}\n\nUser Query: ${query}`;
        
        try {
            const result = await model.generateContent(fullPrompt);
            const text = result.response.text();
            return message.reply(`\`\`\`${text}\`\`\``);
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