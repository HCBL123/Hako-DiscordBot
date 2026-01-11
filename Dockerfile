# Use a "hybrid" image that has both Node 20 and Python 3.11 pre-installed
FROM nikolaik/python-nodejs:python3.11-nodejs20

WORKDIR /app

# Copy all your project files into the container
COPY . .

# ---> THIS IS THE FIX: Delete the lock file so we get fresh versions <---
RUN rm package-lock.json

# Create the config file
RUN cp src/config.example.js src/config.js

# Install dependencies (This will now grab the NEW version 0.21.0+)
RUN npm install

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Start the bot
CMD ["node", "src/bot.js"]