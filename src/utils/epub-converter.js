const { crawlNovel } = require('./crawler');
const epub = require('epub-gen');
const path = require('path');

async function convertToEpub(url) {
    try {
        const novel = await crawlNovel(url);
        
        const options = {
            title: novel.title,
            author: novel.author,
            content: novel.chapters.map(chapter => ({
                title: chapter.title,
                data: chapter.content
            })),
            tempDir: path.join(__dirname, '../../temp'),
            css: `
                .chapter-content p {
                    margin: 1.5em 0;
                    line-height: 1.8;
                }
                .chapter-content .text {
                    text-indent: 1.5em;
                }
            `
        };

        const epubFileName = `${novel.title.toLowerCase().replace(/\s+/g, '_')}.epub`;
        const epubPath = path.join(process.cwd(), epubFileName);
        
        await new epub(options, epubPath).promise;
        console.log(`EPUB created successfully: ${epubPath}`);
        return epubPath;
    } catch (error) {
        console.error('Error converting to EPUB:', error);
        throw error;
    }
}

module.exports = { convertToEpub };