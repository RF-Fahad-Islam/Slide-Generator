import fs from 'fs';
import path from 'path';
import https from 'https';

const fontsDir = path.resolve('public/fonts');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (targetUrl) => {
      https.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return request(response.headers.location);
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: Status code ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    request(url);
  });
}

async function run() {
  const destPath = path.join(fontsDir, 'NotoSansBengali-Regular.woff2');
  const url = 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-bengali@latest/bengali-400-normal.woff2';
  try {
    console.log('Downloading NotoSansBengali-Regular.woff2...');
    await downloadFile(url, destPath);
    console.log('Saved NotoSansBengali-Regular.woff2');
  } catch (e) {
    console.error('Error downloading NotoSansBengali:', e.message);
  }
}

run();
