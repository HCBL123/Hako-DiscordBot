const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
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
                console.log('Executing hako command...');
                
                const pythonProcess = spawn('python', [
                    path.resolve(__dirname, '../get_bxh.py')
                ]);

                let outputData = '';
                let errorData = '';

                pythonProcess.stdout.on('data', (data) => {
                    const text = data.toString('utf8');
                    outputData += text;
                });

                pythonProcess.stderr.on('data', (data) => {
                    const text = data.toString('utf8');
                    errorData += text;
                });

                pythonProcess.on('close', async (code) => {
                    if (code !== 0) {
                        console.error('Python error:', errorData);
                        return message.reply('Error fetching popular stories');
                    }

                    try {
                        const sections = outputData.split('-'.repeat(80))
                            .filter(section => section.trim())
                            .filter(section => !section.includes('Popular Stories:'));

                        const stories = sections.map(section => {
                            const titleMatch = section.match(/Title:\s*([^\n]+)/);
                            const urlMatch = section.match(/URL:\s*([^\n]+)/);
                            const imageMatch = section.match(/Image:\s*([^\n]+)/);
                            
                            return {
                                title: titleMatch ? titleMatch[1].trim() : 'Unknown',
                                url: urlMatch ? urlMatch[1].trim() : null,
                                image: imageMatch ? imageMatch[1].trim() : null
                            };
                        }).filter(story => story.title !== 'Unknown' && story.image);

                        // Create initial embed with just the list
                        const initialEmbed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle('Popular Stories on Hako.vn')
                            .addFields(
                                stories.map((story, index) => ({
                                    name: `${index + 1}.`,
                                    value: story.title,
                                    inline: false
                                }))
                            );

                        // Create dropdown for selection
                        const select = new StringSelectMenuBuilder()
                            .setCustomId('story_select')
                            .setPlaceholder('Select a story to view details')
                            .addOptions(
                                stories.map((story, index) => ({
                                    label: `${index + 1}. ${story.title.substring(0, 94)}...`,
                                    value: index.toString()
                                }))
                            );

                        const row = new ActionRowBuilder().addComponents(select);

                        const response = await message.reply({
                            embeds: [initialEmbed],
                            components: [row]
                        });

                        const collector = response.createMessageComponentCollector({
                            time: 60000 // 1 minute timeout
                        });

                        collector.on('collect', async interaction => {
                            if (interaction.customId === 'story_select') {
                                await interaction.deferUpdate();
                                const selectedStory = stories[parseInt(interaction.values[0])];
                                
                                try {
                                    const storyInfo = await getNovelInfo(selectedStory.url);
                                    
                                    const updatedEmbed = new EmbedBuilder()
                                        .setColor('#0099ff')
                                        .setTitle(storyInfo.title || selectedStory.title)
                                        .setThumbnail(selectedStory.image) // Use thumbnail for smaller image on left
                                        .setDescription(`[Read on Hako.vn](${selectedStory.url})`)
                                        .addFields(
                                            { name: 'Tác giả', value: storyInfo.author || 'Unknown', inline: true },
                                            { name: 'Dịch giả', value: storyInfo.translator || 'Unknown', inline: true },
                                            { name: 'Nhóm dịch', value: storyInfo.group || 'Unknown', inline: true },
                                            { name: '\u200B', value: '\u200B', inline: false }, // Spacer
                                            { name: 'Số từ', value: storyInfo.wordCount || 'Unknown', inline: true },
                                            { name: 'Xếp hạng', value: storyInfo.rating || 'Unknown', inline: true },
                                            { name: 'Lượt xem', value: storyInfo.views || 'Unknown', inline: true }
                                        )
                                        .setTimestamp();

                                    await response.edit({
                                        embeds: [updatedEmbed],
                                        components: [row]
                                    });
                                } catch (error) {
                                    console.error('Error fetching story info:', error);
                                    // If fetching detailed info fails, show basic info
                                    const updatedEmbed = new EmbedBuilder()
                                        .setColor('#0099ff')
                                        .setTitle(selectedStory.title)
                                        .setImage(selectedStory.image)
                                        .setDescription('Could not fetch detailed information.')
                                        .setTimestamp();

                                    await response.edit({
                                        embeds: [updatedEmbed],
                                        components: [row]
                                    });
                                }
                            }
                        });

                        collector.on('end', () => {
                            response.edit({ components: [] }); // Disable dropdown after timeout
                        });

                    } catch (error) {
                        console.error('Error parsing stories:', error);
                        return message.reply('Error processing stories data');
                    }
                });
            } catch (error) {
                console.error('Error executing hako command:', error);
                return message.reply('An error occurred while fetching the story list.');
            }
            return;
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
                        { name: 'Tác giả', value: info.author, inline: true },
                        { name: 'Dịch giả', value: info.translator, inline: true },
                        { name: 'Nhóm dịch', value: info.group, inline: true },
                        { name: 'Số từ', value: info.wordCount, inline: true },
                        { name: 'Xếp hạng', value: info.rating, inline: true },
                        { name: 'Lượt xem', value: info.views, inline: true }
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