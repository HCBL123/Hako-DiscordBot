const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs').promises;

async function extractNovelInfo($) {
    // Extract title
    const title = $('title').text().split(' - ')[0].trim() || 'Unknown Title';
    console.log(`Found title: ${title}`);

    // Extract author
    const authorDiv = $('div.info-item').filter((_, el) => 
        $(el).find('.info-name').text().includes('Tác giả:')
    );
    const author = authorDiv.find('a').text().trim() || 'Unknown Author';
    console.log(`Found author: ${author}`);

    return { title, author };
}

async function getChapterContent(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(data);
        const contentDiv = $('#chapter-content');
        
        if (!contentDiv.length) {
            console.error(`Content div not found for URL: ${url}`);
            return null;
        }

        const chapterHtml = [];
        contentDiv.find('p, div').each((_, el) => {
            const $el = $(el);
            if ($el.find('img').length) {
                const img = $el.find('img');
                chapterHtml.push(`<p class="image">[Image: ${img.attr('alt') || 'No description'}]</p>`);
            } else {
                const text = $el.text().trim();
                if (text) {
                    chapterHtml.push(`<p class="text">${text}</p>`);
                }
            }
        });

        if (!chapterHtml.length) {
            console.error(`No content extracted from ${url}`);
            return null;
        }

        return `
            <div class="chapter-content">
                <style>
                    .chapter-content p {
                        margin: 1.5em 0;
                        line-height: 1.8;
                    }
                    .chapter-content .text {
                        text-indent: 1.5em;
                    }
                </style>
                ${chapterHtml.join('\n')}
            </div>
        `;
    } catch (error) {
        console.error(`Error processing chapter: ${error}`);
        return null;
    }
}

async function getChapterList($) {
    const chapters = [];
    
    $('section.volume-list').each((_, volumeSection) => {
        $(volumeSection).find('ul.list-chapters li').each((_, chapterItem) => {
            const link = $(chapterItem).find('a');
            if (link.length) {
                chapters.push({
                    url: `https://ln.hako.vn${link.attr('href')}`,
                    title: link.text().trim()
                });
            }
        });
    });

    console.log(`Total chapters found: ${chapters.length}`);
    return chapters;
}

async function crawlNovel(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(data);
        const { title, author } = await extractNovelInfo($);
        const chapters = await getChapterList($);

        // Process chapters with rate limiting
        const processedChapters = [];
        for (const chapter of chapters) {
            console.log(`Processing chapter: ${chapter.title}`);
            const content = await getChapterContent(chapter.url);
            if (content) {
                processedChapters.push({
                    ...chapter,
                    content
                });
            }
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return {
            title,
            author,
            chapters: processedChapters
        };
    } catch (error) {
        console.error(`Error crawling novel: ${error}`);
        throw error;
    }
}

module.exports = {
    crawlNovel,
    getChapterContent,
    extractNovelInfo
};