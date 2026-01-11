# Use a "hybrid" image that has both Node 20 and Python 3.11 pre-installed
FROM nikolaik/python-nodejs:python3.11-nodejs20

# Set the folder where your app will live
WORKDIR /app

# Copy all your project files into the container
COPY . .

# Install Node.js dependencies
RUN npm ci

# Install Python dependencies
# We use --no-cache-dir to keep the container small
RUN pip install --no-cache-dir -r requirements.txt

# Start the bot
CMD ["node", "src/bot.js"]