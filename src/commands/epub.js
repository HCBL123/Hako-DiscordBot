const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { validateLink } = require('../utils/validate');
const { convertToEpub } = require('../utils/epub-converter');
const { getNovelInfo } = require('../utils/info-fetcher');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

module.exports = {
    name: 'epub',
    description: 'Convert webpage to epub',
    async execute(message, args) {
        // Handle hako command first
        if (message.content === '!hako') {
            try {
                console.log('Executing hako command...'); // Debug log
                
                const pythonProcess = spawn('python', [
                    path.resolve(__dirname, '../get_bxh.py')
                ]);

                let outputData = '';
                let errorData = '';

                pythonProcess.stdout.on('data', (data) => {
                    const text = data.toString('utf8');
                    outputData += text;
                    console.log('Python output:', text); // Debug log
                });

                pythonProcess.stderr.on('data', (data) => {
                    const text = data.toString('utf8');
                    errorData += text;
                    console.error('Python error:', text);
                });

                pythonProcess.on('close', async (code) => {
                    console.log('Python process closed with code:', code); // Debug log
                    if (code !== 0) {
                        console.error('Python error:', errorData);
                        return message.reply('Error fetching popular stories');
                    }

                    try {
                        const stories = outputData.split('-'.repeat(80))
                            .filter(section => section.trim())
                            .map(section => {
                                const titleMatch = section.match(/Title: (.+)/);
                                const imageMatch = section.match(/Image: (.+)/);
                                return {
                                    title: titleMatch ? titleMatch[1].trim() : 'Unknown',
                                    image: imageMatch ? imageMatch[1].trim() : null
                                };
                            });

                        // Create an embed for each story
                        const embeds = stories.map((story, index) => {
                            return new EmbedBuilder()
                                .setColor('#0099ff')
                                .setTitle(`${index + 1}. ${story.title}`)
                                .setImage(story.image)
                                .setTimestamp();
                        });

                        // Send all embeds in one message (Discord allows up to 10 embeds per message)
                        return message.reply({ embeds: embeds.slice(0, 10) });
                    } catch (error) {
                        console.error('Error parsing stories:', error);
                        return message.reply('Error processing stories data');
                    }
                });
                return; // Add this to prevent falling through to other commands
            } catch (error) {
                console.error('Error executing hako command:', error);
                return message.reply('An error occurred while fetching the story list.');
            }
        }

        // Handle info command
        if (message.content.startsWith('!info')) {
            if (!args.length) {
                return message.reply('Please provide a URL to get information');
            }

            const url = args[0];
            if (!validateLink(url)) {
                return message.reply('Please provide a valid URL');
            }

            try {
                const info = await getNovelInfo(url);
                
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(info.title)
                    .addFields(
                        { name: 'Author', value: info.author, inline: true },
                        { name: 'Translator', value: info.translator, inline: true },
                        { name: 'Translation Group', value: info.group, inline: true },
                        { name: 'Word Count', value: info.wordCount, inline: true },
                        { name: 'Rating', value: info.rating, inline: true },
                        { name: 'Views', value: info.views, inline: true }
                    )
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error fetching novel info:', error);
                return message.reply('An error occurred while fetching novel information.');
            }
        }

        // Handle epub command last
        if (!args.length) {
            return message.reply('Please provide a URL to convert');
        }

        const url = args[0];
        if (!validateLink(url)) {
            return message.reply('Please provide a valid URL');
        }

        try {
            await message.reply('Converting webpage to EPUB... Please wait.');
            
            const epubFilePath = await convertToEpub(url);
            
            if (!epubFilePath) {
                return message.reply('There was an error generating the EPUB file.');
            }

            const attachment = new AttachmentBuilder(epubFilePath);
            await message.reply({ 
                content: 'Here is your EPUB file:',
                files: [attachment]
            });

            // Clean up the file after sending
            await fs.unlink(epubFilePath).catch(console.error);

        } catch (error) {
            console.error(error);
            message.reply('An unexpected error occurred while processing your request.');
        }
    },
};