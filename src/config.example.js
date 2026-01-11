// Copy this file to config.js and fill in your values
// OR use environment variables (recommended for hosting)

require('dotenv').config();

module.exports = {
    token: process.env.DISCORD_TOKEN || process.env.token || 'YOUR_DISCORD_BOT_TOKEN_HERE',
    gemini_api: process.env.GEMINI_API || process.env.gemini_api || 'YOUR_GEMINI_API_KEY_HERE'
};

