const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { token } = require('./config');
// Import the entire module object instead of trying to destructure handleEpubCommand
const epubCommand = require('./commands/epub');

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
        return message.reply('Available commands:\n!epub <url> - Convert webpage to epub\n!help - Show this message');
    }

    if (message.content.startsWith('!epub')) {
        try {
            // Use the execute method from the epub command module
            const args = message.content.split(' ').slice(1);
            await epubCommand.execute(message, args);
        } catch (error) {
            console.error('Error handling epub command:', error);
            message.reply('Sorry, there was an error processing your request.');
        }
    }
});

client.on('error', error => {
    console.error('Discord client error:', error);
});

client.login(token);