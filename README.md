# README

# Discord EPUB Bot

A simple Discord bot that allows users to input a reading link and receive back an EPUB file.

## Features

- Accepts reading links from users.
- Converts the links into EPUB file format.
- Sends the EPUB file back to the user.
- Show highest ranking
- Check project's info

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/discord-epub-bot.git
   ```
2. Navigate to the project directory:
   ```
   cd discord-epub-bot
   ```
3. Install the dependencies:
   ```
   npm install
   pip install -r requirements.txt
   ```

## Configuration

1. Copy `src/config.example.js` to `src/config.js`:
   ```
   cp src/config.example.js src/config.js
   ```

2. Edit `src/config.js` and add your Discord bot token and Gemini API key (optional):
   ```javascript
   module.exports = {
       token: 'YOUR_DISCORD_BOT_TOKEN_HERE',
       gemini_api: 'YOUR_GEMINI_API_KEY_HERE' // Optional
   };
   ```

   **OR** use environment variables (recommended for hosting):
   - Create a `.env` file in the root directory
   - Add: `DISCORD_TOKEN=your_token` and `GEMINI_API=your_key`

## Usage

1. Start the bot:
   ```
   node src/bot.js
   ```
2. Invite the bot to your Discord server and use the command to input a reading link.

## Hosting

For detailed hosting instructions, see [HOSTING_GUIDE.md](./HOSTING_GUIDE.md).

Quick hosting options:
- **Railway** (Recommended - Free tier available)
- **Render** (Free tier with limitations)
- **Replit** (Free, easy for beginners)
- **VPS** (Most control, requires setup)

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License.
