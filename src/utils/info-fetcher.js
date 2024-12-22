const { spawn } = require('child_process');
const path = require('path');

async function getNovelInfo(url) {
    return new Promise((resolve, reject) => {
        const env = Object.assign({}, process.env, { 
            PYTHONIOENCODING: 'utf-8',
            PYTHONUNBUFFERED: '1'
        });
        
        const pythonProcess = spawn('python', [
            path.resolve(__dirname, '../../src/bot.py'),
            url
        ], {
            env: env,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            const text = data.toString('utf8');
            outputData += text;
            console.log('Python output:', text);
        });

        pythonProcess.stderr.on('data', (data) => {
            const text = data.toString('utf8');
            errorData += text;
            console.error('Python error:', text);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Python process failed: ${errorData}`));
            }

            try {
                const info = {
                    title: extractInfo(outputData, 'Title'),
                    author: extractInfo(outputData, 'Author'),
                    translator: extractInfo(outputData, 'Translator'),
                    group: extractInfo(outputData, 'Translation Group'),
                    wordCount: extractInfo(outputData, 'Word count'),
                    rating: extractInfo(outputData, 'Rating'),
                    views: extractInfo(outputData, 'Views')
                };

                // Log the collected info for debugging
                console.log('Collected info:', info);

                // Relax the validation to accept if we have at least title or author
                if (info.title !== 'Unknown' || info.author !== 'Unknown') {
                    resolve(info);
                } else {
                    reject(new Error('No valid novel information found'));
                }
            } catch (error) {
                reject(new Error(`Failed to parse novel info: ${error.message}`));
            }
        });
    });
}

function extractInfo(output, key) {
    try {
        const regex = new RegExp(`${key}:\\s*([^\\n\\r]+)`, 'i');
        const match = output.match(regex);
        
        if (match && match[1] && match[1].trim()) {
            const value = match[1].trim().replace(/\r/g, '');
            console.log(`Extracted ${key}:`, value);
            return value;
        }
        
        console.log(`No match found for ${key} in output`);
        return 'Unknown';
    } catch (e) {
        console.error(`Error extracting ${key}:`, e);
        return 'Unknown';
    }
}

module.exports = { getNovelInfo };