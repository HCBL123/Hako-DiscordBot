const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

async function convertToEpub(url) {
    return new Promise((resolve, reject) => {
        const pythonScriptPath = path.resolve(__dirname, '../../src/epub_generator.py');
        
        const pythonProcess = spawn('python', [pythonScriptPath, url]);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
            // Log the output to help with debugging
            console.log('Python output:', data.toString());
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
            console.error(`Python Error: ${data}`);
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                return reject(new Error(`Python process failed: ${errorData}`));
            }

            // Look for EPUB file in the output using different patterns
            const epubFileMatch = outputData.match(/EPUB created successfully: (.+\.epub)/i) || 
                                outputData.match(/Generated EPUB: (.+\.epub)/i) ||
                                outputData.match(/[a-z0-9_-]+\.epub/i);

            if (epubFileMatch) {
                const epubPath = epubFileMatch[1] || epubFileMatch[0];
                // Get absolute path
                const absolutePath = path.isAbsolute(epubPath) ? 
                    epubPath : 
                    path.resolve(process.cwd(), epubPath);

                try {
                    await fs.access(absolutePath);
                    resolve(absolutePath);
                } catch (err) {
                    reject(new Error(`EPUB file not found at path: ${absolutePath}`));
                }
            } else {
                reject(new Error('Could not find generated EPUB file path in output'));
            }
        });
    });
}

module.exports = { convertToEpub };