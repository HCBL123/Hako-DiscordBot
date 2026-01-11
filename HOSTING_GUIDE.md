# Discord Bot Hosting Guide

This guide will help you host your Hako Discord Bot on various platforms. The bot requires both Node.js and Python to run.

## Prerequisites

1. **Discord Bot Token**: Get one from [Discord Developer Portal](https://discord.com/developers/applications)
2. **Google Gemini API Key** (optional, for Gemini commands): Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Node.js** (v16 or higher)
4. **Python** (3.7 or higher)

---

## Quick Setup (Local Testing)

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Create Configuration File

Create `src/config.js`:

```javascript
module.exports = {
    token: 'YOUR_DISCORD_BOT_TOKEN_HERE',
    gemini_api: 'YOUR_GEMINI_API_KEY_HERE' // Optional
};
```

### 3. Run the Bot

```bash
npm start
# or
node src/bot.js
```

---

## Hosting Options

### Option 1: Railway (Recommended - Easy & Free Tier Available)

[Railway](https://railway.app) offers a free tier and easy deployment.

#### Steps:

1. **Sign up** at [railway.app](https://railway.app) (use GitHub login)

2. **Create a new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo" (connect your repo)
   - OR select "Empty Project" and connect later

3. **Configure the project**:
   - Add a **Node.js** service
   - Railway will auto-detect your `package.json`

4. **Set Environment Variables**:
   - Go to your service → Variables tab
   - Add:
     ```
     DISCORD_TOKEN=your_bot_token_here
     GEMINI_API=your_gemini_key_here
     ```

5. **Configure Build & Start Commands**:
   - In the service settings, set:
     - **Build Command**: `npm install && pip install -r requirements.txt`
     - **Start Command**: `node src/bot.js`

6. **Update your code** to use environment variables:
   - Modify `src/config.js` to read from environment:
   ```javascript
   require('dotenv').config();
   module.exports = {
       token: process.env.DISCORD_TOKEN,
       gemini_api: process.env.GEMINI_API
   };
   ```

7. **Deploy**: Railway will automatically deploy when you push to GitHub

---

### Option 2: Heroku (Free Tier Discontinued, Paid Only)

**Note**: Heroku no longer offers a free tier, but it's still a reliable option.

#### Steps:

1. **Install Heroku CLI** from [heroku.com](https://devcenter.heroku.com/articles/heroku-cli)

2. **Create a `Procfile`** in the root directory:
   ```
   worker: node src/bot.js
   ```

3. **Login and create app**:
   ```bash
   heroku login
   heroku create your-bot-name
   ```

4. **Set environment variables**:
   ```bash
   heroku config:set DISCORD_TOKEN=your_token
   heroku config:set GEMINI_API=your_key
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

6. **Scale the worker**:
   ```bash
   heroku ps:scale worker=1
   ```

---

### Option 3: Replit (Free, Easy for Beginners)

[Replit](https://replit.com) offers free hosting with a simple interface.

#### Steps:

1. **Sign up** at [replit.com](https://replit.com)

2. **Create a new Repl**:
   - Click "Create Repl"
   - Choose "Node.js" template
   - Name it (e.g., "discord-bot")

3. **Upload your files**:
   - Drag and drop all files into Replit
   - OR use Git import

4. **Install dependencies**:
   - In the Shell tab, run:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

5. **Set Secrets** (Environment Variables):
   - Click the lock icon (Secrets) in the sidebar
   - Add:
     - Key: `DISCORD_TOKEN`, Value: your token
     - Key: `GEMINI_API`, Value: your key

6. **Update config.js** to use secrets:
   ```javascript
   require('dotenv').config();
   module.exports = {
       token: process.env.DISCORD_TOKEN,
       gemini_api: process.env.GEMINI_API
   };
   ```

7. **Run the bot**:
   - Click "Run" button
   - **Important**: To keep it running 24/7, you need Replit's paid plan OR use a free "Always On" service like [UptimeRobot](https://uptimerobot.com) to ping your Repl

---

### Option 4: VPS (Virtual Private Server) - Most Control

Popular providers: **DigitalOcean**, **Linode**, **Vultr**, **AWS EC2**

#### Steps (Ubuntu/Debian):

1. **Connect to your VPS** via SSH

2. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install Python**:
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip
   ```

4. **Clone your repository**:
   ```bash
   git clone https://github.com/yourusername/Hako-DiscordBot.git
   cd Hako-DiscordBot
   ```

5. **Install dependencies**:
   ```bash
   npm install
   pip3 install -r requirements.txt
   ```

6. **Create config.js**:
   ```bash
   nano src/config.js
   # Add your configuration
   ```

7. **Use PM2 to keep bot running**:
   ```bash
   # Install PM2
   sudo npm install -g pm2
   
   # Start the bot
   pm2 start src/bot.js --name discord-bot
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

8. **Monitor the bot**:
   ```bash
   pm2 status
   pm2 logs discord-bot
   ```

---

### Option 5: Render (Free Tier Available)

[Render](https://render.com) offers free hosting with some limitations.

#### Steps:

1. **Sign up** at [render.com](https://render.com)

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Choose "Node" environment

3. **Configure**:
   - **Build Command**: `npm install && pip install -r requirements.txt`
   - **Start Command**: `node src/bot.js`

4. **Set Environment Variables**:
   - In the Environment tab, add:
     - `DISCORD_TOKEN`
     - `GEMINI_API`

5. **Deploy**: Render will auto-deploy on git push

**Note**: Free tier may spin down after inactivity. Consider upgrading or using a ping service.

---

## Important: Update Your Code for Hosting

Before deploying, update `src/config.js` to use environment variables:

```javascript
require('dotenv').config();

module.exports = {
    token: process.env.DISCORD_TOKEN || process.env.token,
    gemini_api: process.env.GEMINI_API || process.env.gemini_api
};
```

This allows the bot to work with environment variables set by hosting platforms.

---

## Keeping Your Bot Online 24/7

### Free Options:
- **UptimeRobot**: Pings your bot URL every 5 minutes (free tier)
- **Cron Jobs**: Set up on VPS to restart if needed
- **PM2**: Auto-restart on crashes (VPS only)

### Paid Options:
- Most cloud platforms offer "Always On" plans
- VPS with PM2 is the most reliable

---

## Troubleshooting

### Bot goes offline:
- Check hosting platform logs
- Verify environment variables are set correctly
- Ensure Node.js and Python are installed
- Check Discord bot token is valid

### Python scripts not working:
- Ensure Python is in PATH
- Install Python dependencies: `pip install -r requirements.txt`
- Check Python version (3.7+)

### Bot not responding:
- Check bot has proper intents enabled in Discord Developer Portal
- Verify bot is invited to server with correct permissions
- Check console logs for errors

---

## Security Best Practices

1. **Never commit** `config.js` with real tokens to GitHub
2. **Use environment variables** for all secrets
3. **Add `.env` to `.gitignore`**
4. **Rotate tokens** if accidentally exposed
5. **Use least privilege** for bot permissions

---

## Recommended Hosting for This Bot

**Best for Beginners**: Railway or Replit  
**Best for Reliability**: VPS with PM2  
**Best for Free**: Railway (free tier) or Render (with limitations)

---

## Need Help?

- Check Discord.js documentation: https://discord.js.org
- Review hosting platform documentation
- Check bot logs for specific error messages

