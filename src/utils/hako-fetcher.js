const axios = require('axios');
const cheerio = require('cheerio');

async function getPopularStories() {
    try {
        const response = await axios.get('https://ln.hako.vn/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        const $ = cheerio.load(response.data);
        const stories = [];

        // Find all story items
        $('.popular-thumb-item').each((_, item) => {
            const titleDiv = $(item).find('.thumb_attr.series-title');
            if (titleDiv.length && titleDiv.find('a').length) {
                const titleLink = titleDiv.find('a');
                const title = titleLink.attr('title');
                const url = 'https://ln.hako.vn' + titleLink.attr('href');

                // Find background image URL
                const bgDiv = $(item).find('.content.img-in-ratio');
                const style = bgDiv.attr('style') || '';
                const imageMatch = style.match(/url\('([^']+)'\)/);
                const image = imageMatch ? imageMatch[1] : null;

                if (title && url && image) {
                    stories.push({ title, url, image });
                }
            }
        });

        return stories;
    } catch (error) {
        console.error('Error fetching popular stories:', error);
        throw error;
    }
}

module.exports = { getPopularStories };