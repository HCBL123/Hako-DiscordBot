const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { token } = require('./config');
const epubCommand = require('./commands/epub');
const { handleGeminiCommand } = require('./commands/gemini');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('!help for commands', { type: ActivityType.Watching });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!help') {
        return message.reply(
            'Available commands:\n' +
            '!epub <url> - Convert webpage to epub\n' +
            '!info <url> - Get novel information\n' +
            '!hako - Show popular stories on Hako.vn\n' +
            '!gemini <text> - Ask Gemini AI a question\n' +
            '!help - Show this message'
        );
    }

    // Handle Gemini command
    if (message.content.startsWith('!gemini')) {
        const query = message.content.slice(8).trim();
        if (!query) {
            return message.reply('Please provide some text after !gemini');
        }
        return handleGeminiCommand(message, query);
    }

    // Existing command handlers
    if (message.content.startsWith('!epub') || 
        message.content.startsWith('!info') || 
        message.content === '!hako') {
        try {
            const args = message.content.split(' ').slice(1);
            await epubCommand.execute(message, args);
        } catch (error) {
            console.error('Error handling command:', error);
            message.reply('Sorry, there was an error processing your request.');
        }
    }
});

client.on('error', error => {
    console.error('Discord client error:', error);
});

client.login(token);